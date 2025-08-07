import type { ThemedStyles } from '../../../types'

import React, { useContext, useEffect } from 'react'
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
    margin-right: 0.5rem;
  }
`

const TextStyles = styled.div`
  font: 2rem 'Open Sans';
  font-weight: 700;
  padding: 0.5rem;
`

const TimerComponent: React.FC<TimerProps> = () => {
  const { time, paused, update } = useContext(SessionTimerContext)
  const [timer, setTimer] = React.useState<number>(time)

  useEffect(() => {
    let interval: number = 0

    update!([SessionActionTypes.SET_TIME, timer])

    if (paused) {
      clearInterval(interval)
      update!([SessionActionTypes.SET_TIME, timer])
    } else {
      interval = setInterval(() => {
        setTimer((prev: number) => {
          const newTime = prev - 1
          update!([SessionActionTypes.SET_TIME, newTime])

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
      update!([SessionActionTypes.SET_TIME, timer])
    }
  }, [paused])

  return (
    <TimerStyles id="timer" $warning={timer < 120}>
      <TextStyles data-test="Timer">{formatTimer(timer)}</TextStyles>

      <Timer size={30} />
    </TimerStyles>
  )
}

export default React.memo(TimerComponent)

export interface TimerProps {}

export interface TimerStylesProps extends ThemedStyles {
  $warning: boolean
}
