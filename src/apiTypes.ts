/**
 * Frontend-facing, camelCase mirrors of the shared (snake_case, wire-format) schema types.
 * Services map a response into these with `camelcaseKeys(data, { deep: true })` before returning
 * it — components never see snake_case. Each alias is derived, not hand-written, so it can never
 * drift from the wire contract in `shared/schemas/`.
 */
import type { CamelCaseKeys } from "camelcase-keys";
import type {
  Track as SharedTrack,
  EnrolledTrack as SharedEnrolledTrack,
} from "@shared/track.schema";
import type {
  BilingualText,
  ExamType as SharedExamType,
  ExamConfig as SharedExamConfig,
  ExamConfigBreak as SharedExamConfigBreak,
  Exam as SharedExam,
  ExamDetails as SharedExamDetails,
  Choice as SharedChoice,
  DisclosedChoice as SharedDisclosedChoice,
  Question as SharedQuestion,
  DisclosedQuestion as SharedDisclosedQuestion,
  TrackExams as SharedTrackExams,
  ExamWithQuestions as SharedExamWithQuestions,
} from "@shared/exam.schema";
import type {
  AttemptSummary as SharedAttemptSummary,
  AttemptDetail as SharedAttemptDetail,
  AttemptQuestion as SharedAttemptQuestion,
  DisclosedAttemptQuestion as SharedDisclosedAttemptQuestion,
  AttemptWithQuestions as SharedAttemptWithQuestions,
  AttemptWithExam as SharedAttemptWithExam,
  Revision as SharedRevision,
} from "@shared/attempt.schema";
import type {
  User as SharedUser,
  UserWithTracks as SharedUserWithTracks,
} from "@shared/user.schema";
import type { StudentProfile as SharedStudentProfile } from "@shared/student.schema";

// Already camelCase-safe (single-word ar/en keys) — re-exported so callers never import @shared directly.
export type { BilingualText };

export type Track = CamelCaseKeys<SharedTrack, true>;
export type EnrolledTrack = CamelCaseKeys<SharedEnrolledTrack, true>;

export type ExamType = CamelCaseKeys<SharedExamType, true>;
export type ExamConfigBreak = CamelCaseKeys<SharedExamConfigBreak, true>;

/**
 * `passingRate: null` and `persist: false` are frontend-only states, never on the wire — they
 * exist for exactly one config, REVISION_CONFIG (constants.ts): a revision session is never
 * graded and never written to the DB. Every real config a service returns sets `persist: true`
 * and always carries a real `passingRate`.
 */
export type ExamConfig = Omit<
  CamelCaseKeys<SharedExamConfig, true>,
  "passingRate"
> & {
  passingRate: number | null;
  persist: boolean;
};
export type Exam = CamelCaseKeys<SharedExam, true>;
export type ExamDetails = Omit<
  CamelCaseKeys<SharedExamDetails, true>,
  "config"
> & { config: ExamConfig };
export type Choice = CamelCaseKeys<SharedChoice, true>;
export type DisclosedChoice = CamelCaseKeys<SharedDisclosedChoice, true>;
export type Question = CamelCaseKeys<SharedQuestion, true>;
export type DisclosedQuestion = CamelCaseKeys<SharedDisclosedQuestion, true>;
export type TrackExams = Omit<
  CamelCaseKeys<SharedTrackExams, true>,
  "exams"
> & { exams: ExamDetails[] };
export type ExamWithQuestions = Omit<
  CamelCaseKeys<SharedExamWithQuestions, true>,
  "exam"
> & { exam: ExamDetails };

export type AttemptSummary = Omit<
  CamelCaseKeys<SharedAttemptSummary, true>,
  "configSnapshot"
> & {
  configSnapshot: ExamConfig;
};
export type AttemptDetail = Omit<
  CamelCaseKeys<SharedAttemptDetail, true>,
  "configSnapshot"
> & {
  configSnapshot: ExamConfig;
};
export type AttemptQuestion = CamelCaseKeys<SharedAttemptQuestion, true>;
export type DisclosedAttemptQuestion = CamelCaseKeys<
  SharedDisclosedAttemptQuestion,
  true
>;
export type AttemptWithQuestions = Omit<
  CamelCaseKeys<SharedAttemptWithQuestions, true>,
  "attempt"
> & {
  attempt: AttemptDetail;
};
export type AttemptWithExam = Omit<
  CamelCaseKeys<SharedAttemptWithExam, true>,
  "attempt"
> & { attempt: AttemptDetail };

/**
 * Never on the wire — `submit_attempt` writes the grade to the row (score, status,
 * wrong_questions) instead of returning it, so this is assembled client-side from those same
 * fields on a completed `AttemptDetail`/`AttemptSummary`, or by `utils/results.ts
 * computeLocalResult` for a session that is never persisted (preview, revision).
 * `status: null` is the one frontend-only state: an ungraded config (`ExamConfig.passingRate ===
 * null`, i.e. revision) has no pass/fail. Every persisted result's status is "pass" or "fail".
 */
export type AttemptResult = {
  score: number;
  status: "pass" | "fail" | null;
  wrongQuestions: number;
  totalQuestions: number;
};
export type Revision = CamelCaseKeys<SharedRevision, true>;

export type User = CamelCaseKeys<SharedUser, true>;
export type UserWithTracks = CamelCaseKeys<SharedUserWithTracks, true>;
export type StudentProfile = CamelCaseKeys<SharedStudentProfile, true>;

/** Stamps a real, wire-derived config as persisted. Every service that maps a config calls this. */
export function markPersisted(
  config: CamelCaseKeys<SharedExamConfig, true>,
): ExamConfig {
  return { ...config, persist: true };
}
