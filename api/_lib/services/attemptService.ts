import { supabaseAdmin } from "../supabaseClient.js"
import { AppError } from "../errors/AppError.js"
import type { InsertAttemptRequestBody } from "../types.js"

/**
 * Persists a new exam attempt and its question rows.
 * The frontend assembles the exam; this function is a pure persistence call.
 *
 * @throws {AppError} 500 `ATTEMPT_CREATE_FAILED` — DB insert failed.
 */
export async function insertAttempt(userId: string, input: InsertAttemptRequestBody): Promise<{ attempt_id: string }> {
  const { exam_type, exam_id, category_id, question_ids, choices_orders, duration_minutes } = input

  const { data: attempt, error: attemptError } = await supabaseAdmin
    .from("exam_attempts")
    .insert({
      user_id: userId,
      exam_type,
      exam_id: exam_id ?? null,
      category_id: category_id ?? null,
      time_remaining: duration_minutes * 60, // DB stores time in seconds
    })
    .select("id")
    .single()

  if (attemptError || !attempt) {
    throw new AppError({ statusCode: 500, code: "ATTEMPT_CREATE_FAILED", message: "Failed to create exam attempt" })
  }

  const questionRows = question_ids.map((question_id, i) => ({
    attempt_id: attempt.id,
    question_index: i,
    question_id,
    choices_order: choices_orders[i],
  }))

  const { error: questionsError } = await supabaseAdmin.from("exam_attempt_questions").insert(questionRows)

  if (questionsError) {
    throw new AppError({ statusCode: 500, code: "ATTEMPT_CREATE_FAILED", message: "Failed to insert attempt questions" })
  }

  return { attempt_id: attempt.id }
}
