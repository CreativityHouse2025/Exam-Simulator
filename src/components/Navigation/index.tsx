import React from 'react'
import styled from 'styled-components'
import Drawer from './Drawer'
import Footer from './Footer'
import Content from '../Content'
import Confirms from './Confirms'
import {
  SessionDataContext,
  SessionExamContext,
  SessionNavigationContext,
  SessionTimerContext
} from '../../contexts'
import useMediaQuery from '../../hooks/useMediaQuery'
import { SessionReducer } from '../../utils/session'
import { computeResults } from '../../utils/results'
import { Session, SessionDispatch, Answers, Exam } from '../../types'
import useExam from '../../hooks/useExam'
import useAttempts from '../../hooks/useAttempts'
import useToast from '../../hooks/useToast'
import { translate } from '../../utils/translation'

const NavigationLayout = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
`

const ContainerStyles = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`

export interface NavigationProps {
  startingSession: Session
}

/**
 * Converts display-space answer indices back to original (pre-shuffle) indices before persisting to DB.
 * Falls back to the display index for unshuffled questions (e.g. revision) where originalIndex is absent.
 */
function toOriginalIndices(displayIndices: number[], questionChoices: Exam[number]['choices']): number[] {
  return displayIndices.map((displayIdx) => questionChoices[displayIdx]?.originalIndex ?? displayIdx)
}

const NavigationComponent: React.FC<NavigationProps> = ({ startingSession }) => {
  const { exam: examOrNull } = useExam()
  const exam = examOrNull!
  const [session, updateSession] = React.useReducer(SessionReducer, startingSession)
  const { saveAttempt, submitAttempt } = useAttempts()
  const { showToast } = useToast()

  const isMobile = useMediaQuery('(max-width: 48rem)')
  const [open, setOpen] = React.useState<boolean>(() => !isMobile)

  React.useEffect(() => {
    if (isMobile) {
      setOpen(false)
    } else {
      setOpen(true)
    }
  }, [isMobile])

  // Always-current refs used by event handlers and intervals to avoid stale closures.
  const sessionRef = React.useRef(session)
  sessionRef.current = session
  const examRef = React.useRef(exam)
  examRef.current = exam

  // Tracks the last successfully persisted answers and bookmarks so only diffs are sent on save.
  const lastSavedRef = React.useRef<{ answers: Answers; bookmarks: number[] }>({
    answers: startingSession.answers,
    bookmarks: startingSession.bookmarks,
  })

  // True while a save or submit request is in-flight. Prevents concurrent interval saves.
  const isSyncingRef = React.useRef(false)
  const [isSyncing, setIsSyncing] = React.useState(false)

  const doSave = React.useCallback(async (currentSession: Session) => {
    if (currentSession.examType === 'revision') return
    if (currentSession.examState !== 'in-progress') return
    if (currentSession.id === '') return
    if (isSyncingRef.current) return

    const { answers: lastAnswers, bookmarks: lastBookmarks } = lastSavedRef.current
    const currentExam = examRef.current
    const diffed = currentSession.answers.reduce<{ question_index: number; selected_choices: number[]; is_bookmarked: boolean }[]>(
      (acc, selected, i) => {
        const answerChanged =
          (selected?.length ?? 0) !== (lastAnswers[i]?.length ?? 0) ||
          (selected ?? []).some((v, j) => v !== (lastAnswers[i] ?? [])[j])
        const bookmarkChanged = currentSession.bookmarks.includes(i) !== lastBookmarks.includes(i)
        if (answerChanged || bookmarkChanged) {
          acc.push({
            question_index: i,
            selected_choices: toOriginalIndices(selected ?? [], currentExam[i].choices),
            is_bookmarked: currentSession.bookmarks.includes(i),
          })
        }
        return acc
      },
      []
    )

    isSyncingRef.current = true
    setIsSyncing(true)
    try {
      await saveAttempt(currentSession.id, {
        current_index: currentSession.index,
        time_remaining: currentSession.time,
        review_state: currentSession.reviewState,
        answers: diffed,
      })
      lastSavedRef.current = { answers: currentSession.answers, bookmarks: currentSession.bookmarks }
    } catch {
      showToast(translate('attempts.errors.server-save-failed'), 5000)
    } finally {
      isSyncingRef.current = false
      setIsSyncing(false)
    }
  }, [saveAttempt, showToast])

  // 180-second periodic save.
  React.useEffect(() => {
    const id = setInterval(() => {
      if (sessionRef.current.paused) return
      doSave(sessionRef.current)
    }, 180_000)
    return () => clearInterval(id)
  }, [doSave])

  // Save when the user pauses the exam.
  React.useEffect(() => {
    if (session.paused) doSave(sessionRef.current)
  }, [session.paused, doSave])

  // Save when the tab is hidden (user switches away or minimises).
  React.useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') doSave(sessionRef.current)
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [doSave])

  // Save before page unload. fetch with keepalive:true lets the browser complete the
  // request after the page is gone — cannot await here so we fire-and-forget.
  React.useEffect(() => {
    function handleBeforeUnload() {
      const s = sessionRef.current
      if (s.examType === 'revision' || s.examState !== 'in-progress' || s.id === '') return
      const currentExam = examRef.current
      const allAnswers = s.answers.map((selected, i) => ({
        question_index: i,
        selected_choices: toOriginalIndices(selected ?? [], currentExam[i].choices),
        is_bookmarked: s.bookmarks.includes(i),
      }))
      fetch(`/api/attempts/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_state: 'in-progress',
          current_index: s.index,
          time_remaining: s.time,
          review_state: s.reviewState,
          answers: allAnswers,
        }),
        keepalive: true,
      })
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  const sessionUpdate = React.useCallback<SessionDispatch>(
    (...actions) => {
      const actionArray = actions.map(([type, payload]) => ({ type, payload }))

      updateSession(actionArray)

      const nextSession = SessionReducer(session, actionArray)

      // Revision sessions have no backend attempt — skip all persistence.
      if (nextSession.examType === 'revision') return

      const isCompletion =
        session.examState === 'in-progress' &&
        nextSession.examState === 'completed'

      if (isCompletion && nextSession.id !== '') {
        const allAnswers = nextSession.answers.map((selected, i) => ({
          question_index: i,
          selected_choices: toOriginalIndices(selected ?? [], exam[i].choices),
          is_bookmarked: nextSession.bookmarks.includes(i),
        }))

        const { score, status } = computeResults(nextSession.answers, exam, nextSession.examType)

        async function doSubmit() {
          isSyncingRef.current = true
          setIsSyncing(true)
          try {
            await submitAttempt(nextSession.id, {
              current_index: nextSession.index,
              time_remaining: nextSession.time,
              review_state: nextSession.reviewState,
              answers: allAnswers,
              score,
              status,
            })
          } catch {
            showToast(translate("attempts.errors.server-submit-failed"), 5000)
          } finally {
            isSyncingRef.current = false
            setIsSyncing(false)
          }
        }
        doSubmit()
      }
    },
    [session, exam, submitAttempt, showToast]
  )

  const toggleOpen = React.useCallback(() => setOpen((prev) => !prev), [])

  const contextValues = {
    navigation: { index: session.index, update: sessionUpdate },
    timer: { time: session.time, maxTime: session.maxTime, paused: session.paused, update: sessionUpdate },
    exam: { examState: session.examState, reviewState: session.reviewState, update: sessionUpdate, categoryId: session.categoryId, examId: session.examId },
    data: { bookmarks: session.bookmarks, answers: session.answers, examType: session.examType, isSyncing, update: sessionUpdate }
  }

  return (
    <SessionNavigationContext.Provider value={contextValues.navigation}>
      <SessionTimerContext.Provider value={contextValues.timer}>
        <SessionExamContext.Provider value={contextValues.exam}>
          <SessionDataContext.Provider value={contextValues.data}>
            <>
              <NavigationLayout>
                <ContainerStyles id="middle-container">
                  <Drawer open={open} toggleOpen={toggleOpen} />

                  <Content open={open} />
                </ContainerStyles>

                <Footer open={open} questionCount={exam.length} />
              </NavigationLayout>

              <Confirms session={session} update={sessionUpdate} />
            </>
          </SessionDataContext.Provider>
        </SessionExamContext.Provider>
      </SessionTimerContext.Provider>
    </SessionNavigationContext.Provider>
  )
}

export default NavigationComponent
