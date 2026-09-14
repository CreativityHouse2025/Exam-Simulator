import { z } from "zod"
import { AuthFieldSchemas } from "@shared/auth.schema"
import { translate } from "./translation"

/**
 * Formats the translation key for the first rule a field broke.
 *
 * @example rule id "password-too-short" -> "auth.errors.password-too-short"
 */
function translationKeyFor(error: z.ZodError<string>): string {
  return `auth.errors.${error.issues[0].message}`
}

/** Validates an email address. Returns an error string or empty string if valid. */
export function validateEmail(email: string): string {
  const result = AuthFieldSchemas.email.safeParse(email)
  return result.success ? "" : translate(translationKeyFor(result.error))
}

/** Validates that a name contains only letters (any language) and spaces. */
export function validateName(value: string, translatedFieldName: string): string {
  const result = AuthFieldSchemas.name.safeParse(value)
  return result.success ? "" : translate(translationKeyFor(result.error), [translatedFieldName])
}

/** Validates a password against the same complexity rules the API applies when setting one. */
export function validatePassword(password: string): string {
  const result = AuthFieldSchemas.newPassword.safeParse(password)
  return result.success ? "" : translate(translationKeyFor(result.error))
}

/**
 * Presence check only, for signing in. Complexity rules belong where a password is *set* — applying
 * them here would lock out any account whose password predates the current rules, even though the
 * API would accept it.
 */
export function validateExistingPassword(password: string): string {
  const result = AuthFieldSchemas.existingPassword.safeParse(password)
  return result.success ? "" : translate(translationKeyFor(result.error))
}

/** Validates that confirm password matches password. Frontend-only — the API never sees this field. */
export function validateConfirmPassword(password: string, confirm: string): string {
  if (!confirm) return translate("auth.errors.confirm-required")
  if (password !== confirm) return translate("auth.errors.confirm-mismatch")
  return ""
}

/** Validates that a field is not empty. Caller passes the already-translated field name. */
export function validateRequired(value: string, translatedFieldName: string): string {
  if (!value.trim()) return translate("auth.errors.required", [translatedFieldName])
  return ""
}
