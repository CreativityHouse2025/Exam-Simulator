import type { GridTagTypes, ThemedStyles } from '../../../types'

import React from 'react'
import styled from 'styled-components'
import { lighten } from 'polished'
import { translate } from '../../../settings'

const LegendStyles = styled.div<ThemedStyles>`
  display: flex;
  align-items: center;
  margin-right: 1rem;
  .complete,
  .correct {
    background: ${({ theme }) => lighten(0.2, theme.primary)};
  }
  .bookmarked,
  .marked {
    background: ${({ theme }) => theme.quatro};
  }
  .incorrect {
    background: ${({ theme }) => lighten(0.2, theme.secondary)};
  }
  .incomplete {
    background: ${({ theme }) => theme.grey[2]};
  }
`

const ColoredSquareStyles = styled.div<ThemedStyles>`
  width: 1rem;
  height: 1rem;
  margin-right: 0.25rem;
  margin-left: 0.25rem;
  border: 0.5px solid ${({ theme }) => theme.grey[2]};
`

const NameStyles = styled.div<ThemedStyles>`
  font: 0.9rem 'Open Sans';
  font-weight: 600;
`

const LegendComponent: React.FC<LegendItemProps> = ({ type }) => {
  const legendName = React.useMemo(
    () => translate(`nav.grid.${type}`),
    [document.documentElement.lang, translate, type]
  )

  return (
    <LegendStyles>
      <ColoredSquareStyles className={type} />
      <NameStyles>{legendName}</NameStyles>
    </LegendStyles>
  )
}

export default LegendComponent

export interface LegendItemProps {
  type: GridTagTypes
}
