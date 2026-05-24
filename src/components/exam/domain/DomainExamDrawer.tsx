import React from 'react'
import DrawerShell from '../shared/Drawer/DrawerShell'
import DomainExamMenu from './DomainExamMenu'

interface DomainExamDrawerProps {
  open: boolean
  toggleOpen: () => void
}

const DomainExamDrawer: React.FC<DomainExamDrawerProps> = ({ open, toggleOpen }) => (
  <DrawerShell open={open} toggleOpen={toggleOpen} menu={<DomainExamMenu open={open} />} />
)

export default DomainExamDrawer
