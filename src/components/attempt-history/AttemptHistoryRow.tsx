import React from "react"
import { formatDate } from "../../utils/format"
import { translate } from "../../utils/translation"
import AttemptStateIcon from "./AttemptStateIcon"
import AttemptStatusBadge from "./AttemptStatusBadge"
import { Tr, Td } from "./AttemptHistoryStyles"
import type { AttemptSummary } from "../../apiTypes"
import { cn } from "../ui/utils"

type Props = {
  attempt: AttemptSummary
  index: number
  onContinue: (id: string) => void
  onReview: (id: string) => void
  onRetry: (id: string) => void
}

const ACTION_BUTTON_BASE = "rounded-md p-1.5 w-27.5 text-xs font-semibold font-sans whitespace-nowrap"

/** Renders one exam attempt as a responsive row (card on mobile, table row on desktop). */
const AttemptHistoryRow: React.FC<Props> = ({ attempt, index, onContinue, onReview, onRetry }) => {
  // resolveExamLabel and the exam-type distinction it used are gone with the exam-type JSON —
  // falls back to the bare id, same as SessionProvider does until the caller resolves it from
  // the track's exam list.
  const examLabel = String(attempt.examId)

  const scoreDisplay = attempt.examState === "completed" ? `${attempt.score}%` : "—"
  const isInProgress = attempt.examState === "in-progress"
  const retryEnabled =
    attempt.examState === "completed" && attempt.configSnapshot.allowRetryWrong && attempt.score < 100

  const scoreColor =
    attempt.status === "pass" ? "text-correct" : attempt.status === "fail" ? "text-destructive" : "text-grey-700"

  return (
    <Tr index={index}>
      <Td data-label={translate("history.table.exam-domain")}>
        <span className="font-semibold text-sm text-black">{examLabel}</span>
      </Td>
      <Td data-label={translate("history.table.state")}>
        <AttemptStateIcon state={attempt.examState} />
      </Td>
      <Td data-label={translate("history.table.score")}>
        <span className={cn("text-base font-semibold", scoreColor)}>{scoreDisplay}</span>
      </Td>
      <Td data-label={translate("history.table.status")}>
        <AttemptStatusBadge status={attempt.status} />
      </Td>
      <Td data-label={translate("history.table.date")}>{formatDate(attempt.createdAt)}</Td>
      <Td data-label={translate("history.table.action")}>
        <div className="flex gap-1.5 flex-wrap justify-end md:justify-start">
          {isInProgress ? (
            <button
              className={cn(ACTION_BUTTON_BASE, "cursor-pointer bg-primary text-white transition-opacity duration-200 hover:opacity-82")}
              onClick={() => onContinue(attempt.id)}
            >
              {translate("history.actions.continue")}
            </button>
          ) : (
            <button
              className={cn(
                ACTION_BUTTON_BASE,
                "cursor-pointer bg-transparent border-2 border-primary text-primary transition-opacity duration-150 hover:opacity-70",
              )}
              onClick={() => onReview(attempt.id)}
            >
              {translate("history.actions.review")}
            </button>
          )}
          {attempt.configSnapshot.allowRetryWrong && (
            <button
              className={cn(
                ACTION_BUTTON_BASE,
                "text-white transition-opacity duration-200",
                retryEnabled ? "bg-tertiary cursor-pointer opacity-100 hover:opacity-82" : "bg-grey-400 cursor-not-allowed opacity-50 hover:opacity-50",
              )}
              onClick={retryEnabled ? () => onRetry(attempt.id) : undefined}
            >
              {translate("history.actions.retry")}
            </button>
          )}
        </div>
      </Td>
    </Tr>
  )
}

export default AttemptHistoryRow
