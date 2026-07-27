import { AppError } from "../errors/AppError.js"
import { validateUuid } from "../utils/uuid.js"

const MIN_QUERY_LENGTH = 2
const MAX_QUERY_LENGTH = 100

export function validateStudentId(id: string): string {
  return validateUuid(id, "id")
}

/**
 * Normalize raw input into an RPC-ready query
 * 
 * Replaces SQL pattern matchers (%, _, \\) in the input with SQL literals
 */
export function toSearchQuery(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replaceAll("\\", "\\\\") // \ becomes \\
    .replaceAll("%", "\\%")   // % becomes \%
    .replaceAll("_", "\\_");  // _ becomes \_
}

/**
 * Normalizes the raw `q` param. Returns `null` for a query too short to search on — this is the
 * idle state, not an error, so the caller returns an empty result set rather than a 400.
 */
export function validateStudentSearchQuery(raw: string): string | null {
  const normalized = toSearchQuery(raw)

  if (normalized.length > MAX_QUERY_LENGTH) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `q must be at most ${MAX_QUERY_LENGTH} characters` })
  }

  if (normalized.length < MIN_QUERY_LENGTH) {
    return null
  }

  return normalized
}
