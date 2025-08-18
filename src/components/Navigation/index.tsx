import type { Session, SessionDispatch } from '../../session'

import React, { useContext, useEffect, useReducer, useState } from 'react'
import Drawer from './Drawer'
import Footer from './Footer'
import Modal, { type ModalProps } from '../Modal'
import Content from '../Content'
import { Main } from '../../styles/Main'
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
  const exam = useContext(ExamContext)
  const [session, updateSession] = useReducer(SessionReducer, startingSession)
  const [open, setOpen] = useState<boolean>(true)

  const sessionUpdate = ((...actions) => {
    const arr = actions.map(([type, payload]) => ({ type, payload }))

    updateSession(arr)
    onSessionUpdate(SessionReducer(session, arr))
  }) as SessionDispatch

  session.update = sessionUpdate

  useEffect(() => {
    session.update = sessionUpdate
  }, [startingSession])

  const toggleOpen = React.useCallback(() => setOpen(!open), [open])

  if (!exam) return null

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

  return (
    <SessionNavigationContext.Provider value={{ index: session.index, update: session.update }}>
      <SessionTimerContext.Provider
        value={{
          time: session.time,
          maxTime: session.maxTime,
          paused: session.paused,
          update: session.update
        }}
      >
        <SessionExamContext.Provider
          value={{
            examState: session.examState,
            reviewState: session.reviewState,
            update: session.update
          }}
        >
          <SessionDataContext.Provider
            value={{
              bookmarks: session.bookmarks,
              answers: session.answers,
              examID: session.examID,
              update: session.update
            }}
          >
            <div id="navigation">
              <Drawer open={open} toggleOpen={toggleOpen} />

              <Main $open={open}>
                <Content exam={exam} session={session} />
              </Main>

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
