import type { ThemedStyles } from '../../types'

import React from 'react'
import styled from 'styled-components'
import { translate } from '../../settings'

export const RowStyles = styled.div<SummaryStylesProps>`
  display: grid;
  grid-template-columns: 15rem 15rem;
  justify-items: center;
  align-items: center;
  .status {
    color: ${({ $status, theme }) => ($status ? theme.correct : theme.incorrect)};
  }
`

export const RowKeyStyles = styled.div<ThemedStyles>`
  font: 2rem 'Open Sans';
  font-weight: 700;
  color: ${({ theme }) => theme.grey[10]};
`

export const RowValueStyles = styled.div<ThemedStyles>`
  font: 2rem 'Open Sans';
  font-weight: 700;
  color: ${({ theme }) => theme.black};
`

const SummaryRowComponent: React.FC<SummaryRowProps> = ({ type, value, status, isStatus }) => {
  const className = isStatus ? 'status' : ''

  const _type = React.useMemo(
    () => translate(`content.review.summary.${type}`),
    [document.documentElement.lang, translate, type]
  )

  return (
    <RowStyles data-test={`summary-row-${type}`} $status={status}>
      <RowKeyStyles>{_type}</RowKeyStyles>
      <RowValueStyles className={className}>{value}</RowValueStyles>
    </RowStyles>
  )
}

export default SummaryRowComponent

export interface SummaryRowProps {
  type: string
  value: string
  status: boolean
  isStatus?: boolean
}

export interface SummaryStylesProps extends ThemedStyles {
  $status: boolean
}
