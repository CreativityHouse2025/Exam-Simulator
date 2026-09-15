import type { Lang, LangCode, Settings, FullExamSession, DomainExamSession, RevisionSession } from './types'

// Session action types
export const SESSION_ACTION_TYPES = {
  SET_INDEX: 'SET_INDEX' as const,
  SET_BOOKMARKS: 'SET_BOOKMARKS' as const,
  SET_ANSWERS: 'SET_ANSWERS' as const,
  SET_TIME: 'SET_TIME' as const,
  SET_TIMER_PAUSED: 'SET_TIMER_PAUSED' as const,
  SET_EXAM_STATE: 'SET_EXAM_STATE' as const,
  SET_REVIEW_STATE: 'SET_REVIEW_STATE' as const,
  RESET_SESSION: 'RESET_SESSION' as const,
  MARK_DIRTY: 'MARK_DIRTY' as const,
  CLEAR_DIRTY: 'CLEAR_DIRTY' as const,
  SET_BREAK1_OFFERED_AT: 'SET_BREAK1_OFFERED_AT' as const,
  SET_BREAK2_OFFERED_AT: 'SET_BREAK2_OFFERED_AT' as const,
} as const

// Property mapping for session actions
export const SESSION_ACTION_PROPS = {
  SET_INDEX: 'index' as const,
  SET_BOOKMARKS: 'bookmarks' as const,
  SET_ANSWERS: 'selectedOriginalIndices' as const,
  SET_TIME: 'time' as const,
  SET_TIMER_PAUSED: 'paused' as const,
  SET_EXAM_STATE: 'examState' as const,
  SET_REVIEW_STATE: 'reviewState' as const,
  // Dummy props — reducer handles these via early return before this mapping is read.
  RESET_SESSION: 'id' as const,
  MARK_DIRTY: 'dirtyQuestions' as const,
  CLEAR_DIRTY: 'dirtyQuestions' as const,
  SET_BREAK1_OFFERED_AT: 'break1OfferedAt' as const,
  SET_BREAK2_OFFERED_AT: 'break2OfferedAt' as const,
} as const

// Constant for category menu padding (shared variable)
export const MENU_PADDING = "1.6rem 1.4rem"

// Fixed session id for supervisor preview sessions — never a real attempt, never sent to the backend.
export const PREVIEW_ATTEMPT_ID = 'preview'

// Long duration for preview sessions — timer ticks normally but never runs out.
export const PREVIEW_TIME_SECONDS = 60 * 60 * 24 * 365

export const DEFAULT_FULL_SESSION: FullExamSession = {
  id: '',
  index: 0,
  maxTime: 0,
  time: 0,
  paused: false,
  examState: 'in-progress',
  reviewState: 'summary',
  questionChoiceOrders: {},
  selectedOriginalIndices: [],
  categoryId: null,
  examId: 0,
  examType: 'full',
  bookmarks: [],
  questionIds: 'ALL',
  dirtyQuestions: {},
  break1OfferedAt: null,
  break2OfferedAt: null,
  preview: false,
}

export const DEFAULT_DOMAIN_SESSION: DomainExamSession = {
  id: '',
  index: 0,
  maxTime: 0,
  time: 0,
  paused: false,
  examState: 'in-progress',
  reviewState: 'summary',
  questionChoiceOrders: {},
  selectedOriginalIndices: [],
  categoryId: 0,
  examId: null,
  examType: 'domain',
  bookmarks: [],
  questionIds: 'ALL',
  dirtyQuestions: {},
  preview: false,
}

export const DEFAULT_REVISION_SESSION: RevisionSession = {
  id: '',
  index: 0,
  maxTime: 0,
  time: 0,
  paused: false,
  examState: 'in-progress',
  reviewState: 'summary',
  questionChoiceOrders: {},
  selectedOriginalIndices: [],
  categoryId: null,
  examId: 0,
  examType: 'revision',
  bookmarks: [],
  questionIds: 'ALL',
  dirtyQuestions: {},
  preview: false,
}

// Language configuration
export const LANGUAGES: Record<LangCode, Lang> = {
  ar: { code: 'ar', name: 'العربية', dir: 'rtl' } as const,
  en: { code: 'en', name: 'English', dir: 'ltr' } as const
} as const

// Default user settings
export const DEFAULT_USER_SETTINGS: Settings = {
  language: 'en',
  appVersion: '1.4'
}
