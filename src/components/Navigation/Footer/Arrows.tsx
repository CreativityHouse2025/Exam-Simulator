import type { ThemedStyles } from '../../../types'
import type { MouseEventHandler } from 'react'

import React, { useCallback, useContext } from 'react'
import styled from 'styled-components'
import { lighten } from 'polished'
import { SkipPrevious } from '@styled-icons/material/SkipPrevious'
import { KeyboardArrowRight } from '@styled-icons/material/KeyboardArrowRight'
import { KeyboardArrowLeft } from '@styled-icons/material/KeyboardArrowLeft'
import { SkipNext } from '@styled-icons/material/SkipNext'
import { SessionActionTypes, SessionNavigationContext } from '../../../session'

const ArrowsStyles = styled.div<ThemedStyles>`
  justify-self: center;
  display: grid;
  grid-template-columns: repeat(4, 5rem);
`

const ArrowStyles = styled.div<ThemedStyles>`
  height: 5rem;
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
  const { index, update } = useContext(SessionNavigationContext)

  const onFirstQuestion = useCallback(() => {
    if (index === 0) return
    update!([SessionActionTypes.SET_INDEX, 0])
  }, [index, update])

  const onPrevQuestion = useCallback(() => {
    if (index === 0) return
    update!([SessionActionTypes.SET_INDEX, index - 1])
  }, [index, update])

  const onNextQuestion = useCallback(() => {
    if (index >= questionCount - 1) return
    update!([SessionActionTypes.SET_INDEX, index + 1])
  }, [index, questionCount, update])

  const onLastQuestion = useCallback(() => {
    if (index >= questionCount - 1) return
    update!([SessionActionTypes.SET_INDEX, questionCount - 1])
  }, [index, questionCount, update])

  const arrows: ArrowProps[] = React.useMemo(
    () => [
      { func: onFirstQuestion, Icon: SkipPrevious },
      { func: onPrevQuestion, Icon: KeyboardArrowLeft },
      { func: onNextQuestion, Icon: KeyboardArrowRight },
      { func: onLastQuestion, Icon: SkipNext }
    ],
    [onFirstQuestion, onPrevQuestion, onNextQuestion, onLastQuestion]
  )

  return (
    <ArrowsStyles id="arrows">
      {arrows.map(({ func, Icon }, i) => (
        <ArrowStyles key={i} onClick={func}>
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
  func: MouseEventHandler<HTMLDivElement>
  Icon: React.FC<{ size: number }>
}
