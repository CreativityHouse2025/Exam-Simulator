import React from "react";
import { Link } from "react-router-dom";
import { ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import ExamFacts from "@/components/exams/ExamFacts";
import PreviewExamButton from "@/components/PreviewExamButton";
import { translate } from "@/utils/translation";
import { examTypeAccent } from "@/utils/examTypeColour";
import { ROUTES } from "@/config/routes";
import { cn } from "@/components/ui/utils";
import type { ExamDetails, ExamType } from "@/apiTypes";
import type { LangCode } from "@/types";

type ExamCardProps = {
  exam: ExamDetails;
  examType: ExamType | undefined;
  trackId: string;
  langCode: LangCode;
};

/**
 * One exam as a supervisor reads it: what it is made of, and the two ways in — the question
 * viewer, or an ephemeral preview session that writes nothing to the database.
 */
const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  examType,
  trackId,
  langCode,
}) => {
  const accent = examTypeAccent(examType?.colour ?? null);

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
              {exam.config.canRevealAnswers && (
                <Badge
                  variant="outline"
                  className="shrink-0 border-grey-300 text-xs text-grey-800"
                >
                  {translate("exams.config.reveal")}
                </Badge>
              )}
              {exam.config.allowRetryWrong && (
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

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <PreviewExamButton trackId={trackId} examId={exam.id} />

            <Button
              asChild
              size="sm"
              className={cn("gap-1.5 font-semibold", accent.button)}
            >
              <Link to={ROUTES.examDetail.to(trackId, exam.id)}>
                <ListChecks className="size-4" />
                {translate("exam.library.view-questions")}
              </Link>
            </Button>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-grey-800">
          {exam.description[langCode]}
        </p>

        <ExamFacts
          config={exam.config}
          questionCount={exam.questionCount}
          iconClassName={accent.icon}
        />
      </CardHeader>
    </Card>
  );
};

export default ExamCard;
