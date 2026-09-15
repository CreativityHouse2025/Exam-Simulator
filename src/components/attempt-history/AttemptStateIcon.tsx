import React from "react"
import { Hourglass, CircleCheck } from "lucide-react"
import { translate } from "../../utils/translation"

type Props = {
  state: string
}

/** Displays an icon + label for the exam state: hourglass for in-progress, check for completed. */
const AttemptStateIcon: React.FC<Props> = ({ state }) => {
  const isCompleted = state === "completed"

  return (
    <span className={`inline-flex items-center gap-1.25 text-sm font-semibold whitespace-nowrap ${isCompleted ? "text-correct" : "text-primary"}`}>
      {isCompleted ? <CircleCheck size={16} /> : <Hourglass size={16} />}
      {translate(isCompleted ? "history.state.completed" : "history.state.in-progress")}
    </span>
  )
}

export default AttemptStateIcon
