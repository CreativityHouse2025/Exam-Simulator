import React from 'react'
import { Menu, ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from '../../ui/utils'

const ControlComponent: React.FC<DrawerControlProps> = ({ open, toggleOpen }) => {
  const isLTR = document.documentElement.dir === 'ltr'
  const ChevronIcon = isLTR ? ChevronLeft : ChevronRight

  return (
    <div
      id="control"
      className={cn(
        "no-select w-full h-12.5 flex items-center border border-grey-100 border-l-0 border-t-0",
        "transition-all duration-300 cursor-pointer [&>svg]:text-black",
        open ? "justify-end" : "justify-center",
      )}
      onClick={toggleOpen}
    >
      {open ? <ChevronIcon className="mr-2.5" size={20} /> : <Menu size={20} />}
    </div>
  )
}

export default ControlComponent

export interface DrawerControlProps {
  open: boolean
  toggleOpen: () => void
}
