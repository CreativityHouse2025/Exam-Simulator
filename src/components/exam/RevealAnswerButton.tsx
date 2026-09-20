import React from 'react'
import { Eye, EyeOff } from 'lucide-react'

const RevealAnswerButton: React.FC<RevealAnswerButtonProps> = ({ isAnswerRevealed, onToggleAnswerReveal }) => {
  const IconComponent = isAnswerRevealed ? EyeOff : Eye

  return (
    <div
      className={`no-select transition-colors duration-300 cursor-pointer -me-1.5 hover:text-tertiary ${isAnswerRevealed ? "text-tertiary" : "text-grey-950"}`}
    >
      <IconComponent size={35} onClick={onToggleAnswerReveal} />
    </div>
  )
}

export default RevealAnswerButton

export interface RevealAnswerButtonProps {
  isAnswerRevealed: boolean
  onToggleAnswerReveal: () => void
}
