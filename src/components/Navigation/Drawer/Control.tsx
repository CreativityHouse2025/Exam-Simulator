import type { ThemedStyles } from '../../../types'

import React from 'react'
import styled from 'styled-components'
import { Menu } from '@styled-icons/material/Menu'
import { ChevronRight } from '@styled-icons/material/ChevronRight'
import { ChevronLeft } from '@styled-icons/material/ChevronLeft'

const Control = styled.div<ControlStylesProps>`
  width: ${({ $open }) => ($open ? '24em' : '5rem')};
  height: 5rem;
  display: flex;
  justify-content: ${({ $open }) => ($open ? 'flex-end' : 'center')};
  align-items: center;
  border: 1px solid ${({ theme }) => theme.grey[1]};
  border-left: 0;
  border-top: 0;
  transition: 0.3s;
  cursor: pointer;
  svg {
    color: ${({ theme }) => theme.black};
  }
  .chevron {
    margin-right: 1rem;
  }
`

const ControlComponent: React.FC<DrawerControlProps> = ({ open, toggleOpen }) => {
  const chevron = React.createElement(document.documentElement.dir === 'rtl' ? ChevronRight : ChevronLeft, {
    className: 'chevron',
    size: 20
  })

  return (
    <Control id="control" $open={open} onClick={toggleOpen}>
      {open ? chevron : <Menu size={20} />}
    </Control>
  )
}

export default ControlComponent

export interface DrawerControlProps {
  open: boolean
  toggleOpen: () => void
}

export interface ControlStylesProps extends ThemedStyles {
  $open: boolean
}
