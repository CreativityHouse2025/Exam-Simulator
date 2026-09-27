import { sql } from "drizzle-orm";
import type { StudentList } from "../../../shared/schemas/student.schema.js";
import { db, parseRows, runQuery } from "../db/client.js";
import { StudentSearchRowSchema } from "../db/schema.js";

/**
 * Searches students by name/email prefix through the `search_students` Postgres function, which
 * joins `auth.users` for the email — a schema the API does not map.
 * A `null` query (too short to search on) short-circuits to an empty result — this is the
 * idle state, not a failed search.
 *
 * @throws {AppError} 500 `INTERNAL_ERROR` — DB query failed.
 */
export async function searchStudentsByEmailOrName(
  query: string | null,
  rowLimit: number = 30
): Promise<StudentList> {
  if (query === null) {
    return { students: [] };
  }

  // `query` arrives lowercased and wildcard-escaped by StudentSearchQuerySchema.
  const rows = await runQuery(
    "Failed to search students",
    db.execute(sql`select * from public.search_students(${query}, ${rowLimit})`),
  );

  return { students: parseRows("search_students", StudentSearchRowSchema, rows) };
}
