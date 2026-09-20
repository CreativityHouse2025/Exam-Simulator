import React from "react"
import { RefreshCw } from "lucide-react"
import AttemptHistoryRow from "./AttemptHistoryRow"
import AttemptHistorySkeleton from "./AttemptHistorySkeleton"
import { translate } from "../../utils/translation"
import type { AttemptSummary } from "../../apiTypes"
import { cn } from "../ui/utils"

type Props = {
  attempts: AttemptSummary[]
  loading?: boolean
  isFetching?: boolean
  onRefresh?: () => void
  onContinue: (id: string) => void
  onReview: (id: string) => void
  onRetry: (id: string) => void
}

const THEAD_TH_CLASSES =
  "pt-3.5 px-3.5 pb-3.25 text-start text-xs font-bold tracking-widest uppercase text-grey-900 border-b-2 border-primary whitespace-nowrap"

// "history.table.type" dropped — the full/domain exam-type distinction it showed is gone with
// the exam-type JSON (AttemptHistoryRow no longer has a type cell to match it).
const COLUMN_HEADER_KEYS = [
  "history.table.exam-domain",
  "history.table.state",
  "history.table.score",
  "history.table.status",
  "history.table.date",
]

/** Renders the full attempts table with a desktop header and responsive rows. */
const AttemptHistoryTable: React.FC<Props> = ({ attempts, loading, isFetching = false, onRefresh, onContinue, onReview, onRetry }) => {
  return (
    /* Provides the visible border, border-radius, and overflow clipping (prevents animation scrollbar). */
    <div className="border-0 overflow-hidden md:rounded-xl md:border md:border-grey-400">
      <div className="w-full overflow-x-auto">
        <table className="block w-full border-collapse font-sans md:table">
          <thead className="hidden md:table-header-group">
            <tr>
              {COLUMN_HEADER_KEYS.map((key) => (
                <th key={key} className={THEAD_TH_CLASSES}>{translate(key)}</th>
              ))}
              <th className={THEAD_TH_CLASSES}>
                <div className="flex items-center justify-between gap-2.5">
                  {translate("history.table.action")}
                  <RefreshCw
                    onClick={onRefresh}
                    className={cn(
                      "size-6.25 text-grey-900 cursor-pointer shrink-0 transition-opacity duration-150 hover:opacity-65",
                      isFetching ? "animate-spin-fast opacity-50" : "opacity-100",
                    )}
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group">
            {loading ? (
              <AttemptHistorySkeleton />
            ) : attempts.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12.5 text-center text-sm text-grey-800">{translate("history.table.empty")}</td>
              </tr>
            ) : (
              attempts.map((attempt, index) => (
                <AttemptHistoryRow
                  key={attempt.id}
                  attempt={attempt}
                  index={index}
                  onContinue={onContinue}
                  onReview={onReview}
                  onRetry={onRetry}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AttemptHistoryTable
