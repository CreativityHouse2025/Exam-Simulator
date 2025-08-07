import type { ThemedStyles } from '../../../types'

import React, { useContext } from 'react'
import styled from 'styled-components'
import { gridItemBackgroundColor } from '../../../utils/color'
import { SessionActionTypes, SessionContext } from '../../../session'

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

const CellComponent: React.FC<CellProps> = ({ index, bookmarks, answered }) => {
  const session = useContext(SessionContext)

  const onClickCell = React.useCallback(
    (question: number) => {
      if (question === session.index) return
      session.update!([SessionActionTypes.SET_INDEX, question], [SessionActionTypes.SET_REVIEW_STATE, 'question'])
    },
    [session]
  )

  return (
    <CellStyles
      data-test={`Cell ${index}`}
      $background={gridItemBackgroundColor(index, bookmarks, answered)}
      $selected={index === session.index}
      onClick={() => onClickCell(index)}
    >
      {index + 1}
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
