import { supabaseAdmin } from "../supabaseClient.js";
import { AppError } from "../errors/AppError.js";
import type { StudentProfile } from "../../../shared/schemas/student.schema.js";

/**
 * Searches students by name/email prefix via the `search_students` RPC.
 * A `null` query (too short to search on) short-circuits to an empty result — this is the
 * idle state, not a failed search.
 *
 * @throws {AppError} 500 `INTERNAL_ERROR` — DB query failed.
 */
export async function searchStudentsByEmailOrName(
  query: string | null,
  rowLimit: number = 30
): Promise<StudentProfile[]> {
  if (query === null) {
    return [];
  }

  const { data, error } = await supabaseAdmin.rpc("search_students", {
    p_query: query,
    p_limit: rowLimit,
  });  
  

  if (error) {
    throw new AppError({
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: "Failed to search students",
    });
  }

  return (data ?? []) as StudentProfile[];
}
