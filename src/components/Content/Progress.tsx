import type { Exam, ThemedStyles } from '../../types'
import type { Session } from '../../session'

import React from 'react'
import styled from 'styled-components'
import { calculateProgressStats } from '../../utils/progress'

const ProgressContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
`

const ProgressBar = styled.div<ThemedStyles>`
  width: 100%;
  height: 0.5rem;
  background: ${({ theme }) => theme.secondary};
  border-radius: 0.25rem;
  overflow: hidden;
`

const ProgressFill = styled.div<ProgressFillProps>`
  height: 100%;
  width: ${({ $percentage }) => $percentage}%;
  background: ${({ theme }) => theme.primary};
  border-radius: 0.25rem;
  transition: width 0.3s ease;
`

const StatNumber = styled.span<ThemedStyles>`
  font-size: 2rem;
  font-weight: bold;
  color: ${({ theme }) => theme.primary};
`

const ProgressComponent: React.FC<ProgressProps> = ({ exam, session }) => {
  const { answeredCount, percentage } = React.useMemo(() => {
    return calculateProgressStats(exam.test, session.answers)
  }, [exam, session])

  return (
    <ProgressContainer id="progress">
      <StatNumber>{`✍️ ${answeredCount} (${percentage}%)`}</StatNumber>

      <ProgressBar id="progress-bar">
        <ProgressFill id="progress-fill" $percentage={percentage} />
      </ProgressBar>
    </ProgressContainer>
  )
}

export default ProgressComponent

export interface ProgressProps {
  exam: Exam
  session: Session
}

export interface ProgressFillProps extends ThemedStyles {
  $percentage: number
}
