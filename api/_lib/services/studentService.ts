import { supabaseAdmin } from "../supabaseClient.js";
import { AppError } from "../errors/AppError.js";
import { getRecentAttemptsByUserId } from "./attemptService.js";
import type { SearchStudentsResult, StudentAttemptsResult } from "../types.js";

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
): Promise<SearchStudentsResult> {
  if (query === null) {
    return { students: [] };
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

  return { students: (data ?? []) as SearchStudentsResult["students"] };
}

/**
 * Returns a student's profile and their attempts, newest first.
 *
 * @throws {AppError} 404 `NOT_FOUND` — no such student, or the target user isn't a student.
 * @throws {AppError} 500 `INTERNAL_ERROR` — DB query failed.
 */
export async function getStudentAttempts(
  studentId: string,
): Promise<StudentAttemptsResult> {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("users")
    .select("id, first_name, last_name, created_at, role")
    .eq("id", studentId)
    .single();

  if (profileError || !profile || profile.role !== "student") {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Student not found",
    });
  }

  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.getUserById(studentId);

  if (authError || !authData.user?.email) {
    throw new AppError({
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: "Failed to load student email",
    });
  }

  const { attempts } = await getRecentAttemptsByUserId(studentId, 15);

  return {
    student: {
      id: profile.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: authData.user.email,
      created_at: profile.created_at,
    },
    attempts,
  };
}
