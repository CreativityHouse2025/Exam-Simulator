import type { Session, SessionDispatch } from '../../session'
import type { ModalProps } from '../Modal'

import React from 'react'
import Drawer from './Drawer'
import Footer from './Footer'
import Modal from '../Modal'
import Content from '../Content'
import { ExamContext } from '../../exam'
import {
  SessionActionTypes,
  SessionDataContext,
  SessionExamContext,
  SessionNavigationContext,
  SessionReducer,
  SessionTimerContext
} from '../../session'
import { timerHaveExpired, timerIsPaused } from '../../utils/state'
import { translate } from '../../settings'

const NavigationComponent: React.FC<NavigationProps> = ({ startingSession, onSessionUpdate }) => {
  const exam = React.useContext(ExamContext)
  const [session, updateSession] = React.useReducer(SessionReducer, startingSession)
  const [open, setOpen] = React.useState<boolean>(true)

  const sessionUpdate = ((...actions) => {
    const arr = actions.map(([type, payload]) => ({ type, payload }))

    updateSession(arr)
    onSessionUpdate(SessionReducer(session, arr))
  }) as SessionDispatch

  session.update = sessionUpdate

  React.useEffect(() => {
    session.update = sessionUpdate
  }, [startingSession])

  if (!exam) return null

  const toggleOpen = React.useCallback(() => setOpen(!open), [open])

  const confirms: Omit<MyModalProps, 'title' | 'message' | 'buttons'>[] = React.useMemo(
    () => [
      {
        id: 'expired',
        show: timerHaveExpired(session),
        onConfirm: () => {
          session.update!(
            [SessionActionTypes.SET_TIME, 0],
            [SessionActionTypes.SET_TIMER_PAUSED, true],
            [SessionActionTypes.SET_EXAM_STATE, 'completed']
          )
        }
      },
      {
        id: 'pause',
        show: timerIsPaused(session),
        onConfirm: () => session.update!([SessionActionTypes.SET_TIMER_PAUSED, false])
      }
    ],
    [session]
  )

  const newConfirms: MyModalProps[] = React.useMemo(
    () =>
      confirms.map((c) => {
        const [title, message, button0, button1] = [
          translate(`confirm.${c.id}.title`),
          translate(`confirm.${c.id}.message`),
          translate(`confirm.${c.id}.button0`),
          translate(`confirm.${c.id}.button1`)
        ]

        return {
          ...c,
          title,
          message,
          buttons: [button0, button1].filter((str) => !str.startsWith('confirm.')) as [string, string]
        }
      }),
    [confirms, document.documentElement.lang, translate]
  )

  const { answers, bookmarks, examState, index, maxTime, paused, reviewState, time, examID, update } = session

  return (
    <SessionNavigationContext.Provider value={{ index, update }}>
      <SessionTimerContext.Provider value={{ time, maxTime, paused, update }}>
        <SessionExamContext.Provider value={{ examState, reviewState, update }}>
          <SessionDataContext.Provider value={{ bookmarks, answers, examID, update }}>
            <div id="navigation">
              <Drawer open={open} toggleOpen={toggleOpen} />

              <Content exam={exam} open={open} />

              {exam && <Footer open={open} questionCount={exam.test.length} />}

              {newConfirms
                .filter((c) => c.show)
                .map((c, i) => (
                  <Modal
                    key={`${c.id}-${i}`}
                    title={c.title}
                    message={c.message}
                    buttons={c.buttons}
                    onConfirm={c.onConfirm}
                    onClose={c.onClose}
                  />
                ))}
            </div>
          </SessionDataContext.Provider>
        </SessionExamContext.Provider>
      </SessionTimerContext.Provider>
    </SessionNavigationContext.Provider>
  )
}

export default NavigationComponent

export interface NavigationProps {
  startingSession: Session
  onSessionUpdate: (session: Session) => void
}

export interface MyModalProps extends ModalProps {
  id: string
  show: boolean
}
