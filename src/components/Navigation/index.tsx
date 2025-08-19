import type { Session, SessionDispatch } from '../../session'

import React from 'react'
import { styled } from 'styled-components'
import Drawer from './Drawer'
import Footer from './Footer'
import Content from '../Content'
import Confirms from './Confirms'
import { ExamContext } from '../../exam'
import {
  SessionDataContext,
  SessionExamContext,
  SessionNavigationContext,
  SessionReducer,
  SessionTimerContext
} from '../../session'

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

  const { answers, bookmarks, examState, index, maxTime, paused, reviewState, time, examID, update } = session

  return (
    <SessionNavigationContext.Provider value={{ index, update }}>
      <SessionTimerContext.Provider value={{ time, maxTime, paused, update }}>
        <SessionExamContext.Provider value={{ examState, reviewState, update }}>
          <SessionDataContext.Provider value={{ bookmarks, answers, examID, update }}>
            <>
              <ContainerStyles id="middle-container">
                <Drawer open={open} toggleOpen={toggleOpen} />

                <Content exam={exam} open={open} />
              </ContainerStyles>

              {exam && <Footer open={open} questionCount={exam.test.length} />}

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
