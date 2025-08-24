import type { ThemedStyles } from '../../../types'

import React from 'react'
import styled from 'styled-components'
import { Timer } from '@styled-icons/material/Timer'
import { formatTimer } from '../../../utils/format'
import { SessionActionTypes, SessionTimerContext } from '../../../session'

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
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (!paused && time > 0) {
      intervalRef.current = setInterval(() => {
        update!([SessionActionTypes.SET_TIME, Math.max(0, time - 1)])
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [paused, update]) // Remove 'timer' from dependencies to prevent restart on every tick

  // Update context when timer reaches zero
  React.useEffect(() => {
    if (time <= 0 && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      update!([SessionActionTypes.SET_TIME, 0])
    }
  }, [time, update])

  return (
    <TimerStyles id="timer" $warning={time < 120}>
      <TextStyles data-test="Timer">{formatTimer(time)}</TextStyles>

      <Timer size={30} />
    </TimerStyles>
  )
}

export default React.memo(TimerComponent)

export interface TimerStylesProps extends ThemedStyles {
  $warning: boolean
}
