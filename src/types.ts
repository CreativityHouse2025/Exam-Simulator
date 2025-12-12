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
  /** v1.1: the category of the exam */
  categoryId: number
  /** the list of bookmarked questions */
  bookmarks: number[]
  /** the ID of the exam */
  examType?: ExamType
  /** session update function - will be injected by reducer */
  update?: SessionDispatch
}

// v1.1: type for exam generator output
export interface GeneratedExam {
  /** the list of questions to be used in the application's memory */
  exam: Exam
  /** the list of question ids to perserve question order in local storage */
  questionIds: number[]
  /** the duration of the exam in minutes */
  durationMinutes: number
}

// v1.1: type for category item
export type Category = {
  id: number
  label: string
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
export type SessionExam = Pick<Session, 'examState' | 'reviewState' | 'update' | 'categoryId'>
export type SessionData = Pick<Session, 'bookmarks' | 'answers' | 'examType' | 'update'>
