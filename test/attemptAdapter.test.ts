import { describe, expect, it } from '@jest/globals'
import * as fc from 'fast-check'
import { adaptAttemptToSession, adaptAttemptToRevision } from '../src/utils/attemptAdapter.js'
import type { AttemptDetail, AttemptQuestion, GetAttemptResult, Exam, Question } from '../src/types.js'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeAttemptQuestion(overrides: Partial<AttemptQuestion> = {}): AttemptQuestion {
  return {
    question_index: 0,
    question_id: 1,
    choices_order: [0, 1, 2, 3],
    selected_choices: [],
    is_bookmarked: false,
    ...overrides,
  }
}

function makeAttemptDetail(overrides: Partial<AttemptDetail> = {}): AttemptDetail {
  return {
    id: 'attempt-1',
    exam_type: 'full',
    exam_id: 1,
    category_id: null,
    exam_state: 'in-progress',
    score: 0,
    status: null,
    created_at: '2024-01-01T00:00:00.000Z',
    current_index: 0,
    time_remaining: 1000,
    review_state: 'summary',
    email_report_state: 'unsent',
    ...overrides,
  }
}

function makeGetAttemptResult(
  questions: AttemptQuestion[],
  detail: Partial<AttemptDetail> = {}
): GetAttemptResult {
  return { attempt: makeAttemptDetail(detail), questions }
}

function makeRawQuestion(choices: Array<{ correct: boolean }>, id = 1): Question {
  return {
    id,
    type: 'multiple-choice',
    categoryId: null,
    text: `Q${id}`,
    explanation: '',
    choices: choices.map((c, i) => ({ text: `C${i}`, correct: c.correct })),
    answer: choices.flatMap((c, i) => (c.correct ? [i] : [])),
  }
}

// ── adaptAttemptToSession ─────────────────────────────────────────────────────

describe('adaptAttemptToSession', () => {
  it('returns null on empty questions array', () => {
    expect(adaptAttemptToSession(makeGetAttemptResult([]))).toBeNull()
  })

  it('questionIds matches the question_id order from payload', () => {
    const questions = [
      makeAttemptQuestion({ question_id: 10, question_index: 0 }),
      makeAttemptQuestion({ question_id: 20, question_index: 1 }),
      makeAttemptQuestion({ question_id: 30, question_index: 2 }),
    ]
    const result = adaptAttemptToSession(makeGetAttemptResult(questions))
    expect(result?.questionIds).toEqual([10, 20, 30])
  })

  it('paused is false for in-progress attempt', () => {
    const q = makeAttemptQuestion()
    const result = adaptAttemptToSession(makeGetAttemptResult([q], { exam_state: 'in-progress' }))
    expect(result?.paused).toBe(false)
  })

  it('paused is true for completed attempt (timer stop invariant reconstructed from exam_state)', () => {
    const q = makeAttemptQuestion()
    const result = adaptAttemptToSession(makeGetAttemptResult([q], { exam_state: 'completed' }))
    expect(result?.paused).toBe(true)
  })

  it('questionChoiceOrders keys match questionIds exactly', () => {
    const questions = [
      makeAttemptQuestion({ question_id: 5, choices_order: [2, 0, 1] }),
      makeAttemptQuestion({ question_id: 7, choices_order: [1, 2, 0] }),
    ]
    const result = adaptAttemptToSession(makeGetAttemptResult(questions))!
    expect(result.questionChoiceOrders[5]).toEqual([2, 0, 1])
    expect(result.questionChoiceOrders[7]).toEqual([1, 2, 0])
    const keys = Object.keys(result.questionChoiceOrders).map(Number).sort((a, b) => a - b)
    const ids = (result.questionIds as number[]).slice().sort((a, b) => a - b)
    expect(keys).toEqual(ids)
  })

  it('bookmarks holds only the question_index values of bookmarked questions', () => {
    const questions = [
      makeAttemptQuestion({ question_id: 1, question_index: 0, is_bookmarked: true }),
      makeAttemptQuestion({ question_id: 2, question_index: 1, is_bookmarked: false }),
      makeAttemptQuestion({ question_id: 3, question_index: 2, is_bookmarked: true }),
    ]
    const result = adaptAttemptToSession(makeGetAttemptResult(questions))
    expect(result?.bookmarks).toEqual([0, 2])
  })

  it('bookmarks is empty when no questions are bookmarked', () => {
    const questions = [
      makeAttemptQuestion({ question_id: 1, is_bookmarked: false }),
      makeAttemptQuestion({ question_id: 2, is_bookmarked: false }),
    ]
    const result = adaptAttemptToSession(makeGetAttemptResult(questions))
    expect(result?.bookmarks).toEqual([])
  })

  it('maxTime uses exam-types duration for full (230 min = 13800 s)', () => {
    const q = makeAttemptQuestion()
    const result = adaptAttemptToSession(makeGetAttemptResult([q], { exam_type: 'full', time_remaining: 999 }))
    expect(result?.maxTime).toBe(230 * 60)
  })

  it('maxTime uses exam-types duration for domain (300 min = 18000 s)', () => {
    const q = makeAttemptQuestion()
    const result = adaptAttemptToSession(makeGetAttemptResult([q], { exam_type: 'domain', time_remaining: 999 }))
    expect(result?.maxTime).toBe(300 * 60)
  })

  it('maxTime falls back to time_remaining when exam type has no configured duration', () => {
    const q = makeAttemptQuestion()
    const payload = makeGetAttemptResult([q], { time_remaining: 5555 })
    // Simulate an exam type not present in exam-types.json
    ;(payload.attempt as Record<string, unknown>)['exam_type'] = 'unconfigured'
    const result = adaptAttemptToSession(payload)
    expect(result?.maxTime).toBe(5555)
  })

  it('selectedOriginalIndices matches selected_choices per question in order', () => {
    const questions = [
      makeAttemptQuestion({ question_id: 1, selected_choices: [0] }),
      makeAttemptQuestion({ question_id: 2, selected_choices: [2, 1] }),
      makeAttemptQuestion({ question_id: 3, selected_choices: [] }),
    ]
    const result = adaptAttemptToSession(makeGetAttemptResult(questions))
    expect(result?.selectedOriginalIndices).toEqual([[0], [2, 1], []])
  })
})

// ── adaptAttemptToRevision ────────────────────────────────────────────────────

describe('adaptAttemptToRevision', () => {
  it('returns null when exam_type is not full', () => {
    const rawExam: Exam = [makeRawQuestion([{ correct: true }, { correct: false }], 1)]
    const payload = makeGetAttemptResult(
      [makeAttemptQuestion({ question_id: 1 })],
      { exam_type: 'domain' }
    )
    expect(adaptAttemptToRevision(payload, rawExam)).toBeNull()
  })

  it('returns null on empty questions array', () => {
    expect(adaptAttemptToRevision(makeGetAttemptResult([], { exam_type: 'full' }), [])).toBeNull()
  })

  it('returns null when all questions are answered correctly', () => {
    const rawExam: Exam = [makeRawQuestion([{ correct: true }, { correct: false }], 1)]
    const payload = makeGetAttemptResult(
      [makeAttemptQuestion({ question_id: 1, selected_choices: [0] })],
      { exam_type: 'full' }
    )
    expect(adaptAttemptToRevision(payload, rawExam)).toBeNull()
  })

  it('includes unanswered (empty selected_choices) as a mistake', () => {
    const rawExam: Exam = [makeRawQuestion([{ correct: true }, { correct: false }], 1)]
    const payload = makeGetAttemptResult(
      [makeAttemptQuestion({ question_id: 1, selected_choices: [] })],
      { exam_type: 'full' }
    )
    const result = adaptAttemptToRevision(payload, rawExam)
    expect(result).not.toBeNull()
    expect(result?.questionIds).toEqual([1])
  })

  it('includes wrongly answered question', () => {
    const rawExam: Exam = [makeRawQuestion([{ correct: true }, { correct: false }], 1)]
    const payload = makeGetAttemptResult(
      [makeAttemptQuestion({ question_id: 1, selected_choices: [1] })],
      { exam_type: 'full' }
    )
    const result = adaptAttemptToRevision(payload, rawExam)
    expect(result).not.toBeNull()
    expect(result?.questionIds).toEqual([1])
  })

  it('excludes correctly answered question', () => {
    const rawExam: Exam = [
      makeRawQuestion([{ correct: true }, { correct: false }], 1),
      makeRawQuestion([{ correct: false }, { correct: true }], 2),
    ]
    const payload = makeGetAttemptResult(
      [
        makeAttemptQuestion({ question_id: 1, selected_choices: [0] }), // correct
        makeAttemptQuestion({ question_id: 2, selected_choices: [0] }), // wrong
      ],
      { exam_type: 'full' }
    )
    const result = adaptAttemptToRevision(payload, rawExam)
    expect(result?.questionIds).toEqual([2])
  })

  it('mixed: only wrong and unanswered questions appear in output', () => {
    const rawExam: Exam = [
      makeRawQuestion([{ correct: true }, { correct: false }], 1),  // correct at index 0
      makeRawQuestion([{ correct: false }, { correct: true }], 2),  // correct at index 1
      makeRawQuestion([{ correct: true }, { correct: false }], 3),  // correct at index 0
    ]
    const payload = makeGetAttemptResult(
      [
        makeAttemptQuestion({ question_id: 1, selected_choices: [0] }), // correct → excluded
        makeAttemptQuestion({ question_id: 2, selected_choices: [0] }), // wrong → included
        makeAttemptQuestion({ question_id: 3, selected_choices: [] }),  // unanswered → included
      ],
      { exam_type: 'full' }
    )
    const result = adaptAttemptToRevision(payload, rawExam)
    expect(result?.questionIds).toEqual([2, 3])
  })

  it('questionIds and questionChoiceOrders keys are in sync', () => {
    const rawExam: Exam = [
      makeRawQuestion([{ correct: true }, { correct: false }], 1),
      makeRawQuestion([{ correct: false }, { correct: true }], 2),
    ]
    const payload = makeGetAttemptResult(
      [
        makeAttemptQuestion({ question_id: 1, selected_choices: [1], choices_order: [0, 1] }), // wrong
        makeAttemptQuestion({ question_id: 2, selected_choices: [1], choices_order: [1, 0] }), // correct
      ],
      { exam_type: 'full' }
    )
    const result = adaptAttemptToRevision(payload, rawExam)!
    const ids = (result.questionIds as number[]).slice().sort((a, b) => a - b)
    const keys = Object.keys(result.questionChoiceOrders).map(Number).sort((a, b) => a - b)
    expect(ids).toEqual(keys)
  })

  it('selectedOriginalIndices are all empty arrays, one per mistake', () => {
    const rawExam: Exam = [
      makeRawQuestion([{ correct: false }, { correct: true }], 1),
      makeRawQuestion([{ correct: false }, { correct: true }], 2),
    ]
    const payload = makeGetAttemptResult(
      [
        makeAttemptQuestion({ question_id: 1, selected_choices: [] }),  // unanswered
        makeAttemptQuestion({ question_id: 2, selected_choices: [0] }), // wrong
      ],
      { exam_type: 'full' }
    )
    const result = adaptAttemptToRevision(payload, rawExam)
    expect(result?.selectedOriginalIndices).toEqual([[], []])
  })

  it('session shape: examType=revision, id="", examState=in-progress, paused=false, bookmarks=[]', () => {
    const rawExam: Exam = [makeRawQuestion([{ correct: false }, { correct: true }], 1)]
    const payload = makeGetAttemptResult(
      [makeAttemptQuestion({ question_id: 1, selected_choices: [] })],
      { exam_type: 'full', exam_id: 42 }
    )
    const result = adaptAttemptToRevision(payload, rawExam)!
    expect(result.examType).toBe('revision')
    expect(result.id).toBe('')
    expect(result.examState).toBe('in-progress')
    expect(result.paused).toBe(false)
    expect(result.bookmarks).toEqual([])
    expect(result.index).toBe(0)
  })

  it('examId is preserved from the original attempt', () => {
    const rawExam: Exam = [makeRawQuestion([{ correct: false }, { correct: true }], 1)]
    const payload = makeGetAttemptResult(
      [makeAttemptQuestion({ question_id: 1, selected_choices: [] })],
      { exam_type: 'full', exam_id: 99 }
    )
    expect(adaptAttemptToRevision(payload, rawExam)?.examId).toBe(99)
  })

  it('maxTime uses exam-types duration for full (230 min = 13800 s)', () => {
    const rawExam: Exam = [makeRawQuestion([{ correct: false }, { correct: true }], 1)]
    const payload = makeGetAttemptResult(
      [makeAttemptQuestion({ question_id: 1, selected_choices: [] })],
      { exam_type: 'full', time_remaining: 999 }
    )
    expect(adaptAttemptToRevision(payload, rawExam)?.maxTime).toBe(230 * 60)
  })

  it('property: for any attempt with at least one mistake, questionIds.length equals the mistake count', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 8 }),
        (n) => {
          // All questions have correct index 0. Alternate correct/wrong answers.
          const rawExam: Exam = Array.from({ length: n }, (_, i) =>
            makeRawQuestion([{ correct: true }, { correct: false }], i + 1)
          )
          const questions: AttemptQuestion[] = rawExam.map((q, i) =>
            makeAttemptQuestion({
              question_id: q.id,
              question_index: i,
              // Even indices: correct [0], Odd indices: wrong [1]
              selected_choices: i % 2 === 0 ? [0] : [1],
            })
          )
          const payload = makeGetAttemptResult(questions, { exam_type: 'full' })
          const mistakeCount = questions.filter((_, i) => i % 2 !== 0).length
          const result = adaptAttemptToRevision(payload, rawExam)
          // n >= 2 so at least 1 odd index always exists → mistakeCount >= 1
          expect(result).not.toBeNull()
          expect((result!.questionIds as number[]).length).toBe(mistakeCount)
        }
      )
    )
  })
})
