// Theme types
export interface Theme {
  grey: string[]
  white: string
  black: string
  primary: string
  secondary: string
  tertiary: string
  quatro: string
  correct: string
  incorrect: string
  borderRadius: string
  shadows: string[]
  scrollbar: string
  fontSize: string
  fontFamily: string
  displayFontFamily: string
}

export interface ThemedStyles {
  /**  */
  theme: Theme
}

// Language types
export type LangDir = 'rtl' | 'ltr'
export type LangCode = 'ar' | 'en'
export type LangName = 'العربية' | 'English'

export interface Lang {
  code: LangCode
  name: LangName
  dir: LangDir
}

// Question and exam types
export type QuestionFilter = 'all' | GridTagTypes
export type GridTagTypes = 'marked' | 'incomplete' | 'complete' | 'incorrect' | 'correct'

// v1.1: Add new type 'revision' for mistake revision exam and remove ExamID type
// v2.0 pre-phase 5: renamed 'exam' → 'full' and 'miniexam' → 'domain' to match the DB schema
export type ExamType = 'full' | 'domain' | 'revision'
export type Exam = Question[]

export type QuestionTypes = 'multiple-choice'

// v1.1: Add id and categoryId
export interface Question<QT extends QuestionTypes = QuestionTypes> {
  /** question id */
  id: number
  /** question type */
  type: QT
  /** null means the question is not assigned to any domain category */
  categoryId: number | null
  /** question content */
  text: string
  /** explanation of why the correct answer is correct */
  explanation: string
  /** choices of the question */
  choices: Choice[]
  /** index of the correct choice for quick access */
  answer: Answer<QT>
}

export interface Choice {
  /** content of choice */
  text: string
  /** is the choice correct */
  correct: boolean
  /** original index in the question bank before any shuffle; present only on shuffled exams */
  originalIndex?: number
}

// Answer types
export type AnswerOf = {
  'multiple-choice': number[]
}

export type Answer<QT extends QuestionTypes> = AnswerOf[QT]
export type AnswerOfMultipleChoice = AnswerOf['multiple-choice']
export type Answers = AnswerOfMultipleChoice[]

// Session state types
export type ExamState = 'in-progress' | 'completed'
export type ReviewState = 'summary' | 'question'

// Session interface
export interface Session {
  /** v1.1: Session id */
  id: string
  /** the question number */
  index: number
  /** the maximum time allowed for the exam */
  maxTime: number
  /** v1.1: the remaining time */
  time: number
  /** the state of the timer */
  paused: boolean
  /** the state of the exam */
  examState: ExamState
  /** the state of the review */
  reviewState: ReviewState
  /** v1.1: the list of question IDs for this session, in the order they should appear */
  questions: Question['id'][]
  /** the list of answers */
  answers: Answers
  /** null for full exams */
  categoryId: number | null
  /** null for domain exams */
  examId: number | null
  /** the list of bookmarked questions */
  bookmarks: number[]
  /** the type of the exam */
  examType?: ExamType
}

// v2.0: Type for the generic dropdown item (category or fullexam)
export type DropdownItem<TId = number, TLabel = string> = {
  id: TId
  label: TLabel
}

// Session action types
export type SessionActionTypes =
  | 'SET_INDEX'
  | 'SET_BOOKMARKS'
  | 'SET_ANSWERS'
  | 'SET_TIME'
  | 'SET_TIMER_PAUSED'
  | 'SET_EXAM_STATE'
  | 'SET_REVIEW_STATE'

// Session actions mapping
type SessionActionsMap = {
  SET_INDEX: { payload: number; prop: 'index' }
  SET_BOOKMARKS: { payload: number[]; prop: 'bookmarks' }
  SET_ANSWERS: { payload: Answers; prop: 'answers' }
  SET_TIME: { payload: number; prop: 'time' }
  SET_TIMER_PAUSED: { payload: boolean; prop: 'paused' }
  SET_EXAM_STATE: { payload: ExamState; prop: 'examState' }
  SET_REVIEW_STATE: { payload: ReviewState; prop: 'reviewState' }
}

export interface SessionAction<T extends SessionActionTypes = SessionActionTypes> {
  type: T
  payload: SessionActionsMap[T]['payload']
}

// Add support for multiple actions
export type SessionActions = SessionAction | SessionAction[]

// Function types
export type SessionReducerFunc = (state: Session, actions: SessionActions) => Session
export type SessionDispatch = <T extends SessionActionTypes>(...actions: [T, SessionActionsMap[T]['payload']][]) => void

// Session context slice types.
// `update` is carried separately (not on Session) so Session stays JSON-serializable for Phase 5.
export type SessionNavigation = Pick<Session, 'index'> & { update: SessionDispatch }
export type SessionTimer = Pick<Session, 'time' | 'maxTime' | 'paused'> & { update: SessionDispatch }
export type SessionExam = Pick<Session, 'examState' | 'reviewState' | 'categoryId' | 'examId'> & { update: SessionDispatch }
export type SessionData = Pick<Session, 'bookmarks' | 'answers' | 'examType'> & { isSyncing: boolean; update: SessionDispatch }

// User settings (initially null until user inserts data)
export type Settings = {
  /** last choice of language */
  language: Lang['code']
  /** app version for future updates */
  appVersion: string
}

export type SettingsContextType = {
  /** current user settings state */
  settings: Settings
  /** state setter */
  setSettings: React.Dispatch<React.SetStateAction<Settings>>
}

export type ExamContextType = {
  exam: Exam | null
  setExam: React.Dispatch<React.SetStateAction<Exam | null>>
}

// Type for the toast component state
export type ToastState = {
  message: string;
  visible: boolean;
};

export interface ToastContextType {
  message: string;
  visible: boolean;
  setToast: React.Dispatch<React.SetStateAction<ToastState>>
}

// API response types (mirrors backend api/_lib/types.ts for frontend use)
export type AppErrorCode =
  | "MISSING_FIELDS"
  | "VALIDATION_ERROR"
  | "SUBSCRIPTION_REQUIRED"
  | "SIGNUP_FAILED"
  | "INVALID_CREDENTIALS"
  | "ACCOUNT_EXPIRED"
  | "SIGNIN_FAILED"
  | "SIGNOUT_FAILED"
  | "UNAUTHORIZED"
  | "CONFIRMATION_FAILED"
  | "INTERNAL_ERROR"
  | "METHOD_NOT_ALLOWED"
  | "PASSWORD_UPDATE_FAILED"
  | "SESSION_CONFLICT"
  | "SUBSCRIPTION_CHECK_FAILED"
  | "ATTEMPT_CREATE_FAILED"
  | "ATTEMPT_SAVE_FAILED"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "CONFLICT"

export type ApiSuccess<T> = { success: true; data: T }
export type ApiError = { success: false; error: { code: AppErrorCode; message: string } }
export type ApiResponse<T> = ApiSuccess<T> | ApiError

export type AuthStatus = "pending" | "authenticated" | "unauthenticated"

// Auth types
export type UserProfile = {
  id: string
  email: string
  first_name: string
  last_name: string
  expires_at: string
}

export type AuthContextType = {
  user: UserProfile | null
  authStatus: AuthStatus
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>
  setAuthStatus: React.Dispatch<React.SetStateAction<AuthStatus>>
  cancelSessionCheck: () => void
}

export type RevisionDetails = {
  maxTime: Session['maxTime']
  wrongQuestions: Session['questions']
  categoryId: Session['categoryId']
}

export type RevisionExamOptions = RevisionDetails & {
  type: ExamType
}

export type Results = {
  // status-related
  pass?: boolean
  score: number
  passPercent?: number

  // time & meta
  elapsedTime: number
  date: Date
  sourceLabel: string | undefined
  sourceType: 'category' | 'exam'

  // question stats
  correctCount: number
  incorrectCount: number
  incompleteCount: number
  totalQuestions: number

  // for review
  revisionDetails: RevisionDetails
}

// Attempt types (mirror api/_lib/types.ts shapes for frontend use)
export type BackendExamType = "full" | "domain"

export type AttemptSummary = {
  id: string
  exam_type: BackendExamType
  exam_id: number | null
  category_id: number | null
  exam_state: "in-progress" | "completed"
  score: number
  status: "pass" | "fail" | null
  created_at: string
}

export type AttemptDetail = AttemptSummary & {
  current_index: number
  time_remaining: number
  review_state: "summary" | "question"
  email_report_state: "unsent" | "pending" | "sent" | "failed"
}

export type AttemptQuestion = {
  question_index: number
  question_id: number
  choices_order: number[]
  selected_choices: number[]
  is_bookmarked: boolean
}

export type ListAttemptsResult = {
  attempts: AttemptSummary[]
}

export type GetAttemptResult = {
  attempt: AttemptDetail
  questions: AttemptQuestion[]
}

type InsertAttemptFull = {
  exam_type: "full"
  exam_id: number
  category_id: null
  question_ids: number[]
  choices_orders: number[][]
  duration_minutes: number
}

type InsertAttemptDomain = {
  exam_type: "domain"
  category_id: number
  exam_id: null
  question_ids: number[]
  choices_orders: number[][]
  duration_minutes: number
}

export type InsertAttemptRequestBody = InsertAttemptFull | InsertAttemptDomain

export type SaveAttemptAnswer = {
  question_index: number
  selected_choices: number[]
  is_bookmarked: boolean
}

export type SaveAttemptInProgress = {
  exam_state: "in-progress"
  current_index: number
  time_remaining: number
  review_state: "summary" | "question"
  answers: SaveAttemptAnswer[]
}

export type SaveAttemptCompleted = {
  exam_state: "completed"
  current_index: number
  time_remaining: number
  review_state: "summary" | "question"
  answers: SaveAttemptAnswer[]
  score: number
  status: "pass" | "fail"
}

export type SaveAttemptRequestBody = SaveAttemptInProgress | SaveAttemptCompleted