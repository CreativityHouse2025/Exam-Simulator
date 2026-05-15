import { supabaseAdmin } from "../supabaseClient.js"
import { AppError } from "../errors/AppError.js"
import type { InsertAttemptRequestBody, ListAttemptsResult, GetAttemptResult, SaveAttemptRequestBody } from "../types.js"

/**
 * Persists a new exam attempt and its question rows.
 * The frontend assembles the exam; this function is a pure persistence call.
 *
 * @throws {AppError} 500 `ATTEMPT_CREATE_FAILED` — DB insert failed.
 */
export async function insertAttempt(userId: string, input: InsertAttemptRequestBody): Promise<{ attempt_id: string }> {
  const { exam_type, exam_id, category_id, question_ids, choices_orders, duration_minutes } = input

  const questions = question_ids.map((question_id, i) => ({ question_id, choices_order: choices_orders[i] }))

  // Single atomic statement: inserts exam_attempts + all exam_attempt_questions in one RPC call.
  const { data: attemptId, error } = await supabaseAdmin.rpc("insert_attempt", {
    p_user_id: userId,
    p_exam_type: exam_type,
    p_exam_id: exam_id ?? null,
    p_category_id: category_id ?? null,
    p_time_remaining: duration_minutes * 60,
    p_questions: questions,
  })

  if (error || !attemptId) {
    throw new AppError({ statusCode: 500, code: "ATTEMPT_CREATE_FAILED", message: "Failed to create exam attempt" })
  }

  return { attempt_id: attemptId }
}

/**
 * Persists in-progress state or handles the in-progress → completed transition.
 *
 * @throws {AppError} 404 `NOT_FOUND` — attempt does not exist.
 * @throws {AppError} 403 `FORBIDDEN` — attempt belongs to a different user.
 * @throws {AppError} 409 `CONFLICT` — attempt is already completed.
 * @throws {AppError} 500 `ATTEMPT_SAVE_FAILED` — DB update failed.
 */
export async function saveAttempt(userId: string, attemptId: string, input: SaveAttemptRequestBody): Promise<void> {
  const { data: attempt, error: fetchError } = await supabaseAdmin
    .from("exam_attempts")
    .select("id, user_id, exam_state")
    .eq("id", attemptId)
    .single()

  if (fetchError || !attempt) {
    throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Attempt not found" })
  }

  if (attempt.user_id !== userId) {
    throw new AppError({ statusCode: 403, code: "FORBIDDEN", message: "Access denied" })
  }

  if (attempt.exam_state !== "in-progress") {
    throw new AppError({ statusCode: 409, code: "CONFLICT", message: "Attempt is already completed" })
  }

  const baseUpdate = {
    current_index: input.current_index,
    time_remaining: input.time_remaining,
    exam_state: input.exam_state,
    review_state: input.review_state,
  }

  // If it's a completed attempt then update score, status and email state
  // Otherwise update the base data
  const attemptUpdate =
    input.exam_state === "completed"
      ? { ...baseUpdate, score: input.score, status: input.status, email_report_state: "pending" }
      : baseUpdate

  // Guard the UPDATE with exam_state check to close the TOCTOU window between the
  // SELECT above and this write — a concurrent completion request loses the race.
  const { data: updated, error: updateError } = await supabaseAdmin
    .from("exam_attempts")
    .update(attemptUpdate)
    .eq("id", attemptId)
    .eq("exam_state", "in-progress")
    .select("id")

  if (updateError) {
    throw new AppError({ statusCode: 500, code: "ATTEMPT_SAVE_FAILED", message: "Failed to update attempt" })
  }

  if (!updated || updated.length === 0) {
    throw new AppError({ statusCode: 409, code: "CONFLICT", message: "Attempt is already completed" })
  }

  if (input.answers.length > 0) {
    const rows = input.answers.map((a) => ({
      attempt_id: attemptId,
      question_index: a.question_index,
      question_id: a.question_id,
      choices_order: a.choices_order,
      selected_choices: a.selected_choices,
      is_bookmarked: a.is_bookmarked,
    }))

    const { error: upsertError } = await supabaseAdmin
      .from("exam_attempt_questions")
      .upsert(rows, { onConflict: "attempt_id,question_index" })

    if (upsertError) {
      throw new AppError({ statusCode: 500, code: "ATTEMPT_SAVE_FAILED", message: "Failed to save answers" })
    }
  }
}

/**
 * Returns the authenticated user's last 10 attempts, newest first.
 *
 * @throws {AppError} 500 `INTERNAL_ERROR` — DB query failed.
 */
export async function listAttempts(userId: string): Promise<ListAttemptsResult> {
  const { data, error } = await supabaseAdmin
    .from("exam_attempts")
    .select("id, exam_type, exam_id, category_id, exam_state, score, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) {
    throw new AppError({ statusCode: 500, code: "INTERNAL_ERROR", message: "Failed to fetch attempts" })
  }

  return { attempts: (data ?? []) as ListAttemptsResult["attempts"] }
}

/**
 * Returns a single attempt with all its question rows.
 *
 * @throws {AppError} 404 `NOT_FOUND` — attempt does not exist.
 * @throws {AppError} 403 `FORBIDDEN` — attempt belongs to a different user.
 * @throws {AppError} 500 `INTERNAL_ERROR` — DB query failed.
 */
export async function getAttempt(userId: string, attemptId: string): Promise<GetAttemptResult> {
  const { data, error } = await supabaseAdmin
    .from("exam_attempts")
    .select(
      "id, user_id, exam_type, exam_id, category_id, exam_state, score, status, created_at, current_index, time_remaining, review_state, email_report_state, exam_attempt_questions(question_index, question_id, choices_order, selected_choices, is_bookmarked)"
    )
    .eq("id", attemptId)
    .order("question_index", { referencedTable: "exam_attempt_questions", ascending: true })
    .single()

  if (error || !data) {
    throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Attempt not found" })
  }

  if (data.user_id !== userId) {
    throw new AppError({ statusCode: 403, code: "FORBIDDEN", message: "Access denied" })
  }

  const { user_id: _user_id, exam_attempt_questions: questions, ...attemptRow } = data

  return { attempt: attemptRow as GetAttemptResult["attempt"], questions: questions ?? [] }
}
