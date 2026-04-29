import { AppError } from "../errors/AppError.js"
import { assertJsonObject } from "../utils/parseBody.js"
import type { InsertAttemptRequestBody, SaveAttemptRequestBody, SaveAttemptAnswer } from "../types.js"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function validateAttemptId(id: string): string {
  if (!UUID_REGEX.test(id)) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "id must be a valid UUID" })
  }
  return id
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
}

/**
 * Validates and returns a typed `InsertAttemptRequestBody` from an unknown input.
 * Throws `AppError` on the first validation failure.
 */
export function validateInsertAttempt(body: unknown): InsertAttemptRequestBody {
  const record = assertJsonObject(body)

  const { exam_type, exam_id, category_id, question_ids, choices_orders, duration_minutes } = record

  if (exam_type !== "full" && exam_type !== "domain") {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "exam_type must be 'full' or 'domain'" })
  }

  if (exam_type === "full") {
    if (!isPositiveInteger(exam_id)) {
      throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "exam_id must be a positive integer when exam_type is 'full'" })
    }
    if (category_id !== undefined && category_id !== null) {
      throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "category_id must be absent or null when exam_type is 'full'" })
    }
  } else {
    if (!isPositiveInteger(category_id)) {
      throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "category_id must be a positive integer when exam_type is 'domain'" })
    }
    if (exam_id !== undefined && exam_id !== null) {
      throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "exam_id must be absent or null when exam_type is 'domain'" })
    }
  }

  if (!Array.isArray(question_ids) || question_ids.length === 0) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "question_ids must be a non-empty array" })
  }
  if (!question_ids.every(isPositiveInteger)) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "question_ids must contain only positive integers" })
  }

  if (!Array.isArray(choices_orders) || choices_orders.length !== question_ids.length) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "choices_orders must be an array with the same length as question_ids" })
  }
  for (let i = 0; i < choices_orders.length; i++) {
    const order = choices_orders[i]
    if (!Array.isArray(order) || order.length === 0) {
      throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `choices_orders[${i}] must be a non-empty array` })
    }
    if (!order.every(isNonNegativeInteger)) {
      throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `choices_orders[${i}] must contain only non-negative integers` })
    }
  }

  if (!isPositiveInteger(duration_minutes)) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "duration_minutes must be a positive integer" })
  }

  if (exam_type === "full") {
    return { exam_type, exam_id: exam_id as number, category_id: null, question_ids, choices_orders, duration_minutes }
  } else {
    return { exam_type, category_id: category_id as number, exam_id: null, question_ids, choices_orders, duration_minutes }
  }
}

/**
 * Validates and returns a typed `SaveAttemptRequestBody` from an unknown input.
 * Throws `AppError` on the first validation failure.
 */
export function validateSaveAttempt(body: unknown): SaveAttemptRequestBody {
  const record = assertJsonObject(body)

  const { current_index, time_remaining, exam_state, review_state, answers, score, status } = record

  if (!isNonNegativeInteger(current_index)) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "current_index must be a non-negative integer" })
  }

  if (!isNonNegativeInteger(time_remaining)) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "time_remaining must be a non-negative integer" })
  }

  if (exam_state !== "in-progress" && exam_state !== "completed") {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "exam_state must be 'in-progress' or 'completed'" })
  }

  if (review_state !== "summary" && review_state !== "question") {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "review_state must be 'summary' or 'question'" })
  }

  if (!Array.isArray(answers)) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "answers must be an array" })
  }

  const parsedAnswers: SaveAttemptAnswer[] = answers.map((entry, i) => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `answers[${i}] must be an object` })
    }
    const { question_index, selected_choices, is_bookmarked } = entry as Record<string, unknown>

    if (!isNonNegativeInteger(question_index)) {
      throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `answers[${i}].question_index must be a non-negative integer` })
    }
    if (!Array.isArray(selected_choices) || !selected_choices.every(isNonNegativeInteger)) {
      throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `answers[${i}].selected_choices must be an array of non-negative integers` })
    }
    if (typeof is_bookmarked !== "boolean") {
      throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `answers[${i}].is_bookmarked must be a boolean` })
    }

    return { question_index, selected_choices, is_bookmarked }
  })

  if (exam_state === "completed") {
    if (typeof score !== "number" || !isFinite(score) || score < 0 || score > 100) {
      throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "score must be a number between 0 and 100" })
    }
    if (status !== "pass" && status !== "fail") {
      throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "status must be 'pass' or 'fail'" })
    }
    return { exam_state, current_index, time_remaining, review_state, answers: parsedAnswers, score, status }
  }

  if (score !== undefined) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "score must be absent when exam_state is 'in-progress'" })
  }
  if (status !== undefined) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "status must be absent when exam_state is 'in-progress'" })
  }

  return { exam_state, current_index, time_remaining, review_state, answers: parsedAnswers }
}
