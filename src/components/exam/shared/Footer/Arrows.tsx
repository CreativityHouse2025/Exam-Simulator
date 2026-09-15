import type { MouseEventHandler } from 'react'

import React from 'react'
import { SkipBack, SkipForward, ChevronRight, ChevronLeft } from 'lucide-react'
import { useExamSessionCore } from '../../../../hooks/examSession/useExamSessionCore'

const ArrowsComponent: React.FC<ArrowsProps> = ({ questionCount }) => {
  const { index, setIndex } = useExamSessionCore()
  const isLTR = document.documentElement.dir === 'ltr'

  const navigate = React.useCallback(
    (target: number) => {
      if (target >= 0 && target < questionCount && target !== index) {
        setIndex(target)
      }
    },
    [index, questionCount, setIndex]
  )

  const arrows: ArrowProps[] = React.useMemo(
    () => [
      {
        onClick: () => navigate(0),
        Icon: isLTR ? SkipBack : SkipForward,
        disabled: index === 0
      },
      {
        onClick: () => navigate(index - 1),
        Icon: isLTR ? ChevronLeft : ChevronRight,
        disabled: index === 0
      },
      {
        onClick: () => navigate(index + 1),
        Icon: isLTR ? ChevronRight : ChevronLeft,
        disabled: index >= questionCount - 1
      },
      {
        onClick: () => navigate(questionCount - 1),
        Icon: isLTR ? SkipForward : SkipBack,
        disabled: index >= questionCount - 1
      }
    ],
    [index, questionCount, navigate, isLTR]
  )

  return (
    <div id="arrows" className="justify-self-center grid grid-cols-4 w-50">
      {arrows.map(({ onClick, Icon, disabled }, i) => (
        <div
          key={i}
          className="no-select grid justify-items-center items-center cursor-pointer text-black hover:bg-primary-light"
          onClick={disabled ? undefined : onClick}
          style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
          <Icon size={30} />
        </div>
      ))}
    </div>
  )
}

export default ArrowsComponent

export interface ArrowsProps {
  questionCount: number
}

export interface ArrowProps {
  onClick: MouseEventHandler<HTMLDivElement>
  Icon: React.FC<{ size: number }>
  disabled: boolean
}
