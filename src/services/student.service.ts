import camelcaseKeys from "camelcase-keys";
import { AppApiError } from "../errors";
import { apiFetch } from "../utils/apiFetch";
import type { ApiResponse } from "@shared/api.schema";
import type { StudentList } from "@shared/student.schema";
import type { AttemptList } from "@shared/attempt.schema";
import type { UserWithTracks } from "@shared/user.schema";
import { markPersisted } from "../apiTypes";
import type {
  AttemptSummary,
  StudentProfile,
  UserWithTracks as FrontendUserWithTracks,
} from "../apiTypes";

export async function searchStudents(
  query: string,
  signal?: AbortSignal,
): Promise<StudentProfile[]> {
  const response = await apiFetch(
    `/api/students?q=${encodeURIComponent(query)}`,
    { handleUnauthorized: true, signal },
  );
  const result: ApiResponse<StudentList> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "students");
  }

  return camelcaseKeys(result.data.students, { deep: true });
}

/** A student's profile and the tracks they hold an active enrollment in. */
export async function getStudent(id: string): Promise<FrontendUserWithTracks> {
  const response = await apiFetch(`/api/students/${id}`, {
    handleUnauthorized: true,
  });
  const result: ApiResponse<UserWithTracks> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "students");
  }

  return camelcaseKeys(result.data, { deep: true });
}

export async function getStudentAttempts(
  id: string,
  trackId: string,
  signal?: AbortSignal,
): Promise<AttemptSummary[]> {
  const response = await apiFetch(
    `/api/students/${id}/attempts?trackId=${trackId}`,
    { handleUnauthorized: true, signal },
  );
  const result: ApiResponse<AttemptList> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "students");
  }

  return camelcaseKeys(result.data.attempts, { deep: true }).map((attempt) => ({
    ...attempt,
    configSnapshot: markPersisted(attempt.configSnapshot),
  }));
}
