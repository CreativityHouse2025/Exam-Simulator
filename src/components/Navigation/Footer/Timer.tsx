import type { ThemedStyles } from '../../../types'

import React from 'react'
import styled from 'styled-components'
import { Timer } from '@styled-icons/material/Timer'
import { formatTimer } from '../../../utils/format'
import { useTimer } from '../../../hooks/useTimer'

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
  const { time } = useTimer()

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
