import type { ThemedStyles } from '../../../types'

import React from 'react'
import styled from 'styled-components'
import { Timer } from '@styled-icons/material/Timer'
import { formatTimer } from '../../../utils/format'
import { SessionTimerContext } from '../../../contexts'
import { SESSION_ACTION_TYPES } from '../../../constants'

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
  const { time, paused, update } = React.useContext(SessionTimerContext)
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Start new interval if timer is active
    if (!paused && time > 0) {
      intervalRef.current = setInterval(() => {
        update!([SESSION_ACTION_TYPES.SET_TIME, Math.max(0, time - 1)])
      }, 1000)
    }

    // Cleanup on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [paused, time, update])

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
