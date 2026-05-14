import { describe, expect, it } from '@jest/globals'
import * as fc from 'fast-check'
import { applyQuestionChoiceOrders, formatCorrectAnswerLabel, getCorrectOriginalIndices } from '../src/utils/format.js'
import type { Question } from '../src/types.js'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeQuestion(choices: Array<{ text: string; correct: boolean }>, id = 1): Question {
  return {
    id,
    type: 'multiple-choice',
    categoryId: null,
    text: 'Q',
    explanation: '',
    choices: choices.map((c) => ({ text: c.text, correct: c.correct })),
    answer: choices.flatMap((c, i) => (c.correct ? [i] : [])),
  }
}

/** Generates a full permutation of [0..n-1] */
function arbPermutation(n: number): fc.Arbitrary<number[]> {
  return fc.shuffledSubarray(
    Array.from({ length: n }, (_, i) => i),
    { minLength: n, maxLength: n }
  )
}

/** Generates a question with exactly n choices, at least the first one marked correct */
function arbQuestion(n: number): fc.Arbitrary<Question> {
  return fc
    .tuple(
      fc.integer({ min: 1, max: 9999 }),
      fc.array(fc.boolean(), { minLength: n, maxLength: n })
    )
    .map(([id, flags]) => {
      const corrected = flags.map((v, i) => (i === 0 ? true : v))
      return makeQuestion(
        corrected.map((correct, i) => ({ text: `C${i}`, correct })),
        id
      )
    })
}

// ── applyQuestionChoiceOrders ─────────────────────────────────────────────────

describe('applyQuestionChoiceOrders', () => {
  it('identity order: choice text order unchanged and originalIndex stamped', () => {
    const q = makeQuestion([
      { text: 'A', correct: false },
      { text: 'B', correct: true },
      { text: 'C', correct: false },
      { text: 'D', correct: true },
      { text: 'E', correct: false }
    ])
    const [result] = applyQuestionChoiceOrders([q], { [q.id]: [0, 1, 2, 3, 4] })

    expect(result.choices.map((c) => c.text)).toEqual(['A', 'B', 'C', 'D', 'E'])
    expect(result.choices.map((c) => c.originalIndex)).toEqual([0, 1, 2, 3, 4])
  })

  it('reversed order: choices appear in reverse with originalIndex matching original position', () => {
    const q = makeQuestion([
      { text: 'A', correct: false },
      { text: 'B', correct: true },
      { text: 'C', correct: false },
    ])
    const [result] = applyQuestionChoiceOrders([q], { [q.id]: [2, 1, 0] })

    expect(result.choices.map((c) => c.text)).toEqual(['C', 'B', 'A'])
    expect(result.choices.map((c) => c.originalIndex)).toEqual([2, 1, 0])
  })

  it('answer holds originalIndex of correct choices, not display positions', () => {
    // Correct choice is originally at index 2. After reversing, it appears at display position 0.
    const q = makeQuestion([
      { text: 'A', correct: false },
      { text: 'B', correct: false },
      { text: 'C', correct: true },
    ])
    const [result] = applyQuestionChoiceOrders([q], { [q.id]: [2, 1, 0] })

    // Must be [2] (originalIndex), NOT [0] (display position after reverse)
    expect(result.answer).toEqual([2])
  })

  it('multi-answer: answer contains all correct originalIndices', () => {
    // Correct at original indices 0 and 2. Display order reverses them.
    const q = makeQuestion([
      { text: 'A', correct: true },
      { text: 'B', correct: true },
      { text: 'C', correct: true },
      { text: 'D', correct: false },
    ])
    const [result] = applyQuestionChoiceOrders([q], { [q.id]: [3, 2, 1, 0] })

    expect(result.choices.map((c) => c.originalIndex)).toEqual([3, 2, 1, 0])
    expect(result.choices.map((c) => c.text)).toEqual(['D', 'C', 'B', 'A'])
    expect(result.answer).toHaveLength(3)
    expect(result.answer).toEqual(expect.arrayContaining([0, 1, 2]))
  })

  it('handles multiple questions with different choice counts independently', () => {
    const q1 = makeQuestion([{ text: 'A', correct: true }, { text: 'B', correct: false }], 1)

    const q2 = makeQuestion(
      [{ text: 'A', correct: false }, { text: 'B', correct: false }, { text: 'C', correct: true }],
      2
    )

    const [r1, r2] = applyQuestionChoiceOrders([q1, q2],
      {
        1: [1, 0],
        2: [2, 0, 1]
      })

    expect(r1.choices.map((c) => c.text)).toEqual(['B', 'A'])
    expect(r1.answer).toEqual([0])

    expect(r2.choices.map((c) => c.text)).toEqual(['C', 'A', 'B'])
    expect(r2.answer).toEqual([2])
  })

  it('throws when a question id is missing from the orders map', () => {
    const q = makeQuestion([{ text: 'A', correct: true }], 99)
    expect(() => applyQuestionChoiceOrders([q], {})).toThrow()
  })

  it('property: output choice count equals input choice count for any permutation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 6 }).chain((n) => fc.tuple(arbQuestion(n), arbPermutation(n))),
        ([q, order]) => {
          const [result] = applyQuestionChoiceOrders([q], { [q.id]: order })
          expect(result.choices).toHaveLength(q.choices.length)
        }
      )
    )
  })

  it('property: every value in answer is a valid originalIndex present in the reordered choices', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 6 }).chain((n) => fc.tuple(arbQuestion(n), arbPermutation(n))),
        ([q, order]) => {
          const [result] = applyQuestionChoiceOrders([q], { [q.id]: order })
          const validOriginals = new Set(result.choices.map((c) => c.originalIndex))
          for (const id of result.answer) {
            expect(validOriginals.has(id)).toBe(true)
          }
        }
      )
    )
  })

  it('property: the set of correct choices is the same regardless of display order', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 6 }).chain((n) => fc.tuple(arbQuestion(n), arbPermutation(n))),
        ([q, order]) => {
          const originalCorrectIndices = q.choices
            .flatMap((c, i) => (c.correct ? [i] : []))
            .sort((a, b) => a - b)

          const [result] = applyQuestionChoiceOrders([q], { [q.id]: order })
          const resultAnswerSorted = [...result.answer].sort((a, b) => a - b)

          expect(resultAnswerSorted).toEqual(originalCorrectIndices)
        }
      )
    )
  })
})

// ── formatCorrectAnswerLabel ──────────────────────────────────────────────────

describe('formatCorrectAnswerLabel', () => {
  it('single correct at display position 0 → A', () => {
    const q = makeQuestion([{ text: 'Right', correct: true }, { text: 'Wrong', correct: false }])
    const [ordered] = applyQuestionChoiceOrders([q], { [q.id]: [0, 1] })
    expect(formatCorrectAnswerLabel(ordered, 'en')).toBe('A')
  })

  it('single correct at display position 0 → A', () => {
    const q = makeQuestion([
      { text: 'A', correct: false },
      { text: 'B', correct: false },
      { text: 'C', correct: true },
    ])
    const [ordered] = applyQuestionChoiceOrders([q], { [q.id]: [2, 0, 1] })
    expect(formatCorrectAnswerLabel(ordered, 'en')).toBe('A')
  })

  it('reversed: correct was originally index 0, now displayed last → last label', () => {
    // Original: [Right, Wrong1, Wrong2]. After reversing, Right is at display position 2 → C
    const q = makeQuestion([
      { text: 'Right', correct: true },
      { text: 'Wrong1', correct: false },
      { text: 'Wrong2', correct: false },
    ])
    const ordered = applyQuestionChoiceOrders([q], { [q.id]: [2, 1, 0] })[0]
    expect(formatCorrectAnswerLabel(ordered, 'en')).toBe('C')
  })

  it('multi-answer: returns labels in display order, comma-separated', () => {
    // B (index 1) and D (index 3) are correct under identity order
    const q = makeQuestion([
      { text: 'A', correct: false },
      { text: 'B', correct: true },
      { text: 'C', correct: false },
      { text: 'D', correct: true },
    ])
    const ordered = applyQuestionChoiceOrders([q], { [q.id]: [0, 1, 2, 3] })[0]
    expect(formatCorrectAnswerLabel(ordered, 'en')).toBe('B, D')
  })

  it('property: number of labels returned equals answer length for any permutation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 6 }).chain((n) => fc.tuple(arbQuestion(n), arbPermutation(n))),
        ([q, order]) => {
          const ordered = applyQuestionChoiceOrders([q], { [q.id]: order })[0]
          const label = formatCorrectAnswerLabel(ordered, 'en')
          const labelCount = label.split(',').filter((s) => s.trim() !== '').length
          expect(labelCount).toBe(ordered.answer.length)
        }
      )
    )
  })
})

// ── getCorrectOriginalIndices ─────────────────────────────────────────────────

describe('getCorrectOriginalIndices', () => {
  it('single correct at index 0 → [0]', () => {
    const q = makeQuestion([{ text: 'A', correct: true }, { text: 'B', correct: false }])
    expect(getCorrectOriginalIndices(q)).toEqual([0])
  })

  it('single correct at last index → [n-1]', () => {
    const q = makeQuestion([
      { text: 'A', correct: false },
      { text: 'B', correct: false },
      { text: 'C', correct: true },
    ])
    expect(getCorrectOriginalIndices(q)).toEqual([2])
  })

  it('multiple correct → all their indices', () => {
    const q = makeQuestion([
      { text: 'A', correct: true },
      { text: 'B', correct: false },
      { text: 'C', correct: true },
    ])
    expect(getCorrectOriginalIndices(q)).toEqual([0, 2])
  })

  it('all choices correct → [0, 1, ..., n-1]', () => {
    const q = makeQuestion([
      { text: 'A', correct: true },
      { text: 'B', correct: true },
      { text: 'C', correct: true },
    ])
    expect(getCorrectOriginalIndices(q)).toEqual([0, 1, 2])
  })

  it('no correct choices → empty array', () => {
    const q = makeQuestion([{ text: 'A', correct: false }, { text: 'B', correct: false }])
    expect(getCorrectOriginalIndices(q)).toEqual([])
  })

  it('throws for unsupported question type', () => {
    const q = { ...makeQuestion([{ text: 'A', correct: true }]), type: 'fill-in' as never }
    expect(() => getCorrectOriginalIndices(q)).toThrow()
  })

  it('property: output indices are a subset of [0..choices.length-1]', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 6 }).chain((n) => arbQuestion(n)),
        (q) => {
          const indices = getCorrectOriginalIndices(q)
          for (const idx of indices) {
            expect(idx).toBeGreaterThanOrEqual(0)
            expect(idx).toBeLessThan(q.choices.length)
          }
        }
      )
    )
  })

  it('property: every returned index has choice.correct === true', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 6 }).chain((n) => arbQuestion(n)),
        (q) => {
          const indices = getCorrectOriginalIndices(q)
          for (const idx of indices) {
            expect(q.choices[idx].correct).toBe(true)
          }
        }
      )
    )
  })

  it('property: result equals the answer produced by applyQuestionChoiceOrders under any permutation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 6 }).chain((n) => fc.tuple(arbQuestion(n), arbPermutation(n))),
        ([q, order]) => {
          const [ordered] = applyQuestionChoiceOrders([q], { [q.id]: order })
          const direct = getCorrectOriginalIndices(q).sort((a, b) => a - b)
          const fromOrdered = [...ordered.answer].sort((a, b) => a - b)
          expect(direct).toEqual(fromOrdered)
        }
      )
    )
  })
})
