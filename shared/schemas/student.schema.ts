import { z } from "zod"
import { AttemptSummarySchema } from "./attempt.schema.js"

export const MIN_SEARCH_QUERY_LENGTH = 2
export const MAX_SEARCH_QUERY_LENGTH = 100

/** `\\`, `%` and `_` are LIKE wildcards in Postgres and must be escaped before they reach the RPC. */
const ESCAPE_LIKE_METACHARS = /[\\%_]/g

export const StudentIdSchema = z.uuid({ error: "id must be a valid UUID" })

export const StudentSearchResultSchema = z.object({
  id: z.uuid(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.email(),
  created_at: z.string(),
})

export type StudentSearchResult = z.infer<typeof StudentSearchResultSchema>

export const SearchStudentsResultSchema = z.object({
  students: z.array(StudentSearchResultSchema),
})

export type SearchStudentsResult = z.infer<typeof SearchStudentsResultSchema>

export const StudentAttemptsResultSchema = z.object({
  student: StudentSearchResultSchema,
  attempts: z.array(AttemptSummarySchema),
})

export type StudentAttemptsResult = z.infer<typeof StudentAttemptsResultSchema>

/**
 * Normalises the raw `q` param into an RPC-ready LIKE pattern.
 *
 * Escaping runs before the length check because escaping can grow the string — a query of 60 `%`
 * characters becomes 120 after escaping, and it is the escaped length the database sees.
 *
 * Yields `null` for a query too short to search on. That is the idle state, not an error, so the
 * handler returns an empty result set rather than a 400.
 */
export const StudentSearchQuerySchema = z
  .string()
  .transform((raw) =>
    raw
      .trim()
      .toLowerCase()
      .replace(ESCAPE_LIKE_METACHARS, (char) => "\\" + char),
  )
  .pipe(
    z.string().max(MAX_SEARCH_QUERY_LENGTH, {
      error: `q must be at most ${MAX_SEARCH_QUERY_LENGTH} characters`,
    }),
  )
  .transform((escaped) =>
    escaped.length < MIN_SEARCH_QUERY_LENGTH ? null : escaped,
  )
