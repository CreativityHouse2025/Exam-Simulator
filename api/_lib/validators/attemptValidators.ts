import { AppError } from "../errors/AppError.js"
import { assertJsonObject } from "../utils/parseBody.js"
import type { InsertAttemptRequestBody } from "../types.js"

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
