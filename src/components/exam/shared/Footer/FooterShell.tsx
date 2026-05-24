import type { ThemedStyles } from '../../../../types'
import React from 'react'
import styled from 'styled-components'

const FooterStyles = styled.div<FooterStylesProps>`
  width: 100%;
  background: ${({ theme }) => theme.grey[0]};
  border-top: 1px solid ${({ theme }) => theme.grey[1]};
  max-height: 50px;
  display: grid;
  grid-template-columns: 0.5fr 0.5fr;
  transition: 0.3s;
`

interface FooterShellProps {
  open: boolean
  children: React.ReactNode
}

/** Footer shell with grid layout. Renders child nodes (arrows + optional timer). */
const FooterShell: React.FC<FooterShellProps> = ({ open, children }) => (
  <FooterStyles id="footer" $open={open}>
    {children}
  </FooterStyles>
)

export default FooterShell

interface FooterStylesProps extends ThemedStyles {
  $open: boolean
}
