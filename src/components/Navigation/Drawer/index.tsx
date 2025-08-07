import type { ThemedStyles } from '../../../types'
import type { Session } from '../../../session'

import React from 'react'
import styled from 'styled-components'
import Control from './Control'
import Menu from './Menu'

const DrawerStyles = styled.div<ThemedStyles>`
  position: fixed;
  left: 0;
  z-index: 1;
  width: 24rem;
  height: 100%;
  top: 5rem;
  transition: 0.3s;
  background: ${({ theme }) => theme.grey[0]};
`

const DrawerComponent: React.FC<DrawerProps> = ({ open, toggleOpen, session }) => {
  return (
    <DrawerStyles id="drawer">
      <Control open={open} toggleOpen={toggleOpen} />
      <Menu open={open} session={session} />
    </DrawerStyles>
  )
}

export default React.memo(DrawerComponent)

export interface DrawerProps {
  open: boolean
  toggleOpen: () => void
  session: Session
}
