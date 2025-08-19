import type { ThemedStyles } from '../../../types'

import React from 'react'
import styled from 'styled-components'
import Legend from './Legend'
import { SessionExamContext } from '../../../session'

const LegendStyles = styled.div<ThemedStyles>`
  height: 3rem;
  display: flex;
  justify-content: center;
  align-items: center;
  border-top: 1px solid ${({ theme }) => theme.grey[2]};
  border-bottom: 1px solid ${({ theme }) => theme.grey[2]};
`

const LegendsComponent: React.FC = () => {
  const { examState } = React.useContext(SessionExamContext)

  const inProgress = examState === 'in-progress'
  const completed = examState === 'completed'

  return (
    <LegendStyles dir={document.documentElement.dir}>
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
