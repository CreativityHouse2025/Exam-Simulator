import React from "react";
import { CircleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import ExamFacts from "@/components/exams/ExamFacts";
import { translate } from "@/utils/translation";
import { examTypeAccent } from "@/utils/examTypeColour";
import { cn } from "@/components/ui/utils";
import type { ExamDetails, ExamType } from "@/apiTypes";
import type { ExamAttemptStats } from "@/utils/attempts";
import type { LangCode } from "@/types";

type ExamCardProps = {
  exam: ExamDetails;
  examType: ExamType | undefined;
  stats: ExamAttemptStats;
  langCode: LangCode;
  onStart: () => void;
  onViewAttempts: () => void;
  disabled?: boolean;
};

/** One exam in a track — every fact on the face of the card, accented by its exam type. */
const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  examType,
  stats,
  langCode,
  onStart,
  onViewAttempts,
  disabled = false,
}) => {
  const accent = examTypeAccent(examType?.colour ?? null);
  const { canRevealAnswers, allowRetryWrong } = exam.config;

  return (
    <Card
      className={cn(
        "overflow-hidden border-grey-200 pt-0 transition-colors duration-200",
        accent.hoverBorder,
      )}
    >
      <div className={cn("h-1.5 w-full", accent.rail)} />

      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              {examType && (
                <Badge className={cn("shrink-0 text-xs", accent.chip)}>
                  {examType.name[langCode]}
                </Badge>
              )}
              {stats.count > 0 && (
                <Badge
                  variant="outline"
                  className="shrink-0 border-grey-300 text-xs text-grey-800"
                >
                  {translate("exams.taken", [stats.count])}
                </Badge>
              )}
              {canRevealAnswers && (
                <Badge
                  variant="outline"
                  className="shrink-0 border-grey-300 text-xs text-grey-800"
                >
                  {translate("exams.config.reveal")}
                </Badge>
              )}
              {allowRetryWrong && (
                <Badge
                  variant="outline"
                  className="shrink-0 border-grey-300 text-xs text-grey-800"
                >
                  {translate("exams.config.retry")}
                </Badge>
              )}
            </div>

            <h3 className="text-base font-bold text-tertiary md:text-lg">
              {exam.name[langCode]}
            </h3>
          </div>

          <Button
            onClick={onStart}
            disabled={disabled}
            className={cn("shrink-0 font-semibold", accent.button)}
          >
            {translate("exams.start")}
          </Button>
        </div>

        <p className="text-sm leading-relaxed text-grey-800">
          {exam.description[langCode]}
        </p>

        <ExamFacts
          config={exam.config}
          questionCount={exam.questionCount}
          iconClassName={accent.icon}
        />

        {stats.inProgressCount > 0 && (
          <button
            onClick={onViewAttempts}
            className="flex w-fit cursor-pointer items-center gap-1.5 rounded-md bg-grey-100 px-2.5 py-1.5 text-xs font-semibold text-grey-950 transition-colors duration-200 hover:bg-grey-200"
          >
            <CircleAlert className={cn("size-3.5", accent.icon)} />
            {translate("exams.in-progress", [stats.inProgressCount])}
          </button>
        )}
      </CardHeader>
    </Card>
  );
};

export default ExamCard;
