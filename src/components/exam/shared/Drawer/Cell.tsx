import React from 'react'
import { gridItemBackgroundColor } from '../../../../utils/color'
import { useExamSessionCore } from '../../../../hooks/examSession/useExamSessionCore'
import { cn } from '../../../ui/utils'

const CellComponent: React.FC<CellProps> = ({ index: myIndex, bookmarks, answered }) => {
  const { index, examState, reviewState, setIndex } = useExamSessionCore()

  const isSelected = myIndex === index && (examState !== 'completed' || reviewState === 'question')

  const onClickCell = React.useCallback(
    (newIndex: number) => {
      if (isSelected) return
      setIndex(newIndex)
    },
    [isSelected, setIndex]
  )

  return (
    <div
      data-test={`Cell ${myIndex}`}
      className={cn(
        "no-select w-11.25 h-11.25 grid justify-items-center items-center mr-1.25 mb-1.25",
        "text-black border border-grey-300 text-xs font-bold cursor-pointer outline-3",
        gridItemBackgroundColor(myIndex, bookmarks, answered),
        isSelected ? "outline-grey-950" : "outline-transparent",
      )}
      onClick={() => onClickCell(myIndex)}
    >
      {myIndex + 1}
    </div>
  )
}

export default CellComponent

export interface CellProps {
  index: number
  bookmarks: number[]
  answered: number[]
}
