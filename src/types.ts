// Theme types
export interface Theme {
  grey: string[]
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

export type ExamType = 'exam' | 'miniexam'
export type ExamID = `${ExamType}-${number}`
export type Exam = Question[]

export type QuestionTypes = 'multiple-choice'

export interface Question<QT extends QuestionTypes = QuestionTypes> {
  /** question type */
  type: QT
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
  /** the question number */
  index: number
  /** the maximum time allowed for the exam */
  maxTime: number
  /** the time elapsed */
  time: number
  /** the state of the timer */
  paused: boolean
  /** the state of the exam */
  examState: ExamState
  /** the state of the review */
  reviewState: ReviewState
  /** the list of bookmarked questions */
  bookmarks: number[]
  /** the list of answers */
  answers: Answers
  /** the ID of the exam */
  examID?: ExamID
  /** session update function - will be injected by reducer */
  update?: SessionDispatch
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

// Session context slice types
export type SessionNavigation = Pick<Session, 'index' | 'update'>
export type SessionTimer = Pick<Session, 'time' | 'maxTime' | 'paused' | 'update'>
export type SessionExam = Pick<Session, 'examState' | 'reviewState' | 'update'>
export type SessionData = Pick<Session, 'bookmarks' | 'answers' | 'examID' | 'update'>
