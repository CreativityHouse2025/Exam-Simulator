import type { ThemedStyles } from '../../../../types'

import React from 'react'
import styled from 'styled-components'
import { gridItemBackgroundColor } from '../../../../utils/color'
import { useExamSessionCore } from '../../../../hooks/examSession/useExamSessionCore'

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
  const { index, examState, reviewState, setIndex } = useExamSessionCore()

  const isSelected = myIndex === index && (examState !== 'completed' || reviewState === 'question')

  const onClickCell = React.useCallback(
    (newIndex: number) => {
      if (isSelected) return
      setIndex(newIndex)
    },
    [isSelected, setIndex]
  )

  return (
    <CellStyles
      data-test={`Cell ${myIndex}`}
      className="no-select"
      $background={gridItemBackgroundColor(myIndex, bookmarks, answered)}
      $selected={isSelected}
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
