import { describe, expect, it } from '@jest/globals'
import * as fc from 'fast-check'
import { isAnswerCorrect, isQuestionMistake } from '../src/utils/results.js'

describe('isAnswerCorrect', () => {
  // ── example tests ───────────────────────────────────────────────────────────

  it('exact match → true', () => {
    expect(isAnswerCorrect([1], [1])).toBe(true)
  })

  it('wrong single answer → false', () => {
    expect(isAnswerCorrect([0], [1])).toBe(false)
  })

  it('empty user answer → false', () => {
    expect(isAnswerCorrect([], [1])).toBe(false)
  })

  it('multi-answer: all correct in same order → true', () => {
    expect(isAnswerCorrect([1, 3], [1, 3])).toBe(true)
  })

  it('multi-answer: all correct in different order → true', () => {
    expect(isAnswerCorrect([3, 1], [1, 3])).toBe(true)
  })

  it('multi-answer: partially correct → false', () => {
    expect(isAnswerCorrect([1], [1, 3])).toBe(false)
  })

  it('multi-answer: superset of correct → false', () => {
    expect(isAnswerCorrect([1, 3, 5], [1, 3])).toBe(false)
  })

  // ── property tests ──────────────────────────────────────────────────────────

  it('property: isAnswerCorrect(a, a) is always true for any non-empty answer', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 20 }), { minLength: 1, maxLength: 6 }),
        (answer) => {
          expect(isAnswerCorrect(answer, answer)).toBe(true)
        }
      )
    )
  })

  it('property: shuffling user answer does not change the result', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 20 }), { minLength: 1, maxLength: 6 }),
        fc.array(fc.integer({ min: 0, max: 20 }), { minLength: 1, maxLength: 6 }),
        (userAnswer, correctAnswer) => {
          const shuffled = [...userAnswer].reverse()
          expect(isAnswerCorrect(shuffled, correctAnswer)).toBe(
            isAnswerCorrect(userAnswer, correctAnswer)
          )
        }
      )
    )
  })

  it('property: length mismatch always → false', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 20 }), { minLength: 1, maxLength: 5 }),
        fc.array(fc.integer({ min: 0, max: 20 }), { minLength: 1, maxLength: 5 }),
        fc.boolean(),
        (a, b, swap) => {
          const [shorter, longer] = a.length < b.length ? [a, b] : [b, a]
          if (shorter.length === longer.length) return
          const extra = [...longer, 999]
          expect(isAnswerCorrect(swap ? shorter : extra, swap ? extra : shorter)).toBe(false)
        }
      )
    )
  })
})

// ── isQuestionMistake ─────────────────────────────────────────────────────────

describe('isQuestionMistake', () => {
  it('null → true (unanswered)', () => {
    expect(isQuestionMistake(null, [0])).toBe(true)
  })

  it('undefined → true (unanswered)', () => {
    expect(isQuestionMistake(undefined, [0])).toBe(true)
  })

  it('empty array → true (unanswered)', () => {
    expect(isQuestionMistake([], [0])).toBe(true)
  })

  it('wrong single answer → true', () => {
    expect(isQuestionMistake([1], [0])).toBe(true)
  })

  it('correct single answer → false', () => {
    expect(isQuestionMistake([0], [0])).toBe(false)
  })

  it('correct multi-answer in different order → false', () => {
    expect(isQuestionMistake([1, 0], [0, 1])).toBe(false)
  })

  it('partially correct multi-answer → true', () => {
    expect(isQuestionMistake([0], [0, 1])).toBe(true)
  })

  it('property: any non-empty correct answer is not a mistake', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 1, maxLength: 5 }),
        (answer) => {
          expect(isQuestionMistake(answer, answer)).toBe(false)
        }
      )
    )
  })
})
