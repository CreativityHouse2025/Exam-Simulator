import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { HelpCircle, Loader2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExamTypeBadge from "@/components/ExamTypeBadge";
import ExamStats from "@/components/ExamStats";
import { useSessionControl } from "@/contexts";
import { translate } from "@/utils/translation";
import { ROUTES } from "@/config/routes";
import type { ExamListItem } from "./types";

type ExamCardProps = {
  exam: ExamListItem;
};

/** Each exam type carries its own accent colour, applied to the card's edge bar and action buttons. */
const ACCENT = {
  full: {
    bar: "bg-primary",
    button:
      "border-primary text-primary hover:bg-primary/10 hover:text-primary",
  },
  domain: {
    bar: "bg-secondary",
    button:
      "border-secondary text-secondary hover:bg-secondary/10 hover:text-secondary",
  },
} as const;

const ExamCard = ({ exam }: ExamCardProps) => {
  const navigate = useNavigate();
  const { startNewExam } = useSessionControl();
  const [isPreviewing, setIsPreviewing] = React.useState(false);
  const accent = ACCENT[exam.type];

  const t = {
    type: translate(`exam.type.${exam.type}`),
    viewQuestions: translate("exam.library.view-questions"),
    preview: translate("exam.library.preview"),
    duration: translate("exam.stats.duration", [exam.durationMinutes]),
    questions: translate("exam.stats.questions", [exam.questionCount]),
    pass: translate("exam.stats.pass", [exam.passingRate]),
  };

  const handlePreview = async () => {
    setIsPreviewing(true);
    const id = await startNewExam({
      type: exam.type,
      examOrCategoryId: exam.id,
      preview: true,
    });
    if (id) navigate(ROUTES.examPreview.to(id));
    else setIsPreviewing(false);
  };

  return (
    <div className="flex gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-shadow hover:shadow-md">
      <div className={`w-1 shrink-0 self-stretch rounded ${accent.bar}`} />

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="font-bold text-tertiary">{exam.name}</span>
          <ExamTypeBadge type={exam.type} label={t.type} />
        </div>

        <ExamStats
          duration={t.duration}
          questions={t.questions}
          pass={t.pass}
        />
      </div>

      <div className="flex shrink-0 flex-row items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className={`gap-1.5 md:min-w-36 ${accent.button}`}
          asChild
        >
          <Link to={ROUTES.examDetail.to(exam.type, exam.id)}>
            <HelpCircle className="size-4" />
            <span className="hidden md:inline">{t.viewQuestions}</span>
          </Link>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className={`gap-1.5 md:min-w-36 ${accent.button}`}
          disabled={isPreviewing}
          onClick={handlePreview}
        >
          {isPreviewing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <PlayCircle className="size-4" />
          )}
          <span className="hidden md:inline">{t.preview}</span>
        </Button>
      </div>
    </div>
  );
};

export default ExamCard;
