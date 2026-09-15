import type { ExamState, ReviewState } from "@shared/attempt.schema";
import type { Role, User } from "@shared/user.schema";

// Language types
export type LangDir = "rtl" | "ltr";
export type LangCode = "ar" | "en";
export type LangName = "العربية" | "English";

export interface Lang {
  code: LangCode;
  name: LangName;
  dir: LangDir;
}

// Question and exam types
export type QuestionFilter = "all" | GridTagTypes;
export type GridTagTypes =
  | "marked"
  | "incomplete"
  | "complete"
  | "incorrect"
  | "correct";

// v1.1: Add new type 'revision' for mistake revision exam and remove ExamID type
// v2.0 pre-phase 5: renamed 'exam' → 'full' and 'miniexam' → 'domain' to match the DB schema
export type ExamType = "full" | "domain" | "revision";
export type Exam = Question[];

export type QuestionTypes = "multiple-choice";

// v1.1: Add id and categoryId
export interface Question<QT extends QuestionTypes = QuestionTypes> {
  /** question id */
  id: number;
  /** question type */
  type: QT;
  /** null means the question is not assigned to any domain category */
  categoryId: number | null;
  /** question content */
  text: string;
  /** explanation of why the correct answer is correct */
  explanation: string;
  /** choices of the question */
  choices: Choice[];
  /** id of the correct choice for quick access */
  answer: Answer<QT>;
}

export interface Choice {
  /** content of choice */
  text: string;
  /** is the choice correct */
  correct: boolean;
  /** original index in the question bank before any shuffle; present only after reconstructing the snapshot from DB */
  originalIndex?: number;
}

// Answer types
export type AnswerOf = {
  "multiple-choice": number[];
};

export type Answer<QT extends QuestionTypes> = AnswerOf[QT];
export type AnswerOfMultipleChoice = AnswerOf["multiple-choice"];
export type Answers = AnswerOfMultipleChoice[];

// Base session — fields shared by all three exam types
interface BaseSession {
  id: string;
  index: number;
  examState: ExamState;
  reviewState: ReviewState;
  questionChoiceOrders: Record<number, number[]>;
  selectedOriginalIndices: Answers;
  bookmarks: number[];
  questionIds: number[] | "ALL";
  dirtyQuestions: Record<number, true>;
  maxTime: number;
  time: number;
  paused: boolean;
  /** Supervisor "preview" session — client-only, never persisted to the DB. */
  preview: boolean;
}

export interface FullExamSession extends BaseSession {
  examType: "full";
  examId: number;
  categoryId: null;
  break1OfferedAt: string | null;
  break2OfferedAt: string | null;
}

export interface DomainExamSession extends BaseSession {
  examType: "domain";
  categoryId: number;
  examId: null;
}

export interface RevisionSession extends BaseSession {
  examType: "revision";
  examId: number;
  categoryId: null;
}

export type Session = FullExamSession | DomainExamSession | RevisionSession;

export type { BaseSession };

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
  | "SET_REVIEW_STATE"
  | "RESET_SESSION"
  | "MARK_DIRTY"
  | "CLEAR_DIRTY"
  | "SET_BREAK1_OFFERED_AT"
  | "SET_BREAK2_OFFERED_AT";

// Session actions mapping
type SessionActionsMap = {
  SET_INDEX: { payload: number; prop: "index" };
  SET_BOOKMARKS: { payload: number[]; prop: "bookmarks" };
  SET_ANSWERS: { payload: Answers; prop: "selectedOriginalIndices" };
  SET_TIME: { payload: number; prop: "time" };
  SET_TIMER_PAUSED: { payload: boolean; prop: "paused" };
  SET_EXAM_STATE: { payload: ExamState; prop: "examState" };
  SET_REVIEW_STATE: { payload: ReviewState; prop: "reviewState" };
  // Internal-only: replaces the entire session state. Not intended for component use.
  RESET_SESSION: { payload: Session; prop: "id" };
  // Internal-only: both handled via early return in the reducer before the generic prop-lookup runs.
  MARK_DIRTY: { payload: number; prop: "dirtyQuestions" };
  CLEAR_DIRTY: { payload: null; prop: "dirtyQuestions" };
  SET_BREAK1_OFFERED_AT: { payload: string | null; prop: "break1OfferedAt" };
  SET_BREAK2_OFFERED_AT: { payload: string | null; prop: "break2OfferedAt" };
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
  state: Session,
  actions: SessionActions,
) => Session;
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
export type SessionExam = Pick<
  Session,
  "examState" | "reviewState" | "categoryId" | "examId"
> & { update: SessionDispatch };
export type SessionData = Pick<
  Session,
  "bookmarks" | "selectedOriginalIndices" | "examType" | "dirtyQuestions"
> & {
  /** null for domain and revision sessions (break fields only exist on FullExamSession) */
  break1OfferedAt: string | null;
  /** null for domain and revision sessions (break fields only exist on FullExamSession) */
  break2OfferedAt: string | null;
  isSyncing: boolean;
  update: SessionDispatch;
};

export type StartNewExamParams = {
  type: ExamType;
  examOrCategoryId: number;
  /** Supervisor preview: skips startAttempt and localStorage persistence, builds a client-only session. Defaults to false. */
  preview?: boolean;
};

export type SessionControlContextType = {
  session: Session | null;
  update: SessionDispatch;
  /** Loads exam data, saves the attempt to the DB, builds the full Session state, and mounts the active session.
   * Returns the new attemptId on success, or null on failure. */
  startNewExam: (params: StartNewExamParams) => Promise<string | null>;
  /** Fetches an in-progress attempt snapshot from the DB, hydrates the full Session state, mounts the active
   * session, and persists the attemptId to localStorage.
   * Returns the attemptId on success, or null on failure so callers can reset their loading state. */
  resumeAttempt: (attemptId: string) => Promise<string | null>;
  /** Fetches a completed full-exam attempt snapshot from the DB, filters to wrong/unanswered questions only,
   * and mounts an ephemeral revision session (not persisted to localStorage).
   * Returns the attemptId on success, or null on failure so callers can reset their loading state. */
  startRevision: (attemptId: string) => Promise<string | null>;
  /** Sends only the dirty questions (answers + bookmark state) to the DB and clears the dirty set on success.
   * No-op when nothing is dirty or a sync is already in flight. */
  syncProgress: () => Promise<void>;
  /** Saves the break offer timestamp to the DB immediately, bypassing the dirty-questions guard.
   * Takes the fresh timestamp so it is not affected by stale closure state. */
  saveBreakOffer: (breakNumber: 1 | 2, offeredAt: string) => Promise<void>;
  /** Flushes dirty answers and marks the attempt completed in the DB.
   * Dispatches SET_EXAM_STATE 'completed' only on success.
   * No-op for revision sessions or while a sync is in flight. */
  submitExam: (score: number, status: "pass" | "fail") => Promise<void>;
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
  exam: Exam | null;
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

export type Results = {
  // status-related
  pass?: boolean;
  /** "fail" when no passing rate is configured for the exam type */
  status: "pass" | "fail";
  score: number;
  passPercent?: number;

  // time & meta
  elapsedTime: number;
  date: Date;
  sourceLabel: string | undefined;
  sourceType: "category" | "exam";

  // question stats
  correctCount: number;
  incorrectCount: number;
  incompleteCount: number;
  totalQuestions: number;
};
