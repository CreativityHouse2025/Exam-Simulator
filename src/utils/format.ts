import type { Exam, ExamType, LangCode, Question, Session } from '../types'

import { formatDistance, format } from 'date-fns'

/**
 * Format a date string to a human-readable format.
 * @param {string} date - The date string to format.
 * @returns {string} - The formatted date string.
 */
export function formatCreatedAt(date: string): string {
  try {
    return formatDistance(new Date(date), new Date()).replace(/about|over|almost|less/, '')
  } catch (err) {
    console.error('Error formatting created at date:', err)
    return 'Unknown time'
  }
}

/**
 * Format a date string to 'MM/dd/yyyy'.
 * @param {string} date - The date string to format.
 * @returns {string} - The formatted date string.
 */
export function formatDate(date: number | string | Date): string {
  try {
    return format(new Date(date), 'MM/dd/RRRR')
  } catch (err) {
    console.error('Error formatting date:', err)
    return '00/00/0000'
  }
}

/**
 * Format seconds into MM:SS
 * @param {number} sec - The time in seconds to format.
 * @returns {string}
 */
export function formatTimer(sec: number): string {
  try {
    const hours = Math.floor(sec / 3600) % 24
    const minutes = Math.floor(sec / 60) % 60
    const seconds = sec % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  } catch (err) {
    console.error('Error formatting timer:', err)
    return '00:00:00'
  }
}

/**
 * Format the exam object.
 * @param {Exam} exam - The exam object to format.
 * @returns {Exam} - The formatted exam object.
 */
export function randomizeTest(exam: Exam): Exam {
  try {
    // Randomize the order of questions
    exam = shuffleArray(exam)

    for (let i = 0; i < exam.length; i++) {
      const q = exam[i]

      // Create a mapping of original indices to new indices for choices
      const indices = q.choices.map((_, i) => i)
      const shuffledIndices = shuffleArray(indices)

      // Randomize the order of choices
      q.choices = shuffledIndices.map((i) => q.choices[i])

      // Update the answer indices to reflect the new order
      if (q.type === 'multiple-choice') {
        q.answer = q.choices.map((c, i) => (c.correct ? i : null)).filter((c) => c !== null)
      } else {
        throw new Error(`Unsupported question type: ${q.type}`)
      }

      exam[i] = q
    }

    return exam
  } catch (err) {
    console.error('Error formatting exam:', err)
    return exam
  }

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
}

/**
 * Format the Session object.
 * @param {Session} session - The session object to format.
 * @param {number} questionCount - The number of questions in the exam.
 * @returns {Session} - The formatted exam object.
 */
export function formatSession(session: Session, questionCount: number, examType: ExamType): Session {
  try {
    const nullArr = Array(questionCount - session.answers.length).fill(null)
    session.answers = session.answers.concat(nullArr)

    const maxTime = examType === 'exam' ? 13800 : 2760
    session.maxTime = maxTime
    session.time = maxTime
  } catch (err) {
    console.error('Error formatting session:', err)
  }

  return session
}

/**
 * Format the answer label.
 * @param {Question} question - The question object.
 * @param {LangCode} lang - The language code.
 * @returns {string} - The formatted answer label.
 */
export function formatAnswerLabel({ type, answer }: Question, lang: LangCode): string {
  try {
    if (type === 'multiple-choice' && Array.isArray(answer)) {
      return answer.map((i: number) => formatChoiceLabel(i, lang)).join(', ')
    }

    return answer?.toString() || '....'
  } catch (err) {
    console.error(`Error formatting answer label for question type ${type} and language ${lang}:`, err)
    return '....'
  }
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

  try {
    return labels[lang][index]
  } catch (err) {
    console.error(`Invalid index ${index} for language ${lang}. Returning default label 'A'.`)
    return 'A'
  }
}
