import React from 'react'
import { ModalOverlay } from '../../SharedStyles'
import { BREAK_CARD_CLASSES } from './BreakModalsStyles'
import { cn } from '../../ui/utils'

const BTN_BASE = "flex items-center justify-center font-bold text-base uppercase py-2 px-2.5 rounded-xs transition-colors duration-300 cursor-pointer"

interface Props {
  dir: string
  title: string
  message: string
  primaryLabel: string
  secondaryLabel: string
  onTake: () => void
  onSkip: () => void
}

/** Break offer presented at Q61 and Q121 checkpoints. Matches the app's Modal.tsx style. Clicking the backdrop skips the break. */
export default function BreakOfferModal({ title, message, primaryLabel, secondaryLabel, onTake, onSkip }: Props) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onSkip()
  }

  return (
    <ModalOverlay onClick={handleBackdropClick}>
      <div className={BREAK_CARD_CLASSES}>
        <div className="h-12.5 flex justify-center items-center text-xl font-semibold bg-primary">{title}</div>
        <div className="flex items-center justify-center text-2xl font-semibold py-6 px-5 text-center font-sans">{message}</div>
        <div className="flex items-center justify-center gap-2.5 pt-0 px-3 pb-3 border-t border-grey-200 bg-grey-50 min-h-12.5">
          <button className={cn(BTN_BASE, "text-white bg-secondary hover:bg-secondary-hover")} onClick={onTake}>
            {primaryLabel}
          </button>
          <button className={cn(BTN_BASE, "text-grey-950 bg-grey-200 hover:bg-grey-300")} onClick={onSkip}>
            {secondaryLabel}
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}
