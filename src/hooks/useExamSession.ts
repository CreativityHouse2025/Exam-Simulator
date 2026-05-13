import React from 'react'
import { SessionReducer } from '../utils/session'
import type { Session, SessionDispatch } from '../types'

// Kept here for when persistence is re-enabled.
// function toOriginalIndices(displayIndices: number[], questionChoices: Exam[number]['choices']): number[] {
//   return displayIndices.map((displayIdx) => questionChoices[displayIdx]?.originalIndex ?? displayIdx)
// }

export default function useExamSession(startingSession: Session) {
  const [session, updateSession] = React.useReducer(SessionReducer, startingSession)

  // Always-current ref used by save handlers to avoid stale closures.
  // const sessionRef = React.useRef(session)
  // sessionRef.current = session

  // Tracks the last successfully persisted answers and bookmarks so only diffs are sent on save.
  // const lastSavedRef = React.useRef<{ selectedOriginalIndices: Answers; bookmarks: number[] }>({
  //   selectedOriginalIndices: startingSession.selectedOriginalIndices,
  //   bookmarks: startingSession.bookmarks,
  // })

  // True while a save or submit request is in-flight. Prevents concurrent interval saves.
  // const isSyncingRef = React.useRef(false)
  // const [isSyncing, setIsSyncing] = React.useState(false)

  // const { saveAttempt, submitAttempt } = useAttempts()
  // const { showToast } = useToast()

  // const doSave = React.useCallback(async (currentSession: Session) => {
  //   if (currentSession.examType === 'revision') return
  //   if (currentSession.examState !== 'in-progress') return
  //   if (currentSession.id === '') return
  //   if (isSyncingRef.current) return

  //   const { selectedOriginalIndices: lastAnswers, bookmarks: lastBookmarks } = lastSavedRef.current
  //   const diffed = currentSession.selectedOriginalIndices.reduce<{ question_index: number; question_id: number; choices_order: number[]; selected_choices: number[]; is_bookmarked: boolean }[]>(
  //     (acc, selected, i) => {
  //       const answerChanged =
  //         (selected?.length ?? 0) !== (lastAnswers[i]?.length ?? 0) ||
  //         (selected ?? []).some((v, j) => v !== (lastAnswers[i] ?? [])[j])
  //       const bookmarkChanged = currentSession.bookmarks.includes(i) !== lastBookmarks.includes(i)
  //       if (answerChanged || bookmarkChanged) {
  //         acc.push({
  //           question_index: i,
  //           question_id: currentExam[i].id,
  //           choices_order: currentExam[i].choices.map((c) => c.originalIndex ?? i),
  //           selected_choices: toOriginalIndices(selected ?? [], currentExam[i].choices),
  //           is_bookmarked: currentSession.bookmarks.includes(i),
  //         })
  //       }
  //       return acc
  //     },
  //     []
  //   )

  //   isSyncingRef.current = true
  //   setIsSyncing(true)
  //   try {
  //     await saveAttempt(currentSession.id, {
  //       current_index: currentSession.index,
  //       time_remaining: currentSession.time,
  //       review_state: currentSession.reviewState,
  //       answers: diffed,
  //     })
  //     lastSavedRef.current = { selectedOriginalIndices: currentSession.selectedOriginalIndices, bookmarks: currentSession.bookmarks }
  //   } catch {
  //     showToast(translate('attempts.errors.server-save-failed'), 5000)
  //   } finally {
  //     isSyncingRef.current = false
  //     setIsSyncing(false)
  //   }
  // }, [saveAttempt, showToast])

  // // 180-second periodic save.
  // React.useEffect(() => {
  //   const id = setInterval(() => {
  //     if (sessionRef.current.paused) return
  //     doSave(sessionRef.current)
  //   }, 180_000)
  //   return () => clearInterval(id)
  // }, [doSave])

  // // Save when the user pauses the exam.
  // React.useEffect(() => {
  //   if (session.paused) doSave(sessionRef.current)
  // }, [session.paused, doSave])

  // // Save when the tab is hidden (user switches away or minimises).
  // React.useEffect(() => {
  //   function handleVisibilityChange() {
  //     if (document.visibilityState === 'hidden') doSave(sessionRef.current)
  //   }
  //   document.addEventListener('visibilitychange', handleVisibilityChange)
  //   return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  // }, [doSave])

  // // Save before page unload — fetch with keepalive:true lets the browser complete the
  // // request after the page is gone; fire-and-forget, cannot await.
  // React.useEffect(() => {
  //   function handleBeforeUnload() {
  //     const s = sessionRef.current
  //     if (s.examType === 'revision' || s.examState !== 'in-progress' || s.id === '') return
  //     const currentExam = examRef.current
  //     const allAnswers = s.selectedOriginalIndices.map((selected, i) => ({
  //       question_index: i,
  //       question_id: currentExam[i].id,
  //       choices_order: currentExam[i].choices.map((c) => c.originalIndex ?? i),
  //       selected_choices: toOriginalIndices(selected ?? [], currentExam[i].choices),
  //       is_bookmarked: s.bookmarks.includes(i),
  //     }))
  //     fetch(`/api/attempts/${s.id}`, {
  //       method: 'PATCH',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         exam_state: 'in-progress',
  //         current_index: s.index,
  //         time_remaining: s.time,
  //         review_state: s.reviewState,
  //         answers: allAnswers,
  //       }),
  //       keepalive: true,
  //     })
  //   }
  //   window.addEventListener('beforeunload', handleBeforeUnload)
  //   return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  // }, [])

  // // Submit attempt on exam completion.
  // const doSubmit = React.useCallback(async (nextSession: Session) => {
  //   if (nextSession.id === '') return
  //   const allAnswers = nextSession.selectedOriginalIndices.map((selected, i) => ({
  //     question_index: i,
  //     question_id: exam[i].id,
  //     choices_order: exam[i].choices.map((c) => c.originalIndex ?? i),
  //     selected_choices: toOriginalIndices(selected ?? [], exam[i].choices),
  //     is_bookmarked: nextSession.bookmarks.includes(i),
  //   }))
  //   const { score, status } = computeResults(nextSession.selectedOriginalIndices, exam, nextSession.examType)
  //   isSyncingRef.current = true
  //   setIsSyncing(true)
  //   try {
  //     await submitAttempt(nextSession.id, {
  //       current_index: nextSession.index,
  //       time_remaining: nextSession.time,
  //       review_state: nextSession.reviewState,
  //       answers: allAnswers,
  //       score,
  //       status,
  //     })
  //   } catch {
  //     showToast(translate('attempts.errors.server-submit-failed'), 5000)
  //   } finally {
  //     isSyncingRef.current = false
  //     setIsSyncing(false)
  //   }
  // }, [exam, submitAttempt, showToast])

  const sessionUpdate = React.useCallback<SessionDispatch>(
    (...actions) => {
      const actionArray = actions.map(([type, payload]) => ({ type, payload }))
      updateSession(actionArray)

      // Submission on completion — re-enable once persistence is wired back up.
      // const nextSession = SessionReducer(session, actionArray)
      // if (session.examState === 'in-progress' && nextSession.examState === 'completed') {
      //   doSubmit(nextSession)
      // }
    },
    []
  )

  const contextValues = {
    navigation: { index: session.index, update: sessionUpdate },
    timer: { time: session.time, maxTime: session.maxTime, paused: session.paused, update: sessionUpdate },
    exam: { examState: session.examState, reviewState: session.reviewState, update: sessionUpdate, categoryId: session.categoryId, examId: session.examId },
    data: { bookmarks: session.bookmarks, selectedOriginalIndices: session.selectedOriginalIndices, examType: session.examType, isSyncing: false, update: sessionUpdate },
  }

  return { session, sessionUpdate, contextValues }
}