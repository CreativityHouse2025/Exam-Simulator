import { validate as isValidEmail } from "email-validator"
import type { SignupRequestBody, SigninRequestBody, TokenExchangeRequestBody, PasswordResetRequestBody, UpdatePasswordRequestBody } from "../types.js"
import { AppError } from "../errors/AppError.js"
import { assertJsonObject } from "../utils/parseBody.js"
const LETTERS_ONLY = /^[\p{L} ]+$/u
const HAS_LETTER = /[a-zA-Z]/
const HAS_DIGIT = /\d/
const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 128
const MAX_EMAIL_LENGTH = 254
const MAX_NAME_LENGTH = 100

const REQUIRED_FIELDS = ["email", "password", "first_name", "last_name"] as const

/** Validates a password string against length and complexity requirements. Throws `AppError` on failure. */
function validatePasswordString(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    })
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: `Password must be at most ${MAX_PASSWORD_LENGTH} characters`,
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
}

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
  const password = record.password as string
  const first_name = (record.first_name as string).trim()
  const last_name = (record.last_name as string).trim()

  if (!isValidEmail(email)) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "Invalid email format" })
  }

  if (email.length > MAX_EMAIL_LENGTH) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `Email must be at most ${MAX_EMAIL_LENGTH} characters` })
  }

  if (first_name.length > MAX_NAME_LENGTH) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `First name must be at most ${MAX_NAME_LENGTH} characters` })
  }

  if (last_name.length > MAX_NAME_LENGTH) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `Last name must be at most ${MAX_NAME_LENGTH} characters` })
  }

  if (!LETTERS_ONLY.test(first_name)) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "First name must contain letters only" })
  }

  if (!LETTERS_ONLY.test(last_name)) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "Last name must contain letters only" })
  }

  validatePasswordString(password)

  return { email, password, first_name, last_name }
}

/**
 * Validates and returns a typed `SigninRequestBody` from an unknown input.
 * Throws `AppError` on the first validation failure.
 */
export function validateSigninBody(body: unknown): SigninRequestBody {
  const record = assertJsonObject(body)

  // validate email and password
  for (const field of ["email", "password"] as const) {
    const value = record[field]
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new AppError({ statusCode: 400, code: "MISSING_FIELDS", message: `Missing required field: ${field}` })
    }
  }

  const email = (record.email as string).trim()
  const password = record.password as string

  if (!isValidEmail(email)) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "Invalid email format" })
  }

  if (email.length > MAX_EMAIL_LENGTH) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `Email must be at most ${MAX_EMAIL_LENGTH} characters` })
  }

  // validate force flag
  if (typeof record.force !== "boolean") {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "Missing required field: force" })
  }

  return { email, password, force: record.force }
}

/**
 * Validates and returns a typed `TokenExchangeRequestBody` from an unknown input.
 * Throws `AppError` on the first validation failure.
 */
export function validateTokenExchangeBody(body: unknown): TokenExchangeRequestBody {
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

/**
 * Validates and returns a typed `PasswordResetRequestBody` from an unknown input.
 * Throws `AppError` on the first validation failure.
 */
export function validatePasswordResetBody(body: unknown): PasswordResetRequestBody {
  const record = assertJsonObject(body)

  const email = record.email
  if (typeof email !== "string" || email.trim().length === 0) {
    throw new AppError({ statusCode: 400, code: "MISSING_FIELDS", message: "Missing required field: email" })
  }

  const trimmedEmail = email.trim()
  if (!isValidEmail(trimmedEmail)) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "Invalid email format" })
  }

  if (trimmedEmail.length > MAX_EMAIL_LENGTH) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `Email must be at most ${MAX_EMAIL_LENGTH} characters` })
  }

  return { email: trimmedEmail }
}

/**
 * Validates and returns a typed `UpdatePasswordRequestBody` from an unknown input.
 * Throws `AppError` on the first validation failure.
 */
export function validateUpdatePasswordBody(body: unknown): UpdatePasswordRequestBody {
  const record = assertJsonObject(body)

  const password = record.password
  if (typeof password !== "string" || password.length === 0) {
    throw new AppError({ statusCode: 400, code: "MISSING_FIELDS", message: "Missing required field: password" })
  }

  validatePasswordString(password)

  return { password }
}
