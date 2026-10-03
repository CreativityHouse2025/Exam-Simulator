import React from "react";
import { Eye, RefreshCw, RotateCcw, SquareArrowOutUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AttemptStatusBadge from "./AttemptStatusBadge";
import { formatDate } from "@/utils/format";
import { translate } from "@/utils/translation";
import { cn } from "@/components/ui/utils";
import type { AttemptSummary } from "@/apiTypes";

type AttemptsTableProps = {
  attempts: AttemptSummary[];
  examNameById: Map<number, string>;
  /** Omitted for a supervisor: someone else's attempt is never resumed or retried, only read. */
  onOpen?: (attemptId: string) => void;
  onRevise?: (attemptId: string) => void;
  /** Opens the read-only breakdown. The supervisor's only action on a row. */
  onDetails?: (attempt: AttemptSummary) => void;
  /** Refetches the list. Omitted where the caller has no query to refresh. */
  onRefresh?: () => void;
  isRefreshing?: boolean;
  disabled?: boolean;
};

const HEAD_CLASSES =
  "h-11 text-xs font-bold uppercase tracking-wider text-secondary";

/** Attempt history — a table on md+, stacked cards below it. */
const AttemptsTable: React.FC<AttemptsTableProps> = ({
  attempts,
  examNameById,
  onOpen,
  onRevise,
  onDetails,
  onRefresh,
  isRefreshing = false,
  disabled = false,
}) => {
  // Retry is offered whenever the exam allows it, but only works on a completed, imperfect attempt.
  const canRevise = (attempt: AttemptSummary) =>
    attempt.examState === "completed" &&
    attempt.configSnapshot.allowRetryWrong &&
    attempt.score < 100;

  const examName = (attempt: AttemptSummary) =>
    examNameById.get(attempt.examId) ?? `#${attempt.examId}`;
  const isDone = (attempt: AttemptSummary) => attempt.examState === "completed";

  const scoreTone = (attempt: AttemptSummary) =>
    attempt.status === "pass"
      ? "text-correct-strong"
      : "text-destructive-strong";

  /** Score as a number plus a proportional bar, so a row is scannable without reading digits. */
  const score = (attempt: AttemptSummary) => {
    if (!isDone(attempt))
      return <span className="text-sm text-grey-700">—</span>;

    return (
      <div className="flex flex-col gap-1">
        <span
          className={cn("text-sm font-bold tabular-nums", scoreTone(attempt))}
        >
          {attempt.score}%
        </span>
        <div className="h-1 w-16 overflow-hidden rounded-full bg-secondary/15">
          <div
            className={cn(
              "h-full rounded-full",
              attempt.status === "pass" ? "bg-correct" : "bg-destructive",
            )}
            style={{ width: `${Math.min(100, Math.max(0, attempt.score))}%` }}
          />
        </div>
      </div>
    );
  };

  const actions = (attempt: AttemptSummary) => (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {onRevise && attempt.configSnapshot.allowRetryWrong && (
        <Button
          size="sm"
          variant="ghost"
          disabled={disabled || !canRevise(attempt)}
          onClick={() => onRevise(attempt.id)}
          className="h-8 gap-1.5 text-xs font-semibold text-secondary hover:bg-secondary/10 hover:text-secondary"
        >
          <RotateCcw className="size-3.5" />
          {translate("history.actions.retry")}
        </Button>
      )}

      {onOpen && (
        <Button
          size="sm"
          variant={isDone(attempt) ? "outline" : "default"}
          disabled={disabled}
          onClick={() => onOpen(attempt.id)}
          className={cn(
            "h-8 min-w-28 justify-center gap-1.5 text-xs font-semibold",
            isDone(attempt)
              ? "border-grey-300 text-grey-950 hover:border-primary hover:text-primary"
              : "bg-primary text-white hover:bg-primary/90",
          )}
        >
          <SquareArrowOutUpRight className="size-3.5 rtl:-scale-x-100" />
          {translate(
            `history.actions.${isDone(attempt) ? "review" : "continue"}`,
          )}
        </Button>
      )}

      {onDetails && (
        <Button
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => onDetails(attempt)}
          className="h-8 min-w-28 justify-center gap-1.5 border-grey-300 text-xs font-semibold text-grey-950 hover:border-secondary hover:text-secondary"
        >
          <Eye className="size-3.5" />
          {translate("history.actions.details")}
        </Button>
      )}
    </div>
  );

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-grey-200 bg-white md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-secondary/15 bg-secondary/8 hover:bg-secondary/8">
              <TableHead className={HEAD_CLASSES}>
                {translate("history.table.exam")}
              </TableHead>
              <TableHead className={HEAD_CLASSES}>
                {translate("history.table.status")}
              </TableHead>
              <TableHead className={HEAD_CLASSES}>
                {translate("history.table.score")}
              </TableHead>
              <TableHead className={HEAD_CLASSES}>
                {translate("history.table.date")}
              </TableHead>
              <TableHead className={cn(HEAD_CLASSES, "text-end")}>
                <span className="inline-flex items-center gap-1.5">
                  {translate("history.table.action")}
                  {onRefresh && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      disabled={isRefreshing}
                      onClick={onRefresh}
                      aria-label={translate("common.retry")}
                      className="text-secondary hover:bg-secondary/10 hover:text-secondary"
                    >
                      <RefreshCw
                        className={cn(
                          "size-4.5",
                          isRefreshing && "animate-spin-fast",
                        )}
                      />
                    </Button>
                  )}
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {attempts.map((attempt) => (
              <TableRow
                key={attempt.id}
                className="group border-grey-100 transition-colors duration-150 hover:bg-primary/6"
              >
                <TableCell className="py-3">
                  {/* The state rail gives the row a left edge that reads before any text does. */}
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "h-8 w-1 shrink-0 rounded-full",
                        isDone(attempt)
                          ? attempt.status === "pass"
                            ? "bg-correct"
                            : "bg-destructive"
                          : "bg-primary",
                      )}
                    />
                    <span className="font-semibold text-tertiary">
                      {examName(attempt)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <AttemptStatusBadge
                    state={attempt.examState}
                    status={attempt.status}
                  />
                </TableCell>
                <TableCell className="py-3">{score(attempt)}</TableCell>
                <TableCell className="py-3 whitespace-nowrap text-sm text-grey-800">
                  {formatDate(attempt.createdAt)}
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex justify-end opacity-100 transition-opacity duration-150 md:opacity-70 md:group-hover:opacity-100">
                    {actions(attempt)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: the same rows as cards, since a 5-column table cannot fit 360px. */}
      <ul className="flex flex-col gap-3 md:hidden">
        {attempts.map((attempt) => (
          <li
            key={attempt.id}
            className={cn(
              "overflow-hidden rounded-xl border border-grey-200 bg-white border-s-4",
              isDone(attempt)
                ? attempt.status === "pass"
                  ? "border-s-correct"
                  : "border-s-destructive"
                : "border-s-primary",
            )}
          >
            <div className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="font-semibold text-tertiary">
                  {examName(attempt)}
                </span>
                <AttemptStatusBadge
                  state={attempt.examState}
                  status={attempt.status}
                />
              </div>

              <div className="flex items-end justify-between gap-4">
                {score(attempt)}
                <span className="text-xs text-grey-800">
                  {formatDate(attempt.createdAt)}
                </span>
              </div>

              {actions(attempt)}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
};

export default AttemptsTable;
