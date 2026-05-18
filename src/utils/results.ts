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
 * Returns true when a user left it unanswered or answered it incorrectly.
 */
export function isQuestionMistake(
  userAnswer: number[] | null | undefined,
  correctAnswer: number[]
): boolean {
  if (!userAnswer || userAnswer.length === 0) return true
  return !isAnswerCorrect(userAnswer, correctAnswer)
}

