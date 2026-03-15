import type { SignupRequestBody, SigninRequestBody } from "../types.js"
import { AppError } from "../errors/AppError.js"

const EMAIL_PATTERN = /.+@.+\..+/
const HAS_LETTER = /[a-zA-Z]/
const HAS_DIGIT = /\d/
const ALPHANUMERIC_ONLY = /^[a-zA-Z0-9]+$/
const MIN_PASSWORD_LENGTH = 8

const REQUIRED_FIELDS = ["email", "password", "first_name", "last_name"] as const

/**
 * Validates and returns a typed `SignupRequestBody` from an unknown input.
 * Throws `AppError` on the first validation failure.
 */
export function validateSignupBody(body: unknown): SignupRequestBody {
  if (typeof body !== "object" || body === null) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "Request body must be a JSON object" })
  }

  const record = body as Record<string, unknown>

  for (const field of REQUIRED_FIELDS) {
    const value = record[field]
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new AppError({ statusCode: 400, code: "MISSING_FIELDS", message: `Missing required field: ${field}` })
    }
  }

  const email = (record.email as string).trim()
  const password = (record.password as string).trim()
  const first_name = (record.first_name as string).trim()
  const last_name = (record.last_name as string).trim()

  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "Invalid email format" })
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    })
  }

  if (!HAS_LETTER.test(password)) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Password must contain at least one letter",
    })
  }

  if (!HAS_DIGIT.test(password)) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Password must contain at least one digit",
    })
  }

  if (!ALPHANUMERIC_ONLY.test(password)) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Password must contain only English letters and digits",
    })
  }

  return { email, password, first_name: first_name, last_name }
}

/**
 * Validates and returns a typed `SigninRequestBody` from an unknown input.
 * Throws `AppError` on the first validation failure.
 */
export function validateSigninBody(body: unknown): SigninRequestBody {
  if (typeof body !== "object" || body === null) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "Request body must be a JSON object" })
  }

  const record = body as Record<string, unknown>

  for (const field of ["email", "password"] as const) {
    const value = record[field]
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new AppError({ statusCode: 400, code: "MISSING_FIELDS", message: `Missing required field: ${field}` })
    }
  }

  const email = (record.email as string).trim()
  const password = (record.password as string).trim()

  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "Invalid email format" })
  }

  return { email, password }
}
