import { queryOptions } from "@tanstack/react-query";
import { getAttempts } from "../services/attempt.service";
import {
  searchStudents,
  getStudentAttempts,
} from "../services/student.service";

export const createAttemptsQueryOptions = () =>
  queryOptions({
    queryKey: ["attempts"],
    queryFn: getAttempts,
    staleTime: 10 * 60 * 1000, // refresh each 10m
    gcTime: 30 * 60 * 1000, // garbage data after 30m
    retry: 2, // retry 2 time on failure
  });

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

export const createStudentAttemptsQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["students", id, "attempts"],
    queryFn: ({ signal }) => getStudentAttempts(id, signal),
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
