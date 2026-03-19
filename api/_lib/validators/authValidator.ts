import type { SignupRequestBody, SigninRequestBody, SignupCallbackRequestBody } from "../types.js"
import { AppError } from "../errors/AppError.js"
import { assertJsonObject } from "../utils/parseBody.js"

const EMAIL_PATTERN = /.+@.+\..+/
const LETTERS_ONLY = /^[\p{L} ]+$/u
const HAS_LETTER = /[a-zA-Z]/
const HAS_DIGIT = /\d/
const MIN_PASSWORD_LENGTH = 8

const REQUIRED_FIELDS = ["email", "password", "first_name", "last_name"] as const

/**
 * Validates and returns a typed `SignupRequestBody` from an unknown input.
 * Throws `AppError` on the first validation failure.
 */
export function validateSignupBody(body: unknown): SignupRequestBody {
  const record = assertJsonObject(body)

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

  if (!LETTERS_ONLY.test(first_name)) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "First name must contain letters only" })
  }

  if (!LETTERS_ONLY.test(last_name)) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "Last name must contain letters only" })
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

  return { email, password, first_name, last_name }
}

/**
 * Validates and returns a typed `SigninRequestBody` from an unknown input.
 * Throws `AppError` on the first validation failure.
 */
export function validateSigninBody(body: unknown): SigninRequestBody {
  const record = assertJsonObject(body)

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

/**
 * Validates and returns a typed `SignupCallbackRequestBody` from an unknown input.
 * Throws `AppError` on the first validation failure.
 */
export function validateSignupCallbackBody(body: unknown): SignupCallbackRequestBody {
  const record = assertJsonObject(body)

  for (const field of ["access_token", "refresh_token"] as const) {
    const value = record[field]
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new AppError({ statusCode: 400, code: "MISSING_FIELDS", message: `Missing required field: ${field}` })
    }
  }

  return {
    access_token: (record.access_token as string).trim(),
    refresh_token: (record.refresh_token as string).trim(),
  }
}
