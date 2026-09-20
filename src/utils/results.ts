/**
 * Returns true when userAnswer contains exactly the same set of original indices as correctAnswer.
 * Order-independent: [1, 0] and [0, 1] are equal.
 */
import type { AttemptResult } from '../apiTypes'

/**
 * Returns true when userAnswer contains exactly the same set of original indices as correctAnswer.
 * Order-independent: [1, 0] and [0, 1] are equal.
 */
export function isAnswerCorrect(userAnswer: number[], correctAnswer: number[]): boolean {
  if (userAnswer.length !== correctAnswer.length) return false
  const sortedUser = [...userAnswer].sort((a, b) => a - b)
  const sortedCorrect = [...correctAnswer].sort((a, b) => a - b)
  return sortedUser.every((val, i) => val === sortedCorrect[i])
}

/**
 * Grades a session entirely client-side, from disclosed content — the only path available to a
 * session that never reaches the server (a supervisor preview, or a revision retry). A real,
 * persisted session is graded by submit_attempt instead; this exists to give both the exact same
 * Session.result shape.
 */
export function computeLocalResult(
  questions: { choices: { position: number; isCorrect: boolean }[] }[],
  selectedChoices: number[][],
  passingRate: number | null,
): AttemptResult {
  const totalQuestions = questions.length
  const correctQuestions = questions.reduce((count, question, index) => {
    const correctPositions = question.choices.filter((choice) => choice.isCorrect).map((choice) => choice.position)
    return isAnswerCorrect(selectedChoices[index] ?? [], correctPositions) ? count + 1 : count
  }, 0)
  const score = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0

  return {
    score,
    status: passingRate === null ? null : score >= passingRate ? 'pass' : 'fail',
    wrongQuestions: totalQuestions - correctQuestions,
    totalQuestions,
  }
}

/**
 * Splits `AttemptResult.wrongQuestions` (wrong OR unanswered) back into its two parts for the
 * summary screen. Needs no disclosed content — `selectedChoices` is already in the session, so
 * this works before the answer key has arrived.
 */
export function deriveSummaryStats(
  result: Pick<AttemptResult, 'totalQuestions' | 'wrongQuestions'>,
  selectedChoices: number[][],
): { correctCount: number; incorrectCount: number; incompleteCount: number } {
  const incompleteCount = selectedChoices.filter((choices) => choices.length === 0).length
  const correctCount = result.totalQuestions - result.wrongQuestions
  const incorrectCount = result.wrongQuestions - incompleteCount
  return { correctCount, incorrectCount, incompleteCount }
}

