import camelcaseKeys from "camelcase-keys";
import { AppApiError } from "@/core/errors";
import { apiFetch } from "@/core/api/apiFetch";
import type { ApiResponse } from "@shared/api.schema";
import type { StudentList as SharedStudentList } from "@shared/student.schema";
import type { AttemptList as SharedAttemptList } from "@shared/attempt.schema";
import type { UserWithTracks as SharedUserWithTracks } from "@shared/user.schema";
import { markPersisted } from "@/core/api/apiTypes";
import { attemptPageQuery } from "@/core/services/attempt.service";
import type {
  Attempt,
  AttemptList,
  AttemptPage,
  StudentProfile,
  UserWithTracks,
} from "@/core/api/apiTypes";

export async function searchStudents(
  query: string,
  signal?: AbortSignal,
): Promise<StudentProfile[]> {
  const response = await apiFetch(
    `/api/students?q=${encodeURIComponent(query)}`,
    { handleUnauthorized: true, signal },
  );
  const result: ApiResponse<SharedStudentList> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "students");
  }

  return camelcaseKeys(result.data.students, { deep: true });
}

/** A student's profile and the tracks they hold an active enrollment in. */
export async function getStudent(id: string): Promise<UserWithTracks> {
  const response = await apiFetch(`/api/students/${id}`, {
    handleUnauthorized: true,
  });
  const result: ApiResponse<SharedUserWithTracks> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "students");
  }

  return camelcaseKeys(result.data, { deep: true });
}

export async function getStudentAttempts(
  id: string,
  trackId: string,
  page: AttemptPage,
  signal?: AbortSignal,
): Promise<AttemptList> {
  const response = await apiFetch(
    `/api/students/${id}/attempts?${attemptPageQuery(trackId, page)}`,
    { handleUnauthorized: true, signal },
  );
  const result: ApiResponse<SharedAttemptList> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "students");
  }

  // The backend pairs examState and result; the cast restores that pairing.
  const attempts = camelcaseKeys(result.data.attempts, { deep: true }).map(
    (attempt) =>
      ({
        ...attempt,
        configSnapshot: markPersisted(attempt.configSnapshot),
      }) as Attempt,
  );

  return { attempts, total: result.data.total };
}
