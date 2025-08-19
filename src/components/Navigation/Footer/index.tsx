import type { ThemedStyles } from '../../../types'

import React from 'react'
import styled from 'styled-components'
import Timer from './Timer'
import Arrows from './Arrows'

const FooterStyles = styled.div<FooterStylesProps>`
  position: fixed;
  width: 100%;
  bottom: 0;
  background: ${({ theme }) => theme.grey[0]};
  border-top: 1px solid ${({ theme }) => theme.grey[1]};
  display: grid;
  grid-template-columns: 0.5fr 0.5fr;
  transition: 0.3s;
`

const FooterComponent: React.FC<NavigationFooterProps> = ({ open, questionCount }) => {
  return (
    <FooterStyles id="footer" $open={open} dir={document.documentElement.dir}>
      <Arrows questionCount={questionCount} />

      <Timer />
    </FooterStyles>
  )
}

export default FooterComponent

export interface NavigationFooterProps {
  open: boolean
  questionCount: number
}

export interface FooterStylesProps extends ThemedStyles {
  $open: boolean
}

export interface InnerFooterStylesProps extends ThemedStyles {
  $open: boolean
}
