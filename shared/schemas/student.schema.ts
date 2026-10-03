import { z } from "zod";
import { EnrolledTrackSchema } from "./track.schema.js";

export const MIN_SEARCH_QUERY_LENGTH = 2;
export const MAX_SEARCH_QUERY_LENGTH = 100;

/** `\\`, `%` and `_` are LIKE wildcards in Postgres and must be escaped before they reach the RPC. */
const ESCAPE_LIKE_METACHARS = /[\\%_]/g;

export const StudentIdSchema = z.uuid({ error: "id must be a valid UUID" });

/** A student as a supervisor sees them. Never carries anything about their answers. */
export const StudentProfileSchema = z.object({
  id: StudentIdSchema,
  first_name: z.string(),
  last_name: z.string(),
  email: z.email(),
  created_at: z.string(),
});

export type StudentProfile = z.infer<typeof StudentProfileSchema>;

/** GET /api/students?q= — search hits, profile only. Tracks come from the detail call. */
export const StudentListSchema = z.object({
  students: z.array(StudentProfileSchema),
});

export type StudentList = z.infer<typeof StudentListSchema>;

/**
 * GET /api/students/:id — one student in full: their profile and the tracks they hold an ACTIVE
 * enrollment in. This is what a supervisor opens a search hit into.
 */
export const StudentDetailsSchema = StudentProfileSchema.extend({
  tracks: z.array(EnrolledTrackSchema),
});

export type StudentDetails = z.infer<typeof StudentDetailsSchema>;

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
  );
