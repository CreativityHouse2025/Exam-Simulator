import { queryOptions } from "@tanstack/react-query";
import {
  searchStudents,
  getStudent,
  getStudentAttempts,
} from "./student.service";

/** query must already be trimmed and >= the minimum search length. */
export const createStudentSearchQueryOptions = (query: string) =>
  queryOptions({
    queryKey: ["students", "search", query],
    queryFn: ({ signal }) => searchStudents(query, signal),
    enabled: query.length >= 2,
    staleTime: 3 * 60 * 1000, // refresh each 3 minutes
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
export const createStudentAttemptsQueryOptions = (
  id: string,
  trackId: string,
) =>
  queryOptions({
    queryKey: ["students", id, "attempts", trackId],
    queryFn: ({ signal }) => getStudentAttempts(id, trackId, signal),
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
/** A student's profile and the tracks they hold an active enrollment in — what a supervisor opens a search hit into. */
export const createStudentQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["students", id],
    queryFn: () => getStudent(id),
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
