import type { ThemedStyles } from '../../types'

import React from 'react'
import styled from 'styled-components'
import { translate } from '../../utils/translation'
import useSettings from '../../hooks/useSettings'

export const RowStyles = styled.div<SummaryStylesProps>`
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 1rem;
  justify-items: center;
  align-items: start;

  .status {
    color: ${({ $status, theme }) =>
    $status === false ? theme.incorrect : theme.correct};
  }
`

export const RowKeyStyles = styled.div<ThemedStyles>`
  font: 2rem 'Open Sans';
  text-align: center;
  font-weight: 700;
  color: ${({ theme }) => theme.grey[10]};
`

export const RowValueStyles = styled.div<ThemedStyles>`
  font: 2rem 'Open Sans';
  text-align: center;
  font-weight: 700;
  color: ${({ theme }) => theme.black};
`

const SummaryRowComponent: React.FC<SummaryRowProps> = ({ type, value, status, isStatus }) => {
  const { settings } = useSettings()
  const langCode = settings.language

  const typeLabel = React.useMemo(
    () => translate(`content.summary.${type}`),
    [langCode, type]
  )

  return (
    <RowStyles data-test={`summary-row-${type}`} $status={status}>
      <RowKeyStyles>{typeLabel}</RowKeyStyles>
      <RowValueStyles className={isStatus ? 'status' : ''}>
        {value}
      </RowValueStyles>
    </RowStyles>
  )
}

export default SummaryRowComponent

export interface SummaryRowProps {
  type: string
  value: string
  status?: boolean
  isStatus?: boolean
}

export interface SummaryStylesProps extends ThemedStyles {
  $status?: boolean
}
