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


  // TODO: remove validated body logging
  console.log("[insertAttempt]", JSON.stringify({
    exam_type,
    exam_id,
    category_id,
    duration_minutes,
    question_count: questions.length,
    questions,
  }, null, 2))
  
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
  // TODO: remove validated body logging
  console.log("[saveAttempt]", JSON.stringify({
    attemptId,
    userId,
    exam_state: input.exam_state,
    current_index: input.current_index,
    time_remaining: input.time_remaining,
    review_state: input.review_state,
    ...(input.exam_state === "completed" && { score: input.score, status: input.status }),
    answer_count: input.answers.length,
    answers: input.answers,
  }, null, 2))

  const { data: result, error } = await supabaseAdmin.rpc("save_attempt", {
    p_user_id: userId,
    p_attempt_id: attemptId,
    p_current_index: input.current_index,
    p_time_remaining: input.time_remaining,
    p_exam_state: input.exam_state,
    p_review_state: input.review_state,
    p_score: input.exam_state === "completed" ? input.score : null,
    p_status: input.exam_state === "completed" ? input.status : null,
    p_answers: input.answers,
  })

  if (error) throw new AppError({ statusCode: 500, code: "ATTEMPT_SAVE_FAILED", message: "Failed to save attempt" })
  if (result === "not_found") throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Attempt not found" })
  if (result === "forbidden") throw new AppError({ statusCode: 403, code: "FORBIDDEN", message: "Access denied" })
  if (result === "conflict") throw new AppError({ statusCode: 409, code: "CONFLICT", message: "Attempt is already completed" })
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
