import type { ThemedStyles } from '../../../types'

import React, { useContext } from 'react'
import styled from 'styled-components'
import Legend from './Legend'
import { LangContext } from '../../../settings'
import { SessionContext } from '../../../session'

const LegendStyles = styled.div<ThemedStyles>`
  height: 3rem;
  display: flex;
  justify-content: center;
  align-items: center;
  border-top: 1px solid ${({ theme }) => theme.grey[2]};
  border-bottom: 1px solid ${({ theme }) => theme.grey[2]};
`

const LegendsComponent: React.FC = () => {
  const session = useContext(SessionContext)
  const lang = useContext(LangContext)

  const inProgress = session.examState === 'in-progress'
  const completed = session.examState === 'completed'

  return (
    <LegendStyles dir={lang.dir}>
      <Legend type="marked" />
      <Legend type="incomplete" />
      {inProgress && <Legend type="complete" />}
      {completed && (
        <>
          <Legend type="incorrect" />
          <Legend type="correct" />
        </>
      )}
    </LegendStyles>
  )
}

export default LegendsComponent
