import type { GenerateReportRequestBody, LangCode, ReportChoice, ReportQuestion, ReportTranslations } from "../types.js"
import { AppError } from "../errors/AppError.js"
import { assertJsonObject } from "../utils/parseBody.js"

const LANG_CODES: LangCode[] = ["ar", "en"]
const MAX_FULL_NAME_LENGTH = 200
const TRANSLATION_FIELDS = ["companyName", "reportTitle", "missing", "correct", "incorrect", "explanation", "fullName"] as const

function validateChoice(value: unknown, path: string): ReportChoice {
  const record = assertJsonObject(value)

  if (typeof record.text !== "string" || record.text.trim().length === 0) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `${path}.text must be a non-empty string` })
  }

  if (typeof record.correct !== "boolean") {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `${path}.correct must be a boolean` })
  }

  return { text: record.text, correct: record.correct }
}

function validateQuestion(value: unknown, index: number): ReportQuestion {
  const path = `exam[${index}]`
  const record = assertJsonObject(value)

  if (typeof record.id !== "number") {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `${path}.id must be a number` })
  }

  if (typeof record.type !== "string" || record.type.trim().length === 0) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `${path}.type must be a non-empty string` })
  }

  if (typeof record.categoryId !== "number") {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `${path}.categoryId must be a number` })
  }

  if (typeof record.text !== "string" || record.text.trim().length === 0) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `${path}.text must be a non-empty string` })
  }

  if (typeof record.explanation !== "string") {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `${path}.explanation must be a string` })
  }

  if (!Array.isArray(record.choices) || record.choices.length === 0) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `${path}.choices must be a non-empty array` })
  }

  const choices = record.choices.map((c, i) => validateChoice(c, `${path}.choices[${i}]`))

  if (!Array.isArray(record.answer)) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `${path}.answer must be an array` })
  }

  const answer = record.answer as unknown[]
  if (answer.some((a) => typeof a !== "number")) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `${path}.answer must be an array of numbers` })
  }

  return {
    id: record.id,
    type: record.type,
    categoryId: record.categoryId,
    text: record.text,
    explanation: record.explanation,
    choices,
    answer: answer as number[],
  }
}

function validateTranslations(value: unknown): ReportTranslations {
  const record = assertJsonObject(value)

  for (const field of TRANSLATION_FIELDS) {
    if (typeof record[field] !== "string") {
      throw new AppError({ statusCode: 400, code: "MISSING_FIELDS", message: `Missing required translation field: ${field}` })
    }
  }

  return {
    companyName: record.companyName as string,
    reportTitle: record.reportTitle as string,
    missing: record.missing as string,
    correct: record.correct as string,
    incorrect: record.incorrect as string,
    explanation: record.explanation as string,
    fullName: record.fullName as string,
  }
}

/**
 * Validates and returns a typed `GenerateReportRequestBody` from an unknown input.
 * Throws `AppError` on the first validation failure.
 */
export function validateReportBody(body: unknown): GenerateReportRequestBody {
  const record = assertJsonObject(body)

  if (!Array.isArray(record.exam) || record.exam.length === 0) {
    throw new AppError({ statusCode: 400, code: "MISSING_FIELDS", message: "exam must be a non-empty array" })
  }

  if (!Array.isArray(record.userAnswers)) {
    throw new AppError({ statusCode: 400, code: "MISSING_FIELDS", message: "userAnswers must be an array" })
  }

  if (record.userAnswers.length !== record.exam.length) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "userAnswers length must match exam length",
    })
  }

  if (typeof record.langCode !== "string" || !LANG_CODES.includes(record.langCode as LangCode)) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `langCode must be one of: ${LANG_CODES.join(", ")}` })
  }

  if (typeof record.userFullName !== "string" || record.userFullName.trim().length === 0) {
    throw new AppError({ statusCode: 400, code: "MISSING_FIELDS", message: "userFullName must be a non-empty string" })
  }

  if (record.userFullName.length > MAX_FULL_NAME_LENGTH) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: `userFullName must be at most ${MAX_FULL_NAME_LENGTH} characters`,
    })
  }

  const exam = record.exam.map((q, i) => validateQuestion(q, i))

  const userAnswers = (record.userAnswers as unknown[]).map((entry, i) => {
    if (!Array.isArray(entry)) {
      throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `userAnswers[${i}] must be an array` })
    }
    if ((entry as unknown[]).some((a) => typeof a !== "number")) {
      throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `userAnswers[${i}] must be an array of numbers` })
    }
    return entry as number[]
  })

  const translations = validateTranslations(record.translations)

  return {
    exam,
    userAnswers,
    langCode: record.langCode as LangCode,
    userFullName: record.userFullName.trim(),
    translations,
  }
}
