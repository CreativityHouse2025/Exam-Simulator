import type { Exam, ExamType, LangCode, Question, Session } from '../types'

import { formatDistance, format } from 'date-fns'
import { translate } from './translation';

/**
   * Shuffle array using Fisher-Yates algorithm
   * @param {T[]} array - The array to shuffle
   * @returns {T[]} - The shuffled array
   */
export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}

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
    return format(new Date(date), 'dd/MM/yyyy')
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
 * Format a new session with default values
 * @param {Session} session - The session object to format.
 * @param {number} questionCount - The number of questions
 * @param {number} durationMinutes - The duration of the exam in minutes
 * @returns {Session} - The formatted session object.
 */
export function formatSession(session: Session, questionCount: number, durationMinutes: number): Session {
  try {
    // Fill missing answers with empty arrays
    const missingAnswers = questionCount - session.answers.length
    if (missingAnswers > 0) {
      session.answers = [...session.answers, ...Array(missingAnswers).fill([])]
    }

    const maxTime = durationMinutes * 60;

    session.maxTime = maxTime
    session.time = maxTime
    session.id = createSessionId(session.examType as ExamType)
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

export function isEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function hasInvalidNameChars(name: string): boolean {
  // \p{L} = any kind of letter from any language
  // \s = space
  const invalidPattern = /[^\p{L}\s]/u;
  return invalidPattern.test(name);
}

// generates a unique id for the session
export const createSessionId = (examType: ExamType) =>
  `${examType}-attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;