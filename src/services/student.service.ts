import { AppApiError } from "../errors";
import { apiFetch } from "../utils/apiFetch";
import { createErrorCodeTranslator } from "../utils/errorTranslation";
import type { ApiResponse, AppErrorCode } from "@shared/api.schema";
import type {
  SearchStudentsResult,
  StudentAttemptsResult,
  StudentSearchResult,
} from "@shared/student.schema";

type StudentErrorCode = Extract<
  AppErrorCode,
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR"
  | "UNAUTHORIZED"
  | "METHOD_NOT_ALLOWED"
>;

const errorCodeToTranslationKey: Record<StudentErrorCode, string> = {
  NOT_FOUND: "students.errors.server-not-found",
  FORBIDDEN: "students.errors.server-forbidden",
  VALIDATION_ERROR: "students.errors.server-unknown",
  INTERNAL_ERROR: "students.errors.server-unknown",
  UNAUTHORIZED: "students.errors.server-unknown",
  METHOD_NOT_ALLOWED: "students.errors.server-unknown",
};

const translateErrorCode = createErrorCodeTranslator<StudentErrorCode>(
  errorCodeToTranslationKey,
  "students.errors.server-unknown",
);

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
    throw new AppApiError(
      translateErrorCode(result.error.code),
      result.error.code,
    );
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
    throw new AppApiError(
      translateErrorCode(result.error.code),
      result.error.code,
    );
  }

  return result.data;
}
