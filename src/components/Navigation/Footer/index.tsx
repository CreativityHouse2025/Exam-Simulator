import type { ThemedStyles } from '../../../types'

import React from 'react'
import styled from 'styled-components'
import Timer from './Timer'
import Arrows from './Arrows'

const FooterStyles = styled.div<FooterStylesProps>`
  position: fixed;
  width: 100%;
  height: 5rem;
  bottom: 0;
  ${({ dir }) => (dir === 'rtl' ? 'right' : 'left')}: ${({ $open }) => ($open ? '24rem' : '5rem')};
  z-index: 2;
  transition: 0.3s;
  background: ${({ theme }) => theme.grey[0]};
  border-top: 1px solid ${({ theme }) => theme.grey[1]};
`

const InnerFooterStyles = styled.div<InnerFooterStylesProps>`
  width: ${({ $open }) => ($open ? 'calc(100% - 24rem)' : 'calc(100% - 5rem)')};
  display: grid;
  grid-template-columns: 0.5fr 0.5fr;
  align-items: center;
  transition: 0.3s;
`

const FooterComponent: React.FC<NavigationFooterProps> = ({ open, questionCount }) => {
  return (
    <FooterStyles id="footer" $open={open} dir={document.documentElement.dir}>
      <InnerFooterStyles id="inner-footer" $open={open}>
        <Arrows questionCount={questionCount} />

        <Timer />
      </InnerFooterStyles>
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
