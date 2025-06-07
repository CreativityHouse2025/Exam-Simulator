import type { Exam, Question } from '../types'
import type { Session } from '../session'
import type { LangCode } from '../settings'

import { formatDistance, format } from 'date-fns'

/**
 * Shuffle an array using Fisher-Yates algorithm
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
 * Format a date string to a human-readable format.
 * @param {string} date - The date string to format.
 * @returns {string} - The formatted date string.
 */
export function formatCreatedAt(date: string): string {
  return formatDistance(new Date(date), new Date()).replace(/about|over|almost|less/, '')
}

/**
 * Format a date string to 'MM/dd/yyyy'.
 * @param {string} date - The date string to format.
 * @returns {string} - The formatted date string.
 */
export function formatDate(date: number | string | Date): string {
  return format(new Date(date), 'MM/dd/RRRR')
}

/**
 * Format seconds into MM:SS
 * @param {number} sec - The time in seconds to format.
 * @returns {string}
 */
export function formatTimer(sec: number): string {
  const hours = Math.floor(sec / 3600) % 24
  const minutes = Math.floor(sec / 60) % 60
  const seconds = sec % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Format the exam object.
 * @param {Exam} exam - The exam object to format.
 * @returns {Exam} - The formatted exam object.
 */
export function formatExam(exam: Exam): Exam {
  // Randomize the order of questions
  exam.test = shuffleArray(exam.test)

  for (let i = 0; i < exam.test.length; i++) {
    const q = exam.test[i]

    // Create a mapping of original indices to new indices for choices
    const originalIndices = q.choices.map((_, index) => index)
    const shuffledIndices = shuffleArray(originalIndices)

    // Randomize the order of choices
    const shuffledChoices = shuffledIndices.map((originalIndex) => q.choices[originalIndex])
    q.choices = shuffledChoices

    // Update the answer indices to reflect the new order
    if (q.type === 'multiple-choice') {
      const originalCorrectIndex = q.choices.findIndex((c) => c.correct)
      q.answer = originalCorrectIndex
    } else if (q.type === 'multiple-answer') {
      q.answer = q.choices
        .map((_, index) => {
          return q.choices[index].correct ? index : null
        })
        .filter((c) => c !== null)
    }

    exam.test[i] = q
  }

  return exam
}

/**
 * Format the Session object.
 * @param {Session} session - The session object to format.
 * @param {Exam} exam - The exam object to format.
 * @returns {Session} - The formatted exam object.
 */
export function formatSession(session: Session, exam: Exam): Session {
  const nullArr = Array(exam.test.length - session.answers.length).fill(null)
  session.answers = session.answers.concat(nullArr)

  return session
}

/**
 * Format the answer label.
 * @param {Question} question - The question object.
 * @param {LangCode} lang - The language code.
 * @returns {string} - The formatted answer label.
 */
export function formatAnswerLabel({ type, answer }: Question, lang: LangCode): string {
  if (type === 'multiple-choice' && typeof answer === 'number') {
    return answer === null ? '..' : formatChoiceLabel(answer, lang)
  } else if (type === 'multiple-answer' && Array.isArray(answer)) {
    return answer.map((i: number) => formatChoiceLabel(i, lang)).join(', ')
  }

  return answer?.toString() || '....'
}

/**
 * Convert an index to a letter
 * @param {number} index - The index to convert.
 * @param {LangCode} lang - The language code to use for the conversion.
 * @returns {string} - The letter corresponding to the index.
 */
export function formatChoiceLabel(index: number, lang: LangCode): string {
  const labels = {
    en: [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
      'M',
      'N',
      'O',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
      'V',
      'W',
      'X',
      'Y',
      'Z'
    ],
    ar: [
      'أ',
      'ب',
      'ج',
      'د',
      'هـ',
      'و',
      'ز',
      'ح',
      'ط',
      'ي',
      'ك',
      'ل',
      'م',
      'ن',
      'س',
      'ع',
      'ف',
      'ص',
      'ق',
      'ر',
      'ش',
      'ت',
      'ث',
      'خ',
      'ذ',
      'ض',
      'ظ',
      'غ'
    ]
  }

  return labels[lang][index]
}
