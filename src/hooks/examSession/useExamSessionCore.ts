import { useSessionControl, useSessionNavigation, useSessionExam, useSessionData, useExam } from '../../contexts'
import { SESSION_ACTION_TYPES } from '../../constants'
import type { Exam, Answers } from '../../types'

/**
 * Core facade hook exposing shared session state and actions used across all exam types.
 * Combines navigation, exam state, data, and exam content into a single ergonomic interface.
 */
export function useExamSessionCore() {
  const { session } = useSessionControl()
  const { index, update: navUpdate } = useSessionNavigation()
  const { examState, reviewState, update: examUpdate } = useSessionExam()
  const { bookmarks, selectedOriginalIndices, dirtyQuestions, update: dataUpdate } = useSessionData()
  const { exam: examOrNull } = useExam()
  const exam = examOrNull as Exam

  const setIndex = (newIndex: number) => {
    navUpdate!(
      [SESSION_ACTION_TYPES.SET_INDEX, newIndex],
      [SESSION_ACTION_TYPES.SET_REVIEW_STATE, 'question']
    )
  }

  const setReviewState = (state: 'summary' | 'question') => {
    examUpdate!([SESSION_ACTION_TYPES.SET_REVIEW_STATE, state])
  }

  const toggleBookmark = () => {
    const bookmarked = bookmarks.includes(index)
    const newBookmarks = bookmarked
      ? bookmarks.filter((i) => i !== index)
      : [...bookmarks, index]
    dataUpdate!(
      [SESSION_ACTION_TYPES.SET_BOOKMARKS, newBookmarks],
      [SESSION_ACTION_TYPES.MARK_DIRTY, index]
    )
  }

  const setAnswer = (questionIndex: number, newAnswers: number[]) => {
    const newSelected: Answers = selectedOriginalIndices.map(
      (a, i) => (i === questionIndex ? newAnswers : a)
    )
    dataUpdate!(
      [SESSION_ACTION_TYPES.SET_ANSWERS, newSelected],
      [SESSION_ACTION_TYPES.MARK_DIRTY, questionIndex]
    )
  }

  return {
    sessionId: session!.id,
    exam,
    index,
    examState,
    reviewState,
    bookmarks,
    selectedOriginalIndices,
    dirtyQuestions,
    setIndex,
    setReviewState,
    toggleBookmark,
    setAnswer,
  }
}
