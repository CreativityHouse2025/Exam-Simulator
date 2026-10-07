import type { ExamState } from "@shared/attempt.schema";
import type {
  AttemptResult,
  DisclosedQuestion,
  ExamDetails,
  Question,
} from "@/core/api/apiTypes";
import type { Localized, LocalizedExamDetails } from "@/core/types";

export type QuestionFilter = "all" | GridTagTypes;
export type GridTagTypes =
  | "marked"
  | "incomplete"
  | "complete"
  | "incorrect"
  | "correct";
/** Selected choice positions per question, indexed the same way as Session.questionIds. */
export type Answers = number[][];
// A single session shape for every exam type — behaviour differences are driven by
// ExamContext's config, not by branching on a session field. See spec-add-tracks.md.
export interface Session {
  id: string;
  index: number;
  examState: ExamState;
  selectedChoices: Answers;
  bookmarks: number[];
  questionIds: number[];
  dirtyQuestions: Record<number, true>;
  /** Full duration in seconds, null when untimed — never 0. Same distinction as the backend's
   * `exam_duration_minutes`. */
  maxTime: number | null;
  /** Seconds left, null when there is no clock. */
  time: number | null;
  paused: boolean;
  /** Never persisted to the DB — a supervisor preview or a revision retry. Neither has a real
   * backend attempt to write through to, so the session lifecycle skips the network entirely. */
  preview: boolean;
  /** showAtIndex values already offered this session — mirrors AttemptDetail.offeredBreaks. */
  offeredBreaks: number[];
  /** The attempt row's created_at. A session that was never a row (preview, revision) is stamped
   * when it is built, so every session has a date to show. */
  createdAt: string;
  /** Set once, on completion. Server-computed for a persisted session; computed locally
   * (utils/results.ts computeLocalResult) for one that never reaches the server. */
  result: AttemptResult | null;
}
// Session action types
export type SessionActionTypes =
  | "SET_INDEX"
  | "SET_BOOKMARKS"
  | "SET_ANSWERS"
  | "SET_TIME"
  | "SET_TIMER_PAUSED"
  | "SET_EXAM_STATE"
  | "RESET_SESSION"
  | "MARK_DIRTY"
  | "CLEAR_DIRTY"
  | "SET_OFFERED_BREAK"
  | "SET_RESULT";
// Session actions mapping
type SessionActionsMap = {
  SET_INDEX: { payload: number; prop: "index" };
  SET_BOOKMARKS: { payload: number[]; prop: "bookmarks" };
  SET_ANSWERS: { payload: Answers; prop: "selectedChoices" };
  SET_TIME: { payload: number; prop: "time" };
  SET_TIMER_PAUSED: { payload: boolean; prop: "paused" };
  SET_EXAM_STATE: { payload: ExamState; prop: "examState" };
  SET_RESULT: { payload: AttemptResult | null; prop: "result" };
  // Internal-only: replaces the entire session state. Not intended for component use.
  RESET_SESSION: { payload: Session; prop: "id" };
  // Internal-only: both handled via early return in the reducer before the generic prop-lookup runs.
  MARK_DIRTY: { payload: number; prop: "dirtyQuestions" };
  CLEAR_DIRTY: { payload: null; prop: "dirtyQuestions" };
  // Handled via early return in the reducer: appends to offeredBreaks rather than replacing it.
  SET_OFFERED_BREAK: { payload: number; prop: "offeredBreaks" };
};
export interface SessionAction<
  T extends SessionActionTypes = SessionActionTypes,
> {
  type: T;
  payload: SessionActionsMap[T]["payload"];
}
// Add support for multiple actions
export type SessionActions = SessionAction | SessionAction[];
// Function types
export type SessionReducerFunc = (
  state: Session | null,
  actions: SessionActions,
) => Session | null;
export type SessionDispatch = <T extends SessionActionTypes>(
  ...actions: [T, SessionActionsMap[T]["payload"]][]
) => void;
// Session context slice types.
// `update` is carried separately (not on Session) so Session stays JSON-serializable for Phase 5.
export type SessionNavigation = Pick<Session, "index"> & {
  update: SessionDispatch;
};
export type SessionTimer = Pick<Session, "time" | "maxTime" | "paused"> & {
  update: SessionDispatch;
};
export type SessionExam = Pick<Session, "examState" | "result"> & {
  update: SessionDispatch;
};
export type SessionData = Pick<
  Session,
  "bookmarks" | "selectedChoices" | "dirtyQuestions" | "offeredBreaks"
> & {
  isSyncing: boolean;
  update: SessionDispatch;
};
export type StartNewExamOptions = {
  /** Supervisor preview: skips persistence and builds a client-only session. Defaults to false. */
  preview?: boolean;
};
export type SaveProgressOptions = {
  /** A break's showAtIndex, when this save is the one recording that it was offered. Recorded
   * locally even for a session that never persists, so it is never offered twice. */
  offeredBreak?: number;
};
export type SessionControlContextType = {
  session: Session | null;
  update: SessionDispatch;
  /** Starts a real attempt (student) or builds a client-only preview session (supervisor), and
   * mounts it. Returns the new attemptId on success, or null on failure. */
  startNewExam: (
    examId: number,
    options?: StartNewExamOptions,
  ) => Promise<string | null>;
  /** Fetches an in-progress attempt snapshot from the DB, hydrates the full Session state, mounts the active
   * session, and persists the attemptId to localStorage.
   * Returns the attemptId on success, or null on failure so callers can reset their loading state. */
  resumeAttempt: (attemptId: string) => Promise<string | null>;
  /** Fetches the "wrong or unanswered" set of a completed attempt and mounts an ephemeral revision
   * session (not persisted to localStorage) using REVISION_CONFIG.
   * Returns the attemptId on success, or null on failure so callers can reset their loading state. */
  startRevision: (attemptId: string) => Promise<string | null>;
  /** Sends the dirty questions (answers + bookmark state), the position, the clock and any break
   * just offered to the DB, and clears the dirty set on success. No-op on the network when a save
   * is already in flight or the session is never persisted. */
  saveProgress: (options?: SaveProgressOptions) => Promise<boolean>;
  /** Flushes dirty answers and submits for grading. The server writes the score/status/
   * wrongQuestions to the row rather than returning them (submit_attempt, migration 021) — on
   * success this re-fetches the attempt via the same read `resumeAttempt` uses, which both
   * discloses the questions (a completed attempt is always disclosed) and returns the graded
   * result. Returns null on failure/no-op. */
  submitExam: () => Promise<AttemptResult | null>;
};
/** Exam content as the API returns it, in every language. */
export type ExamContent = {
  examDetails: ExamDetails | null;
  questions: (Question | DisclosedQuestion)[] | null;
};
/** Exam content in the chosen language — what the exam UI reads. */
export type ExamContextType = {
  examDetails: LocalizedExamDetails | null;
  questions: Localized<Question | DisclosedQuestion>[] | null;
};
