import type { ExamState } from "@shared/attempt.schema";
import type { LangCode as SharedLangCode } from "@shared/exam.schema";
import type { Role } from "@shared/user.schema";
import type {
  AttemptResult,
  DisclosedQuestion,
  EnrolledTrack,
  ExamDetails,
  Question,
  User,
} from "./apiTypes";

// Language types
export type LangDir = "rtl" | "ltr";
/** Re-exported, not redeclared: the API decides which languages exist. */
export type LangCode = SharedLangCode;
export type LangName = "العربية" | "English";

export interface Lang {
  code: LangCode;
  name: LangName;
  dir: LangDir;
}

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
  maxTime: number;
  time: number;
  paused: boolean;
  /** Never persisted to the DB — a supervisor preview or a revision retry. Neither has a real
   * backend attempt to write through to, so the session lifecycle skips the network entirely. */
  preview: boolean;
  /** showAtIndex values already offered this session — mirrors AttemptDetail.offeredBreaks. */
  offeredBreaks: number[];
  /** Set once, on completion. Server-computed for a persisted session; computed locally
   * (utils/results.ts computeLocalResult) for one that never reaches the server. */
  result: AttemptResult | null;
}

// v2.0: Type for the generic dropdown item (category or fullexam)
export type DropdownItem<TId = number, TLabel = string> = {
  id: TId;
  label: TLabel;
};

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
  /** Sends only the dirty questions (answers + bookmark state) to the DB and clears the dirty set on success.
   * No-op when nothing is dirty, a sync is already in flight, or the session is never persisted. */
  syncProgress: () => Promise<boolean>;
  /** Records a break as offered, both locally and (unless never persisted) on the server. */
  saveBreakOffer: (showAtIndex: number) => Promise<void>;
  /** Flushes dirty answers and submits for grading. The server writes the score/status/
   * wrongQuestions to the row rather than returning them (submit_attempt, migration 021) — on
   * success this re-fetches the attempt via the same read `resumeAttempt` uses, which both
   * discloses the questions (a completed attempt is always disclosed) and returns the graded
   * result. Returns null on failure/no-op. */
  submitExam: () => Promise<AttemptResult | null>;
};

// User settings (initially null until user inserts data)
export type Settings = {
  /** last choice of language */
  language: Lang["code"];
  /** app version for future updates */
  appVersion: string;
};

export type SettingsContextType = {
  /** current user settings state */
  settings: Settings;
  /** state setter */
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
};

export type ExamContextType = {
  examDetails: ExamDetails | null;
  questions: (Question | DisclosedQuestion)[] | null;
};

// Type for the toast component state. Holds a translation key, not copy — the toast translates
// at render time so the message follows the current language.
export type ToastState = {
  translationKey: string;
  visible: boolean;
};

export interface ToastContextType {
  translationKey: string;
  visible: boolean;
  setToast: React.Dispatch<React.SetStateAction<ToastState>>;
}

export type AuthStatus = "pending" | "authenticated" | "unauthenticated";

/**
 * The role the UI renders for. Extends the database roles with `guest`, which is not a stored role
 * but the absence of a user — see `roleOf` in config/roles.ts.
 */
export type ViewerRole = Role | "guest";

export type AuthContextType = {
  user: User | null;
  /** Tracks the user holds an ACTIVE enrollment in — see GET /api/auth/me. */
  enrolledTracks: EnrolledTrack[];
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;
  exchangeToken: (accessToken: string, refreshToken: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: (onSuccess?: () => void) => Promise<void>;
};
