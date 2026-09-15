import { AppApiError } from "../errors";
import { apiFetch } from "../utils/apiFetch";
import type { ApiResponse } from "@shared/api.schema";
import type {
  SearchStudentsResult,
  StudentAttemptsResult,
  StudentSearchResult,
} from "@shared/student.schema";

export async function searchStudents(
  query: string,
  signal?: AbortSignal,
): Promise<StudentSearchResult[]> {
  const response = await apiFetch(
    `/api/students?q=${encodeURIComponent(query)}`,
    { handleUnauthorized: true, signal },
  );
  const result: ApiResponse<SearchStudentsResult> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "students");
  }

  return result.data.students;
}

export async function getStudentAttempts(
  id: string,
  signal?: AbortSignal,
): Promise<StudentAttemptsResult> {
  const response = await apiFetch(`/api/students/${id}/attempts`, {
    handleUnauthorized: true,
    signal,
  });
  const result: ApiResponse<StudentAttemptsResult> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "students");
  }

  return result.data;
}
