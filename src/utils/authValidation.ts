import { isEmail } from "./format"
import { translate } from "./translation"

const LETTERS_ONLY = /^[\p{L} ]+$/u
const HAS_LETTER = /[a-zA-Z]/
const HAS_DIGIT = /\d/
const MIN_PASSWORD_LENGTH = 8

/** Validates an email address. Returns an error string or empty string if valid. */
export function validateEmail(email: string): string {
  if (!email.trim()) return translate('auth.errors.email-required')
  if (!isEmail(email)) return translate('auth.errors.email-invalid')
  return ""
}

/** Validates that a name contains only letters (any language) and spaces. */
export function validateName(value: string, translatedFieldName: string): string {
  if (!LETTERS_ONLY.test(value.trim())) return translate('auth.errors.name-invalid', [translatedFieldName])
  return ""
}

/** Validates a password. Returns an error string or empty string if valid. */
export function validatePassword(password: string): string {
  if (!password) return translate('auth.errors.password-required')
  if (password.length < MIN_PASSWORD_LENGTH) return translate('auth.errors.password-too-short')
  if (!HAS_LETTER.test(password)) return translate('auth.errors.password-no-letter')
  if (!HAS_DIGIT.test(password)) return translate('auth.errors.password-no-digit')
  return ""
}

/** Validates that confirm password matches password. */
export function validateConfirmPassword(password: string, confirm: string): string {
  if (!confirm) return translate('auth.errors.confirm-required')
  if (password !== confirm) return translate('auth.errors.confirm-mismatch')
  return ""
}

/** Validates that a field is not empty. Caller passes the already-translated field name. */
export function validateRequired(value: string, translatedFieldName: string): string {
  if (!value.trim()) return translate('auth.errors.required', [translatedFieldName])
  return ""
}
