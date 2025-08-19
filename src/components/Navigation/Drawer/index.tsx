import type { ThemedStyles } from '../../../types'

import React from 'react'
import styled from 'styled-components'
import Control from './Control'
import Menu from './Menu'

const DrawerStyles = styled.div<DrawerStylesProps>`
  width: ${({ $open }) => ($open ? '24rem' : '5rem')};
  height: 100%;
  background: ${({ theme }) => theme.grey[0]};
  transition: 0.3s;
`

const DrawerComponent: React.FC<DrawerProps> = ({ open, toggleOpen }) => {
  return (
    <DrawerStyles id="drawer" $open={open} dir={document.documentElement.dir}>
      <Control open={open} toggleOpen={toggleOpen} />
      <Menu open={open} />
    </DrawerStyles>
  )
}

export default DrawerComponent

export interface DrawerProps {
  open: boolean
  toggleOpen: () => void
}

export interface DrawerStylesProps extends ThemedStyles {
  $open: boolean
}
