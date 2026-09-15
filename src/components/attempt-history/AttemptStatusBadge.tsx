import React from "react"
import { translate } from "../../utils/translation"

type Props = {
  status: string | null
}

/** Renders a coloured pass/fail pill. Renders a dash when status is null (in-progress). */
const AttemptStatusBadge: React.FC<Props> = ({ status }) => {
  if (!status) return <span className="text-grey-600">—</span>
  const pass = status === "pass"
  return (
    <span
      className={`inline-flex items-center gap-1 py-0.75 px-2.25 rounded-3xl text-xs font-bold tracking-wider uppercase border
        before:content-[''] before:inline-block before:w-1.5 before:h-1.5 before:rounded-full before:bg-current before:shrink-0
        ${pass ? "bg-correct/12 text-correct border-correct" : "bg-destructive/10 text-destructive border-destructive"}`}
    >
      {translate(`history.status.${status}`)}
    </span>
  )
}

export default AttemptStatusBadge
