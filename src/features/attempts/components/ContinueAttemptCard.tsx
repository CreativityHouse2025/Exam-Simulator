import React from "react";
import { Play, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatTimer } from "@/core/utils/format";
import { translate } from "@/core/utils/translation";
import type { InProgressAttempt } from "@/core/api/apiTypes";
import type { LangCode } from "@/core/types";

type ContinueAttemptCardProps = {
  attempt: InProgressAttempt;
  langCode: LangCode;
  onContinue: (attemptId: string) => void;
  disabled?: boolean;
};

/**
 * The student's unfinished exam, lifted out of the history so picking it back up is the first
 * thing on the page: where they stopped, how much time is left, and one button to resume.
 */
const ContinueAttemptCard: React.FC<ContinueAttemptCardProps> = ({
  attempt,
  langCode,
  onContinue,
  disabled = false,
}) => {
  const titleId = React.useId();
  const position = attempt.currentIndex + 1;
  const progress = Math.min(100, (position / attempt.totalQuestions) * 100);

  return (
    <Card
      aria-labelledby={titleId}
      className="gap-4 border-secondary/25 bg-secondary/5 p-5 md:flex-row md:items-center md:justify-between md:gap-8 md:p-6"
    >
      <div className="min-w-0 flex-1">
        <h2 id={titleId} className="text-sm font-semibold text-secondary">
          {translate("history.resume.title")}
        </h2>
        <p className="mt-1 truncate text-lg font-bold text-tertiary">
          {attempt.exam.name[langCode]}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-grey-1000">
          <span className="tabular-nums">
            {translate("history.resume.progress", [
              position,
              attempt.totalQuestions,
            ])}
          </span>
          {attempt.timeRemaining !== null && (
            <span className="flex items-center gap-1 tabular-nums">
              <Timer aria-hidden className="size-3.5" />
              {translate("history.resume.time-left", [
                formatTimer(attempt.timeRemaining),
              ])}
            </span>
          )}
        </div>

        <div className="mt-2 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-secondary/15">
          <div
            className="h-full rounded-full bg-secondary"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Button
        onClick={() => onContinue(attempt.id)}
        disabled={disabled}
        className="h-11 shrink-0 gap-2 bg-secondary px-6 font-semibold text-white hover:bg-secondary-hover"
      >
        <Play aria-hidden className="size-4 rtl:-scale-x-100" />
        {translate("history.actions.continue")}
      </Button>
    </Card>
  );
};

export default ContinueAttemptCard;
