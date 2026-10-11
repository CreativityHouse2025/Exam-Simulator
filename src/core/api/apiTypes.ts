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
  Tag as SharedTag,
  ExamConfig as SharedExamConfig,
  ExamConfigBreak as SharedExamConfigBreak,
  Exam as SharedExam,
  DisclosedChoice as SharedDisclosedChoice,
  Question as SharedQuestion,
  DisclosedQuestion as SharedDisclosedQuestion,
  ExamWithQuestions as SharedExamWithQuestions,
} from "@shared/exam.schema";
import type {
  Attempt as SharedAttempt,
  AttemptQuestion as SharedAttemptQuestion,
  DisclosedAttemptQuestion as SharedDisclosedAttemptQuestion,
  AttemptWithQuestions as SharedAttemptWithQuestions,
} from "@shared/attempt.schema";
import type {
  User as SharedUser,
  UserWithTracks as SharedUserWithTracks,
} from "@shared/user.schema";
import type { StudentProfile as SharedStudentProfile } from "@shared/student.schema";

export type Track = CamelCaseKeys<SharedTrack, true>;
export type EnrolledTrack = CamelCaseKeys<SharedEnrolledTrack, true>;

export type Tag = CamelCaseKeys<SharedTag, true>;
export type ExamConfigBreak = CamelCaseKeys<SharedExamConfigBreak, true>;

/**
 * Add `persist` flag and mark passingRate as null for frontend revision/preview sessions only.
 */
export type ExamConfig = Omit<
  CamelCaseKeys<SharedExamConfig, true>,
  "passingRate"
> & {
  passingRate: number | null;
  persist: boolean;
};

type WireExam = CamelCaseKeys<SharedExam, true>;

export type Exam = Omit<WireExam, "config"> & { config: ExamConfig };

export type DisclosedChoice = CamelCaseKeys<SharedDisclosedChoice, true>;
export type Question = CamelCaseKeys<SharedQuestion, true>;
export type DisclosedQuestion = CamelCaseKeys<SharedDisclosedQuestion, true>;
export type ExamWithQuestions = Omit<
  CamelCaseKeys<SharedExamWithQuestions, true>,
  "exam"
> & { exam: Exam };

type WireAttempt = CamelCaseKeys<SharedAttempt, true>;

type AttemptBase = Omit<
  WireAttempt,
  "exam" | "configSnapshot" | "examState" | "result"
> & {
  exam: Exam;
  configSnapshot: ExamConfig;
};

export type InProgressAttempt = AttemptBase & {
  examState: "in-progress";
  result: null;
};

export type CompletedAttempt = AttemptBase & {
  examState: "completed";
  result: NonNullable<WireAttempt["result"]>;
};

/** Narrow on `examState` and `result` follows: present exactly when completed. */
export type Attempt = InProgressAttempt | CompletedAttempt;

export type AttemptQuestion = CamelCaseKeys<SharedAttemptQuestion, true>;
export type DisclosedAttemptQuestion = CamelCaseKeys<
  SharedDisclosedAttemptQuestion,
  true
>;
export type AttemptWithQuestions = Omit<
  CamelCaseKeys<SharedAttemptWithQuestions, true>,
  "attempt"
> & { attempt: Attempt };

/**
 * Never returned by the API — submitting stores the grade (score, status, wrong questions)
 * instead of returning it, so this is assembled client-side from those same
 * fields on a completed `Attempt`, or by `features/exam-session/utils/results.ts
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

export type User =CamelCaseKeys<SharedUser, true>;
export type UserWithTracks = CamelCaseKeys<SharedUserWithTracks, true>;
export type StudentProfile = CamelCaseKeys<SharedStudentProfile, true>;

/** Stamps a real, wire-derived config as persisted. Every service that maps a config calls this. */
export function markPersisted(
  config: CamelCaseKeys<SharedExamConfig, true>,
): ExamConfig {
  return { ...config, persist: true };
}

/** An exam off the wire, its config stamped as persisted. */
export function toPersistedExam(exam: WireExam): Exam {
  return { ...exam, config: markPersisted(exam.config) };
}
