import type { ThemedStyles } from '../../../types'

import React, { useEffect } from 'react'
import styled from 'styled-components'
import { Timer } from '@styled-icons/material/Timer'
import { formatTimer } from '../../../utils/format'
import { Session, SessionActionTypes } from '../../../session'

const TimerStyles = styled.div<TimerStylesProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $warning, theme }) => ($warning ? theme.secondary : theme.black)};
  svg {
    color: inherit;
    margin-right: 0.5rem;
  }
  & > :first-child {
    font: 2rem 'Open Sans';
    font-weight: 700;
  }
`

const TimerComponent: React.FC<TimerProps> = ({ session }) => {
  const [timer, setTimer] = React.useState<number>(session.time)

  useEffect(() => {
    let interval: number = 0

    session.update!([SessionActionTypes.SET_TIME, timer])

    if (session.paused) {
      clearInterval(interval)
      session.update!([SessionActionTypes.SET_TIME, timer])
    } else {
      interval = setInterval(() => {
        setTimer((prev: number) => {
          const newTime = prev - 1
          session.update!([SessionActionTypes.SET_TIME, newTime])

          if (newTime <= 0) {
            clearInterval(interval)
            return 0
          }

          return newTime
        })
      }, 1000)
    }

    return () => {
      clearInterval(interval)
      session.update!([SessionActionTypes.SET_TIME, timer])
    }
  }, [session.paused])

  return (
    <TimerStyles id="timer" $warning={timer < 120}>
      <div data-test="Timer">{formatTimer(timer)}</div>

      <Timer size={30} />
    </TimerStyles>
  )
}

export default TimerComponent

export interface TimerProps {
  session: Session
}

export interface TimerStylesProps extends ThemedStyles {
  $warning: boolean
}
