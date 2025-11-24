import React from 'react'
import styled from 'styled-components'
import Drawer from './Drawer'
import Footer from './Footer'
import Content from '../Content'
import Confirms from './Confirms'
import { ExamContext } from '../../contexts'
import { useSessionState } from '../../providers/SessionProvider'

const ContainerStyles = styled.div`
  display: flex;
  height: calc(100vh - 10rem);
  padding-top: 6rem;
  padding-bottom: 4rem;
  overflow: hidden;
`

const NavigationComponent: React.FC = () => {
  const exam = React.useContext(ExamContext)
  const session = useSessionState()
  const [open, setOpen] = React.useState<boolean>(true)

  if (!exam) return null

  const contextValues = {
    navigation: { index: session.index, update: sessionUpdate },
    timer: { time: session.time, maxTime: session.maxTime, paused: session.paused, update: sessionUpdate },
    exam: { examState: session.examState, reviewState: session.reviewState, update: sessionUpdate },
    data: { bookmarks: session.bookmarks, answers: session.answers, examID: session.examID, update: sessionUpdate }
  }

  return (
    <>
      <ContainerStyles id="middle-container">
        <Drawer open={open} toggleOpen={toggleOpen} />

        <Content open={open} />
      </ContainerStyles>

              <Footer open={open} questionCount={exam.length} />

      <Confirms session={session} />
    </>
  )
}

export default NavigationComponent
