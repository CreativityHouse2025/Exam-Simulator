import React from 'react'
import styled from 'styled-components'
import Drawer from './Drawer'
import Footer from './Footer'
import Content from '../Content'
import Confirms from './Confirms'
import {
  ExamContext,
  SessionDataContext,
  SessionExamContext,
  SessionNavigationContext,
  SessionTimerContext
} from '../../contexts'
import { SessionReducer } from '../../utils/session'
import { Session, SessionDispatch } from '../../types'

const ContainerStyles = styled.div`
  display: flex;
  height: calc(100vh - 10rem);
  padding-top: 6rem;
  padding-bottom: 4rem;
  overflow: hidden;
`

const NavigationComponent: React.FC<NavigationProps> = ({ startingSession, onSessionUpdate }) => {
  const exam = React.useContext(ExamContext)
  const [session, updateSession] = React.useReducer(SessionReducer, startingSession)
  const [open, setOpen] = React.useState<boolean>(true)

  const sessionUpdate = React.useCallback<SessionDispatch>(
    (...actions) => {
      const actionArray = actions.map(([type, payload]) => ({ type, payload }))
      updateSession(actionArray)
      onSessionUpdate(SessionReducer(session, actionArray))
    },
    [session, onSessionUpdate]
  )

  React.useEffect(() => {
    session.update = sessionUpdate
  }, [sessionUpdate])

  const toggleOpen = React.useCallback(() => setOpen((prev) => !prev), [])

  const contextValues = {
    navigation: { index: session.index, update: sessionUpdate },
    timer: { time: session.time, maxTime: session.maxTime, paused: session.paused, update: sessionUpdate },
    exam: { examState: session.examState, reviewState: session.reviewState, update: sessionUpdate },
    data: { bookmarks: session.bookmarks, answers: session.answers, examType: session.examType, update: sessionUpdate }
  }

  return (
    <SessionNavigationContext.Provider value={contextValues.navigation}>
      <SessionTimerContext.Provider value={contextValues.timer}>
        <SessionExamContext.Provider value={contextValues.exam}>
          <SessionDataContext.Provider value={contextValues.data}>
            <>
              <ContainerStyles id="middle-container">
                <Drawer open={open} toggleOpen={toggleOpen} />

                <Content open={open} />
              </ContainerStyles>

              <Footer open={open} questionCount={exam.length} />

              <Confirms session={session} />
            </>
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
