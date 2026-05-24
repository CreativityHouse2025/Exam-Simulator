import type { ThemedStyles } from '../../../types'

import React from 'react'
import styled from 'styled-components'
import { Timer } from '@styled-icons/material/Timer'
import { formatTimer } from '../../../utils/format'
import { useExamSessionCore } from '../../../hooks/examSession/useExamSessionCore'
import { useFullExamSession } from '../../../hooks/examSession/useFullExamSession'

const TimerStyles = styled.div<TimerStylesProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $warning, theme }) => ($warning ? theme.secondary : theme.black)};
  svg {
    color: inherit;
    margin: 0.5rem;
  }
`

const TextStyles = styled.div`
  font: 2rem 'Open Sans';
  font-weight: 700;
  padding: 0.5rem;
`

const TimerComponent: React.FC = () => {
  const { examState } = useExamSessionCore()
  const { time, paused, setTime } = useFullExamSession()
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  React.useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Start new interval if timer is active
    if (!paused && time > 0 && examState !== 'completed') {
      intervalRef.current = setInterval(() => {
        setTime(Math.max(0, time - 1))
      }, 1000)
    }

    // Cleanup on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [paused, time])

  // Handle timer expiration
  React.useEffect(() => {
    if (time <= 0 && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [time])

  return (
    <TimerStyles id="timer" $warning={time < 120}>
      <TextStyles data-test="Timer">{formatTimer(time)}</TextStyles>

      <Timer size={30} />
    </TimerStyles>
  )
}

export default TimerComponent

export interface TimerStylesProps extends ThemedStyles {
  $warning: boolean
}
