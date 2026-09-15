import { z } from "zod"
import { UserSchema } from "./user.schema.js"

export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 128
export const MAX_EMAIL_LENGTH = 254
export const MAX_NAME_LENGTH = 100

const LETTERS_ONLY = /^[\p{L} ]+$/u
const HAS_LETTER = /[a-zA-Z]/
const HAS_DIGIT = /\d/

/**
 * Every rule below fails with a stable rule id rather than a sentence. The frontend resolves it to
 * translated copy via `auth.errors.<id>`; the backend surfaces it verbatim in developer-facing logs.
 * Renaming an id is a breaking change for `src/data/langs/*.json`.
 */
const email = z
  .string({ error: "email-required" })
  .trim()
  .min(1, { error: "email-required" })
  .max(MAX_EMAIL_LENGTH, { error: "email-too-long" })
  .pipe(z.email({ error: "email-invalid" }))

const name = z
  .string({ error: "required" })
  .trim()
  .min(1, { error: "required" })
  .max(MAX_NAME_LENGTH, { error: "name-too-long" })
  .regex(LETTERS_ONLY, { error: "name-invalid" })

/** Full complexity rules. Used when a password is being *set*, never when one is being presented. */
const newPassword = z
  .string({ error: "password-required" })
  .min(1, { error: "password-required" })
  .min(MIN_PASSWORD_LENGTH, { error: "password-too-short" })
  .max(MAX_PASSWORD_LENGTH, { error: "password-too-long" })
  .regex(HAS_LETTER, { error: "password-no-letter" })
  .regex(HAS_DIGIT, { error: "password-no-digit" })

/**
 * Presence only. Sign-in must never apply complexity rules: accounts created before a rule existed
 * would be locked out of their own credentials.
 */
const existingPassword = z
  .string({ error: "password-required" })
  .min(1, { error: "password-required" })

export const SignupRequestSchema = z.strictObject({
  email,
  password: newPassword,
  first_name: name,
  last_name: name,
})

export type SignupRequestBody = z.infer<typeof SignupRequestSchema>

export const SigninRequestSchema = z.strictObject({
  email,
  password: existingPassword,
})

export type SigninRequestBody = z.infer<typeof SigninRequestSchema>

export const TokenExchangeRequestSchema = z.strictObject({
  access_token: z
    .string({ error: "required" })
    .trim()
    .min(1, { error: "required" }),
  refresh_token: z
    .string({ error: "required" })
    .trim()
    .min(1, { error: "required" }),
})

export type TokenExchangeRequestBody = z.infer<
  typeof TokenExchangeRequestSchema
>

export const PasswordResetRequestSchema = z.strictObject({ email })

export type PasswordResetRequestBody = z.infer<
  typeof PasswordResetRequestSchema
>

export const UpdatePasswordRequestSchema = z.strictObject({
  password: newPassword,
})

export type UpdatePasswordRequestBody = z.infer<
  typeof UpdatePasswordRequestSchema
>

export const SigninResultSchema = z.object({
  user: UserSchema,
  access_token: z.string(),
  refresh_token: z.string(),
})

export type SigninResult = z.infer<typeof SigninResultSchema>

/** Field-level schemas, exported so per-field form validation matches the request rules exactly. */
export const AuthFieldSchemas = {
  email,
  name,
  newPassword,
  existingPassword,
} as const
