import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ExamFacts, tagAccent } from "@/features/exams";
import { translate } from "@/core/utils/translation";
import { cn } from "@/components/ui/utils";
import type { ExamWithProgress } from "@/core/api/apiTypes";
import type { LangCode } from "@/core/types";

type TrackExamCardProps = {
  exam: ExamWithProgress;
  langCode: LangCode;
  onStart: () => void;
  /** Opens the exam's unfinished attempt. Offered instead of Start while one exists. */
  onResume: (attemptId: string) => void;
  disabled?: boolean;
};

/** One exam in a track — every fact on the face of the card. Only the tag chip carries the tag's colour. */
const TrackExamCard: React.FC<TrackExamCardProps> = ({
  exam,
  langCode,
  onStart,
  onResume,
  disabled = false,
}) => {
  const accent = tagAccent(exam.tag.colorHexCode);
  const { attemptsCount, openAttemptId } = exam;

  return (
    <Card className="overflow-hidden border-grey-200 pt-0 transition-colors duration-200 hover:border-tertiary">
      <div className="h-1.5 w-full bg-tertiary" />

      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                style={accent.style}
                className={cn("shrink-0 text-xs", accent.chip)}
              >
                {exam.tag.name[langCode]}
              </Badge>
              {attemptsCount > 0 && (
                <Badge
                  variant="outline"
                  className="shrink-0 border-grey-300 text-xs text-grey-800"
                >
                  {translate("exams.taken", [attemptsCount])}
                </Badge>
              )}
            </div>

            <h3 className="text-base font-bold text-tertiary md:text-lg">
              {exam.name[langCode]}
            </h3>
          </div>

          <Button
            onClick={
              openAttemptId === null ? onStart : () => onResume(openAttemptId)
            }
            disabled={disabled}
            className="shrink-0 bg-tertiary font-semibold text-white hover:bg-tertiary/90"
          >
            {translate(openAttemptId === null ? "exams.start" : "exams.resume")}
          </Button>
        </div>

        <p className="text-sm leading-relaxed text-grey-800">
          {exam.description[langCode]}
        </p>

        <ExamFacts
          config={exam.config}
          questionCount={exam.questionCount}
          iconClassName="text-tertiary"
        />
      </CardHeader>
    </Card>
  );
};

export default TrackExamCard;
