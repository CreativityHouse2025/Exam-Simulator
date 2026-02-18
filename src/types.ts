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
export type ExamType = 'exam' | 'miniexam' | 'revision'
export type Exam = Question[]

export type QuestionTypes = 'multiple-choice'

// v1.1: Add id and categoryId
export interface Question<QT extends QuestionTypes = QuestionTypes> {
  /** question id */
  id: number
  /** question type */
  type: QT
  /** question type */
  categoryId: number
  /** question content */
  text: string
  /** explanation of why the correct answer is correct */
  explanation: string
  /** choices of the question */
  choices: Choice[]
  /** index of the correct choice for quick access */
  // temporarily make it optional
  answer?: Answer<QT>
}

export interface Choice {
  /** content of choice */
  text: string
  /** is the choice correct */
  correct: boolean
}

// Answer types
export type AnswerOf = {
  'multiple-choice': number[]
}

export type Answer<QT extends QuestionTypes> = AnswerOf[QT]
export type AnswerOfMultipleChoice = AnswerOf['multiple-choice']
export type Answers = AnswerOfMultipleChoice[]

// Session state types
export type ExamState = 'not-started' | 'in-progress' | 'completed'
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
  /** v1.1: flag to ensure that email is sent only once per session completion */
  emailSent: boolean
  /** v1.1: the category of the exam */
  categoryId: number
  /** the list of bookmarked questions */
  bookmarks: number[]
  /** the type of the exam */
  examType?: ExamType
  /** the ID of the full exam (if it is a full exam) */
  examId?: number
  /** session update function - will be injected by reducer */
  update?: SessionDispatch
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
  | 'SET_EMAIL_SENT'

// Session actions mapping
type SessionActionsMap = {
  SET_INDEX: { payload: number; prop: 'index' }
  SET_BOOKMARKS: { payload: number[]; prop: 'bookmarks' }
  SET_ANSWERS: { payload: Answers; prop: 'answers' }
  SET_TIME: { payload: number; prop: 'time' }
  SET_TIMER_PAUSED: { payload: boolean; prop: 'paused' }
  SET_EXAM_STATE: { payload: ExamState; prop: 'examState' }
  SET_REVIEW_STATE: { payload: ReviewState; prop: 'reviewState' }
  SET_EMAIL_SENT: { payload: Session['emailSent']; prop: 'emailSent' }
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

// Session context slice types
export type SessionNavigation = Pick<Session, 'index' | 'update'>
export type SessionTimer = Pick<Session, 'time' | 'maxTime' | 'paused' | 'update'>
export type SessionExam = Pick<Session, 'examState' | 'reviewState' | 'update' | 'categoryId'| 'examId'>
export type SessionData = Pick<Session, 'bookmarks' | 'answers' | 'examType' | 'update' | 'emailSent'>

// Email API arguments type
export type SendEmailRequest = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: {
    filename: string;
    /** pdf content in base64 */
    content: string;
  }[]
}

// Translations to pass in the API (serverless doesn't share app runtime state)
export type Translations = {
  companyName: string
  reportTitle: string
  missing: string
  correct: string
  incorrect: string
  explanation: string
  fullName: string
}

// Generate report API arguments type
export type GenerateReportRequest = {
  exam: Exam
  userAnswers: Answers
  langCode: LangCode
  userFullName: string
  translations: Translations
}

// User settings (initially null until user inserts data)
export type Settings = {
  /** the full name of the user for report display */
  fullName?: string,
  /** the email of user */
  email?: string,
  /** last choice of language */
  language: Lang['code']
  /** app version for future updates */
  appVersion: string
}

export type AccountForm = Required<Pick<Settings, "fullName" | "email">>;

export type SettingsContextType = {
  /** current user settings state */
  settings: Settings
  /** state setter */
  setSettings: React.Dispatch<React.SetStateAction<Settings>>
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

export type RevisionDetails = {
  maxTime: Session['maxTime']
  wrongQuestions: Session['questions']
  categoryId: Session['categoryId']
}

export type Results = {
  // status-related
  pass?: boolean
  score: number
  passPercent?: number

  // time & meta
  elapsedTime: number
  date: Date
  categoryLabel: string

  // question stats
  correctCount: number
  incorrectCount: number
  incompleteCount: number
  totalQuestions: number

  // for review
  revisionDetails: RevisionDetails
}