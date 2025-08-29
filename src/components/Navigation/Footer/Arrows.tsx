import type { ThemedStyles } from '../../../types'
import type { MouseEventHandler } from 'react'

import React from 'react'
import styled from 'styled-components'
import { lighten } from 'polished'
import { SkipPrevious } from '@styled-icons/material/SkipPrevious'
import { KeyboardArrowRight } from '@styled-icons/material/KeyboardArrowRight'
import { KeyboardArrowLeft } from '@styled-icons/material/KeyboardArrowLeft'
import { SkipNext } from '@styled-icons/material/SkipNext'
import { SessionNavigationContext } from '../../../contexts'
import { SESSION_ACTION_TYPES } from '../../../constants'

const ArrowsStyles = styled.div<ThemedStyles>`
  justify-self: center;
  display: grid;
  grid-template-columns: repeat(4, 5rem);
`

const ArrowStyles = styled.div<ThemedStyles>`
  display: grid;
  justify-items: center;
  align-items: center;
  cursor: pointer;
  color: ${({ theme }) => theme.black};
  &:hover {
    background: ${({ theme }) => lighten(0.2, theme.primary)};
  }
`

const ArrowsComponent: React.FC<ArrowsProps> = ({ questionCount }) => {
  const { index, update } = React.useContext(SessionNavigationContext)
  const isLTR = document.documentElement.dir === 'ltr'

  const navigate = React.useCallback(
    (target: number) => {
      if (target >= 0 && target < questionCount && target !== index) {
        update!([SESSION_ACTION_TYPES.SET_INDEX, target])
      }
    },
    [index, questionCount, update]
  )

  const arrows: ArrowProps[] = React.useMemo(
    () => [
      {
        onClick: () => navigate(0),
        Icon: isLTR ? SkipPrevious : SkipNext,
        disabled: index === 0
      },
      {
        onClick: () => navigate(index - 1),
        Icon: isLTR ? KeyboardArrowLeft : KeyboardArrowRight,
        disabled: index === 0
      },
      {
        onClick: () => navigate(index + 1),
        Icon: isLTR ? KeyboardArrowRight : KeyboardArrowLeft,
        disabled: index >= questionCount - 1
      },
      {
        onClick: () => navigate(questionCount - 1),
        Icon: isLTR ? SkipNext : SkipPrevious,
        disabled: index >= questionCount - 1
      }
    ],
    [index, questionCount, navigate, isLTR]
  )

  return (
    <ArrowsStyles id="arrows">
      {arrows.map(({ onClick, Icon, disabled }, i) => (
        <ArrowStyles
          key={i}
          className="no-select"
          onClick={disabled ? undefined : onClick}
          style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
          <Icon size={30} />
        </ArrowStyles>
      ))}
    </ArrowsStyles>
  )
}

export default ArrowsComponent

export interface ArrowsProps {
  questionCount: number
}

export interface ArrowProps {
  onClick: MouseEventHandler<HTMLDivElement>
  Icon: React.FC<{ size: number }>
  disabled: boolean
}
