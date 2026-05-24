import React from 'react'
import DrawerShell from '../shared/Drawer/DrawerShell'
import RevisionMenu from './RevisionMenu'

interface RevisionDrawerProps {
  open: boolean
  toggleOpen: () => void
}

const RevisionDrawer: React.FC<RevisionDrawerProps> = ({ open, toggleOpen }) => (
  <DrawerShell open={open} toggleOpen={toggleOpen} menu={<RevisionMenu open={open} />} />
)

export default RevisionDrawer
