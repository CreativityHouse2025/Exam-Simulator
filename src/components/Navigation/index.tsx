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
import { RevisionExamOptions, Session, SessionDispatch, SessionActionTypes, Answers } from '../../types'
import useExam from '../../hooks/useExam'
import useAttempts from '../../hooks/useAttempts'
import useToast from '../../hooks/useToast'
import { translate } from '../../utils/translation'
import { SESSION_ACTION_TYPES } from '../../constants'

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
  onRevision: (options: RevisionExamOptions) => void
}

const NavigationComponent: React.FC<NavigationProps> = ({ startingSession, onRevision }) => {
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

  // Tracks the last successfully persisted answers and bookmarks so only diffs are sent on save.
  const lastSavedRef = React.useRef<{ answers: Answers; bookmarks: number[] }>({
    answers: startingSession.answers,
    bookmarks: startingSession.bookmarks,
  })

  // True while a save or submit request is in-flight. Prevents concurrent requests and blocks
  // navigation dispatches until the current request settles.
  const isSyncingRef = React.useRef(false)
  const [isSyncing, setIsSyncing] = React.useState(false)

  const sessionUpdate = React.useCallback<SessionDispatch>(
    (...actions) => {
      const actionArray = actions.map(([type, payload]) => ({ type, payload }))

      const isNavigation = actionArray.some((a) => a.type === (SESSION_ACTION_TYPES.SET_INDEX as SessionActionTypes))

      // Block navigation while a save is in-flight so requests stay one at a time.
      if (isNavigation && isSyncingRef.current) return

      updateSession(actionArray)

      const nextSession = SessionReducer(session, actionArray)

      const isCompletion =
        session.examState === 'in-progress' &&
        nextSession.examState === 'completed'

      if (isCompletion && nextSession.id !== '') {
        const allAnswers = nextSession.answers.map((selected, i) => ({
          question_index: i,
          selected_choices: selected ?? [],
          is_bookmarked: nextSession.bookmarks.includes(i),
        }))

        const { score, status } = computeResults(nextSession.answers, exam, nextSession.examType ?? 'domain')

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

      } else if (isNavigation && nextSession.examState === 'in-progress' && nextSession.id !== '') {
        const { answers: lastAnswers, bookmarks: lastBookmarks } = lastSavedRef.current
        const diffed = nextSession.answers.reduce<{ question_index: number; selected_choices: number[]; is_bookmarked: boolean }[]>(
          (acc, selected, i) => {
            const answerChanged =
              (selected?.length ?? 0) !== (lastAnswers[i]?.length ?? 0) ||
              (selected ?? []).some((v, j) => v !== (lastAnswers[i] ?? [])[j])
            const bookmarkChanged = nextSession.bookmarks.includes(i) !== lastBookmarks.includes(i)

            if (answerChanged || bookmarkChanged) {
              acc.push({
                question_index: i,
                selected_choices: selected ?? [],
                is_bookmarked: nextSession.bookmarks.includes(i),
              })
            }
            return acc
          },
          []
        )

        async function doSave() {
          isSyncingRef.current = true
          setIsSyncing(true)
          try {
            await saveAttempt(nextSession.id, {
              current_index: nextSession.index,
              time_remaining: nextSession.time,
              review_state: nextSession.reviewState,
              answers: diffed,
            })
            lastSavedRef.current = { answers: nextSession.answers, bookmarks: nextSession.bookmarks }
          } catch {
            showToast(translate("attempts.errors.server-save-failed"), 5000)
          } finally {
            isSyncingRef.current = false
            setIsSyncing(false)
          }
        }
        doSave()
      }
    },
    [session, exam, saveAttempt, submitAttempt, showToast]
  )

  const toggleOpen = React.useCallback(() => setOpen((prev) => !prev), [])

  const contextValues = {
    navigation: { index: session.index, update: sessionUpdate },
    timer: { time: session.time, maxTime: session.maxTime, paused: session.paused, update: sessionUpdate },
    exam: { examState: session.examState, reviewState: session.reviewState, update: sessionUpdate, categoryId: session.categoryId, examId: session.examId },
    data: { bookmarks: session.bookmarks, answers: session.answers, examType: session.examType, emailSent: session.emailSent, isSyncing, update: sessionUpdate }
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

                  <Content onRevision={onRevision} open={open} />
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
