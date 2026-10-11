import React from "react";
import { Eye, RotateCcw, SquareArrowOutUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AttemptStatusBadge, { type AttemptTone } from "./AttemptStatusBadge";
import { formatDate, formatTimer } from "@/core/utils/format";
import { translate } from "@/core/utils/translation";
import { cn } from "@/components/ui/utils";
import type {
  Attempt,
  CompletedAttempt,
  InProgressAttempt,
} from "@/core/api/apiTypes";
import type { LangCode } from "@/core/types";

type AttemptsTableProps = {
  attempts: Attempt[];
  langCode: LangCode;
  /** Omitted for a supervisor: someone else's attempt is never resumed or retried, only read. */
  onOpen?: (attemptId: string) => void;
  onRevise?: (attemptId: string) => void;
  /** Opens the read-only breakdown. The supervisor's only action on a row. */
  onDetails?: (attempt: Attempt) => void;
  disabled?: boolean;
};

/** The state-specific pieces of one row. Both layouts render these and nothing else varies. */
type RowParts = {
  tone: AttemptTone;
  score: React.ReactNode;
  timeTaken: string;
  actions: React.ReactNode;
};

const HEAD_CLASSES =
  "h-11 text-xs font-bold uppercase tracking-wider text-secondary";

const TONE_CLASSES: Record<
  AttemptTone,
  { scoreBar: string; scoreText: string }
> = {
  pass: {
    scoreBar: "bg-correct",
    scoreText: "text-correct-text",
  },
  fail: {
    scoreBar: "bg-destructive",
    scoreText: "text-destructive-text",
  },
  "in-progress": {
    scoreBar: "bg-primary",
    scoreText: "text-grey-1000",
  },
};

/** Attempt history — a table on md+, stacked cards below it. */
const AttemptsTable: React.FC<AttemptsTableProps> = ({
  attempts,
  langCode,
  onOpen,
  onRevise,
  onDetails,
  disabled = false,
}) => {
  // Shown only where it can act: the exam allows it and the attempt is completed and imperfect.
  const retryButton = (attempt: CompletedAttempt) =>
    onRevise &&
    attempt.configSnapshot.allowRetryWrong &&
    attempt.result.score < 100 && (
      <Button
        size="sm"
        variant="ghost"
        disabled={disabled}
        onClick={() => onRevise(attempt.id)}
        className="h-11 gap-1.5 text-xs font-semibold text-secondary hover:bg-secondary/10 hover:text-secondary md:h-8"
      >
        <RotateCcw className="size-3.5" />
        {translate("history.actions.retry")}
      </Button>
    );

  const detailsButton = (attempt: Attempt) =>
    onDetails && (
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={() => onDetails(attempt)}
        className="h-11 min-w-28 justify-center gap-1.5 border-grey-300 text-xs font-semibold text-grey-950 hover:border-secondary hover:text-secondary md:h-8"
      >
        <Eye className="size-3.5" />
        {translate("history.actions.details")}
      </Button>
    );

  const openButton = (
    attempt: Attempt,
    label: string,
    variant: "default" | "outline",
    className: string,
  ) =>
    onOpen && (
      <Button
        size="sm"
        variant={variant}
        disabled={disabled}
        onClick={() => onOpen(attempt.id)}
        className={cn(
          "h-11 min-w-28 justify-center gap-1.5 text-xs font-semibold md:h-8",
          className,
        )}
      >
        <SquareArrowOutUpRight className="size-3.5 rtl:-scale-x-100" />
        {translate(label)}
      </Button>
    );

  const completedRow = (attempt: CompletedAttempt): RowParts => {
    const { status, score, timeTaken } = attempt.result;

    return {
      tone: status,
      // Score as a number plus a proportional bar, so a row is scannable without reading digits.
      score: (
        <div className="flex flex-col gap-1">
          <span
            className={cn(
              "text-sm font-bold tabular-nums",
              TONE_CLASSES[status].scoreText,
            )}
          >
            {score}%
          </span>
          <div className="h-1 w-16 overflow-hidden rounded-full bg-secondary/15">
            <div
              className={cn("h-full rounded-full", TONE_CLASSES[status].scoreBar)}
              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
            />
          </div>
        </div>
      ),
      timeTaken:
        timeTaken === null
          ? translate("history.not-applicable")
          : formatTimer(timeTaken),
      actions: (
        <>
          {retryButton(attempt)}
          {openButton(
            attempt,
            "history.actions.review",
            "outline",
            "border-grey-300 text-grey-950 hover:border-primary hover:text-primary",
          )}
          {detailsButton(attempt)}
        </>
      ),
    };
  };

  const inProgressRow = (attempt: InProgressAttempt): RowParts => ({
    tone: attempt.examState,
    score: (
      <span className={cn("text-sm", TONE_CLASSES[attempt.examState].scoreText)}>
        —
      </span>
    ),
    timeTaken: "—",
    actions: (
      <>
        {openButton(
          attempt,
          "history.actions.continue",
          "default",
          "bg-primary text-white hover:bg-primary/90",
        )}
        {detailsButton(attempt)}
      </>
    ),
  });

  const rows = attempts.map((attempt) => ({
    attempt,
    parts:
      attempt.examState === "completed"
        ? completedRow(attempt)
        : inProgressRow(attempt),
  }));

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
                {translate("history.table.time-taken")}
              </TableHead>
              <TableHead className={HEAD_CLASSES}>
                {translate("history.table.date")}
              </TableHead>
              <TableHead className={cn(HEAD_CLASSES, "text-end")}>
                {translate("history.table.action")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map(({ attempt, parts }) => (
              <TableRow
                key={attempt.id}
                className="border-grey-100 transition-colors duration-150 hover:bg-secondary/5"
              >
                <TableCell className="py-3">
                  <span className="font-semibold text-tertiary">
                    {attempt.exam.name[langCode]}
                  </span>
                </TableCell>
                <TableCell className="py-3">
                  <AttemptStatusBadge tone={parts.tone} />
                </TableCell>
                <TableCell className="py-3">{parts.score}</TableCell>
                <TableCell className="py-3 whitespace-nowrap text-sm tabular-nums text-grey-1000">
                  {parts.timeTaken}
                </TableCell>
                <TableCell className="py-3 whitespace-nowrap text-sm text-grey-1000">
                  {formatDate(attempt.createdAt)}
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {parts.actions}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: the same rows as cards, since a 6-column table cannot fit 360px. */}
      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map(({ attempt, parts }) => (
          <li
            key={attempt.id}
            className="overflow-hidden rounded-xl border border-grey-200 bg-white"
          >
            <div className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="font-semibold text-tertiary">
                  {attempt.exam.name[langCode]}
                </span>
                <AttemptStatusBadge tone={parts.tone} />
              </div>

              <div className="flex items-end justify-between gap-4">
                {parts.score}
                <div className="flex flex-col items-end gap-0.5 text-xs text-grey-1000">
                  <span className="tabular-nums">{parts.timeTaken}</span>
                  <span>{formatDate(attempt.createdAt)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {parts.actions}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
};

export default AttemptsTable;
