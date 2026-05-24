import type { ThemedStyles } from '../../../../types'
import React from 'react'
import styled from 'styled-components'
import { lighten } from 'polished'

const MenuItemStyles = styled.div<MenuItemStylesProps>`
  height: 5rem;
  display: grid;
  grid-template-columns: 5rem 1fr;
  align-items: center;
  justify-items: center;
  background: ${({ $selected, theme }) => ($selected ? theme.grey[2] : 'none')};
  color: ${({ theme }) => theme.black};
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => lighten(0.2, theme.primary)};
  }
`

const MenuItemTextStyles = styled.div`
  justify-self: flex-start;
  font: 1.5rem 'Open Sans';
  font-weight: 600;
  padding-left: 1rem;
`

interface MenuItemProps {
  icon: React.ReactNode
  label: string
  selected?: boolean
  onClick: () => void
}

const MenuItemComponent: React.FC<MenuItemProps> = ({ icon, label, selected = false, onClick }) => {
  return (
    <MenuItemStyles className="no-select" $selected={selected} onClick={onClick} data-test={label}>
      {icon}
      <MenuItemTextStyles>{label}</MenuItemTextStyles>
    </MenuItemStyles>
  )
}

export default MenuItemComponent

interface MenuItemStylesProps extends ThemedStyles {
  $selected: boolean
}
