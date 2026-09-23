import { queryOptions } from "@tanstack/react-query";
import { getAttempts } from "../services/attempt.service";
import {
  searchStudents,
  getStudent,
  getStudentAttempts,
} from "../services/student.service";
import { getTrackExams, getExamQuestions } from "../services/exams.service";
import { getTracks } from "../services/track.service";
import type { LangCode } from "../types";

export const createAttemptsQueryOptions = (trackId: string) =>
  queryOptions({
    queryKey: ["attempts", trackId],
    queryFn: () => getAttempts(trackId),
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

export const createTracksQueryOptions = () =>
  queryOptions({
    queryKey: ["tracks"],
    queryFn: getTracks,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });

export const createTrackExamsQueryOptions = (trackId: string) =>
  queryOptions({
    queryKey: ["tracks", trackId, "exams"],
    queryFn: () => getTrackExams(trackId),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });

/** Supervisor-only, fully disclosed content — the question viewer and preview sessions. */
export const createExamQuestionsQueryOptions = (
  examId: number,
  lang: LangCode,
) =>
  queryOptions({
    queryKey: ["exams", examId, "questions", lang],
    queryFn: () => getExamQuestions(examId, lang),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
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
