import { GENERAL_CATEGORY_ID } from '../constants'
import categories from '../data/exam-data/categories.json'
import type { Answers, Exam, ExamType, GeneratedExam, LangCode, Question, Session } from '../types'

import { formatDistance, format } from 'date-fns'

/**
 * Format a date string to a human-readable format
 * @param {string} date - The date string to format.
 * @returns {string} - The formatted date string.
 */
export function formatCreatedAt(date: string): string {
  try {
    return formatDistance(new Date(date), new Date()).replace(/about|over|almost|less/, '')
  } catch {
    return 'Unknown time'
  }
}

/**
 * Format a date to 'MM/dd/yyyy'
 * @param {string} date - The date string to format.
 * @returns {string} - The formatted date string.
 */
export function formatDate(date: number | string | Date): string {
  try {
    return format(new Date(date), 'MM/dd/yyyy')
  } catch {
    return '00/00/0000'
  }
}

/**
 * Format seconds into HH:MM:SS
 * @param {number} sec - The time in seconds to format.
 * @returns {string}
 */
export function formatTimer(sec: number): string {
  try {
    const hours = Math.floor(sec / 3600)
    const minutes = Math.floor((sec % 3600) / 60)
    const seconds = sec % 60

    return [hours, minutes, seconds].map((unit) => unit.toString().padStart(2, '0')).join(':')
  } catch {
    return '00:00:00'
  }
}

/**
   * Shuffle array using Fisher-Yates algorithm
   * @param {T[]} array - The array to shuffle
   * @returns {T[]} - The shuffled array
   */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Randomize exam questions and choices
 * @param {Exam} exam - The exam object to format.
 * @returns {Exam} - The formatted exam object.
 */
export function randomizeTest(exam: Exam): Exam {
  return shuffleArray(exam.map((q) => ({ ...q, choices: shuffleArray(q.choices) })))
}

/**
 * Format exam by setting correct answer indices
 * @param {Exam} exam - The exam object to format.
 * @returns {Exam} - The formatted exam object.
 */
export function formatExam(exam: Exam): Exam {
  return exam.map((q) => {
    switch (q.type) {
      case 'multiple-choice':
        q.answer = q.choices.map((c, i) => (c.correct ? i : null)).filter((i): i is number => i !== null)
        break

      default:
        throw new Error(`Unsupported question type: ${q.type}`)
    }

    return q
  })
}

/**
 * Format session with default values
 * @param {number} questionCount - The size of the output question list
 * @param {number} questions - The question bank
 * @param {number} categoryId - The category of the questions
 * @returns {GeneratedExam} - An object that has the Exam for the application memory 
 * and corresponding question IDs list for local storage
 */
export function generateExam(questionCount: number, questions: Question[], categoryId: number): GeneratedExam {
  // validate questionCount
  if (questionCount === 0) {
    return {
      exam: [],
      questionIds: []
    }
  }

  if (questionCount < 0) {
    throw new Error("number of exam questions cannot be negative")
  }

  // validate categoryId
  const categoryIds = categories.map(c => c.id);
  if (!categoryIds.includes(categoryId)) {
    throw new Error("invalid category " + categoryId)
  }

  // validate list
  if (questions.length === 0) {
    throw new Error("question list is empty")
  }

  let questionPool: Question[] = []

  // if the category is general, skip filtering
  if (categoryId === GENERAL_CATEGORY_ID) {
    questionPool = [...questions]
  } else {
    questionPool = questions.filter((q: Question): boolean => q.categoryId === categoryId)
  }
  // warn if there aren’t enough questions
  if (questionPool.length < questionCount) {
    console.warn(`Requested ${ questionCount } questions, but only ${ questionPool.length } available.`);
  }

  // shuffle array
  questionPool = shuffleArray(questionPool)
  
  // choose first questionCount questions
  // note: Array.prototype.slice is safe, even if questionPool < questionCount, it will return an adjusted array
  const chosenQuestions = questionPool.slice(0, questionCount);


  // get questions order
  const questionIds = chosenQuestions.map((q: Question): Question['id'] => q.id)

  const generatedExam: GeneratedExam = {
    exam: chosenQuestions,
    questionIds
  }
  return generatedExam
}


/**
 * Format session with default values
 * @param {Session} session - The session object to format.
 * @param {number} questionCount - The number of questions in the exam.
 * @returns {Session} - The formatted session object.
 */
export function formatSession(session: Session, questionCount: number, examType: ExamType): Session {
  try {
    // Fill missing answers with empty arrays
    const missingAnswers = questionCount - session.answers.length
    if (missingAnswers > 0) {
      session.answers = [...session.answers, ...Array(missingAnswers).fill([])]
    }

    const maxTime = examType === 'exam' ? 13800 : 2760 // 3h50m : 46m
    session.maxTime = maxTime
    session.time = maxTime
  } catch (err) {
    console.error('Error formatting session:', err)
  }

  return session
}

/**
 * Format answer label for display
 * @param {Question} question - The question object.
 * @param {LangCode} lang - The language code.
 * @returns {string} - The formatted answer label.
 */
export function formatAnswerLabel({ type, answer }: Question, lang: LangCode): string {
  try {
    if (type === 'multiple-choice' && Array.isArray(answer)) {
      return answer.map((i) => formatChoiceLabel(i, lang)).join(', ')
    }

    return answer?.toString() || '....'
  } catch {
    return '....'
  }
}

// Choice labels for different languages
const CHOICE_LABELS = {
  en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  ar: 'أبجدهوزحطيكلمنسعفصقرشتثخذضظغ'.split('')
} as const

/**
 * Convert index to choice label (A, B, C... or أ, ب, ج...)
 * @param {number} index - The index of the choice
 * @param {LangCode} lang - The language code
 * @returns Formatted choice label
 */
export function formatChoiceLabel(index: number, lang: LangCode): string {
  try {
    return CHOICE_LABELS[lang][index] || 'A'
  } catch {
    return 'A'
  }
}
