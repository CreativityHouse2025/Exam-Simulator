import type { ThemedStyles } from '../../../types'

import React from 'react'
import styled from 'styled-components'
import { gridItemBackgroundColor } from '../../../utils/color'
import { SessionExamContext, SessionNavigationContext } from '../../../contexts'
import { SESSION_ACTION_TYPES } from '../../../constants'

const CellStyles = styled.div<CellStylesProps>`
  width: 4.5rem;
  height: 4.5rem;
  display: grid;
  justify-items: center;
  align-items: center;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  background: ${({ $background }) => $background};
  color: #333;
  border: 1px solid ${({ theme }) => theme.grey[3]};
  font: 1rem 'Open Sans';
  font-weight: 700;
  outline: 3px solid ${({ $selected, theme }) => ($selected ? theme.grey[10] : 'transparent')};
  cursor: pointer;
`

const CellComponent: React.FC<CellProps> = ({ index: myIndex, bookmarks, answered }) => {
  const { index, update } = React.useContext(SessionNavigationContext)
  const { examState, reviewState } = React.useContext(SessionExamContext)

  const isSelected = React.useCallback(() => {
    return myIndex === index && (examState !== 'completed' || reviewState === 'question')
  }, [myIndex, index, examState, reviewState])

  const onClickCell = React.useCallback(
    (newIndex: number) => {
      if (isSelected()) return
      update!([SESSION_ACTION_TYPES.SET_INDEX, newIndex], [SESSION_ACTION_TYPES.SET_REVIEW_STATE, 'question'])
    },
    [isSelected, update]
  )

  return (
    <CellStyles
      data-test={`Cell ${myIndex}`}
      $background={gridItemBackgroundColor(myIndex, bookmarks, answered)}
      $selected={isSelected()}
      onClick={() => onClickCell(myIndex)}
    >
      {myIndex + 1}
    </CellStyles>
  )
}

export default CellComponent

export interface CellProps {
  index: number
  bookmarks: number[]
  answered: number[]
}

export interface CellStylesProps extends ThemedStyles {
  $background: string
  $selected: boolean
}
