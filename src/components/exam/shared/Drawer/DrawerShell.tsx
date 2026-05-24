import type { ThemedStyles } from '../../../../types'
import React from 'react'
import styled from 'styled-components'
import Control from './Control'

const DrawerStyles = styled.div<DrawerStylesProps>`
  width: ${({ $open }) => ($open ? '30rem' : '5rem')};
  height: auto;
  overflow: hidden;
  overflow-y: auto;
  background: ${({ theme }) => theme.grey[0]};
  transition: 0.3s;
`

interface DrawerShellProps {
  open: boolean
  toggleOpen: () => void
  menu: React.ReactNode
}

/** Drawer container with animated width — renders Control (toggle) and the menu content. */
const DrawerShell: React.FC<DrawerShellProps> = ({ open, toggleOpen, menu }) => {
  return (
    <DrawerStyles id="drawer" $open={open}>
      <Control open={open} toggleOpen={toggleOpen} />
      {menu}
    </DrawerStyles>
  )
}

export default DrawerShell

interface DrawerStylesProps extends ThemedStyles {
  $open: boolean
}
