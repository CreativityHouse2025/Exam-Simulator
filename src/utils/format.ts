import type { Choice, Exam, LangCode, Question } from '../types.js'

import { formatDistance, format } from 'date-fns'

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
 * Format exam by setting correct answer indices.
 * Pure — returns new Question objects without mutating the input.
 * @param {Exam} exam - The exam object to format.
 * @returns {Exam} - The formatted exam object.
 */
export function formatExam(exam: Exam): Exam {
  return exam.map((q) => {
    if (q.type !== 'multiple-choice') {
      throw new Error(`Unsupported question type: ${q.type}`)
    }
    const answer = q.choices.map((c, i) => (c.correct ? i : null)).filter((i): i is number => i !== null)
    return { ...q, answer }
  })
}

/**
 * Returns the original-index positions of every correct choice in a raw question.
 * "Original index" = the choice's position in the question file, before any display ordering.
 * This is the canonical answer representation used by the results computer, the revision
 * adapter, and applyQuestionChoiceOrders — keep this as the single definition of that rule.
 */
export function getCorrectOriginalIndices(question: Question): number[] {
  if (question.type !== 'multiple-choice') {
    throw new Error(`Unsupported question type: ${question.type}`)
  }
  return question.choices.reduce<number[]>((accumulator, choice, originalIndex) => {
    if (choice.correct) accumulator.push(originalIndex)
    return accumulator
  }, [])
}

/**
 * Applies a per-question choice order to an exam, reordering each question's choices
 * and stamping each with its originalIndex. Sets question.answer as the original indices
 * of correct choices (choice IDs), which are stable across any display order.
 * Pure — returns new Question/Choice objects without mutating the input.
 */
export function applyQuestionChoiceOrders(exam: Exam, questionChoiceOrders: Record<number, number[]>): Exam {
  return exam.map((question) => {
    if (question.type !== 'multiple-choice') throw new Error(`Unsupported question type: ${question.type}`)

    // displayOrder[i] = the original index of the choice to show at display position i
    // e.g. [3, 0, 2, 1] means: show choice[3] first, then choice[0], choice[2], choice[1]
    const displayOrder = questionChoiceOrders[question.id]
    if (!displayOrder) throw new Error(`Missing choice order for question id ${question.id}`)

    // Step 1: index the raw choices by their original index (position in the exam file)
    const choicesById: Record<number, Choice> = Object.fromEntries(
      question.choices.map((choice, originalIndex) => [originalIndex, choice])
    )

    // Step 2: walk the display order and place each choice at its display position,
    // stamping its original index as its ID
    const orderedChoices = displayOrder.map((choiceId) => ({
      ...choicesById[choiceId],
      originalIndex: choiceId,
    }))

    // returns the question content, with choices in the shuffled order, and the answer array by choice ID
    return { ...question, choices: orderedChoices, answer: getCorrectOriginalIndices(question) }
  })
}

/**
 * Format answer label for display in the explanation section of the question
 * @param {Question} question - The question object.
 * @param {LangCode} lang - The language code.
 * @returns {string} - The formatted answer label.
 */
export function formatCorrectAnswerLabel(question: Question, lang: LangCode): string {
  try {
    if (question.type === 'multiple-choice' && Array.isArray(question.answer)) {
      // question.answer holds original indices (choice IDs); find each one's display position
      // to correctly display the choice's character
      const displayIndices = question.answer.map((origIdx) =>
        question.choices.findIndex((c) => c.originalIndex === origIdx)
      )
      return displayIndices.filter((i) => i >= 0).map((i) => formatChoiceLabel(i, lang)).join(', ')
    }
    return question.answer?.toString() || '....'
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

export function hasInvalidNameChars(name: string): boolean {
  // \p{L} = any kind of letter from any language
  // \s = space
  const invalidPattern = /[^\p{L}\s]/u;
  return invalidPattern.test(name);
}
