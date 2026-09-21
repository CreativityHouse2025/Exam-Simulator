import type { Lang, LangCode, Settings } from "./types";
import type { ExamConfig } from "./apiTypes";

// Session action types
export const SESSION_ACTION_TYPES = {
  SET_INDEX: "SET_INDEX" as const,
  SET_BOOKMARKS: "SET_BOOKMARKS" as const,
  SET_ANSWERS: "SET_ANSWERS" as const,
  SET_TIME: "SET_TIME" as const,
  SET_TIMER_PAUSED: "SET_TIMER_PAUSED" as const,
  SET_EXAM_STATE: "SET_EXAM_STATE" as const,
  SET_RESULT: "SET_RESULT" as const,
  RESET_SESSION: "RESET_SESSION" as const,
  MARK_DIRTY: "MARK_DIRTY" as const,
  CLEAR_DIRTY: "CLEAR_DIRTY" as const,
  SET_OFFERED_BREAK: "SET_OFFERED_BREAK" as const,
} as const;

// Property mapping for session actions
export const SESSION_ACTION_PROPS = {
  SET_INDEX: "index" as const,
  SET_BOOKMARKS: "bookmarks" as const,
  SET_ANSWERS: "selectedChoices" as const,
  SET_TIME: "time" as const,
  SET_TIMER_PAUSED: "paused" as const,
  SET_EXAM_STATE: "examState" as const,
  SET_RESULT: "result" as const,
  // Dummy props — reducer handles these via early return before this mapping is read.
  RESET_SESSION: "id" as const,
  MARK_DIRTY: "dirtyQuestions" as const,
  CLEAR_DIRTY: "dirtyQuestions" as const,
  SET_OFFERED_BREAK: "offeredBreaks" as const,
} as const;

// Constant for category menu padding (shared variable)
export const MENU_PADDING = "1.6rem 1.4rem";

// Fixed session id for supervisor preview sessions — never a real attempt, never sent to the backend.
export const PREVIEW_ATTEMPT_ID = "preview";

// Mirrors TRACK_ATTEMPT_CAP in api/_lib/services/attemptService.ts — the server returns at most
// this many attempts per track, so the history page is a recent window, not a full archive.
export const TRACK_ATTEMPT_CAP = 25;

/**
 * Revision is a client-only retry of a completed attempt's wrong/unanswered questions —
 * never written to the DB, so it has no row in exam_config. Untimed and ungraded (no pass/fail
 * shown), reveal-only (no further retry of a retry). See spec-add-tracks.md decision 16.d.
 */
export const REVISION_CONFIG: ExamConfig = {
  // 0, not null: the footer still shows a clock, rendered as the --:--:-- placeholder.
  examDurationMinutes: 0,
  passingRate: null,
  canRevealAnswers: true,
  allowRetryWrong: false,
  breaks: [],
  persist: false,
};

// Language configuration
export const LANGUAGES: Record<LangCode, Lang> = {
  ar: { code: "ar", name: "العربية", dir: "rtl" } as const,
  en: { code: "en", name: "English", dir: "ltr" } as const,
} as const;

// Default user settings
export const DEFAULT_USER_SETTINGS: Settings = {
  language: "en",
  appVersion: "1.4",
};
