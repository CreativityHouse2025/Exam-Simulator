import React from 'react'
import DrawerShell from '../shared/Drawer/DrawerShell'
import FullExamMenu from './FullExamMenu'

interface FullExamDrawerProps {
  open: boolean
  toggleOpen: () => void
}

const FullExamDrawer: React.FC<FullExamDrawerProps> = ({ open, toggleOpen }) => (
  <DrawerShell open={open} toggleOpen={toggleOpen} menu={<FullExamMenu open={open} />} />
)

export default FullExamDrawer
