import type { Answer } from './session'

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

export type QuestionFilter = 'all' | GridTagTypes
export type GridTagTypes = 'marked' | 'incomplete' | 'complete' | 'incorrect' | 'correct'

export type ExamType = 'exam' | 'miniexam'
export type ExamID = `${ExamType}-${number}`
export interface Exam {
  /** exam content */
  test: Test
}

export type Test = Question[]

export type QuestionTypes = 'single-answer' | 'multiple-answer'

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
