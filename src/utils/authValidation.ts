import { isEmail } from "./format"

/** Validates an email address. Returns an error string or empty string if valid. */
export function validateEmail(email: string): string {
  if (!email.trim()) return "Email is required"
  if (!isEmail(email)) return "Please enter a valid email address"
  return ""
}

/** Validates a password. Returns an error string or empty string if valid. */
export function validatePassword(password: string): string {
  if (!password) return "Password is required"
  if (password.length < 8) return "Password must be at least 8 characters"
  if (!/[a-zA-Z]/.test(password)) return "Password must contain at least one letter"
  if (!/\d/.test(password)) return "Password must contain at least one digit"
  if (!/^[a-zA-Z0-9]+$/.test(password)) return "Password must contain only English letters and digits"
  return ""
}

/** Validates that confirm password matches password. */
export function validateConfirmPassword(password: string, confirm: string): string {
  if (!confirm) return "Please confirm your password"
  if (password !== confirm) return "Passwords do not match"
  return ""
}

/** Validates that a field is not empty. */
export function validateRequired(value: string, fieldName: string): string {
  if (!value.trim()) return `${fieldName} is required`
  return ""
}
