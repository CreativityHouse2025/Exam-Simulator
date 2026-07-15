import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import ExamTypeBadge from "@/components/ExamTypeBadge"
import ExamStats from "@/components/ExamStats"
import { translate } from "@/utils/translation"
import type { ExamListItem } from "./types"

type ExamCardProps = {
  exam: ExamListItem
}

/** Each exam type carries its own accent colour, applied to the card's edge bar and action button. */
const ACCENT = {
  full: {
    bar: "bg-primary",
    button: "border-primary text-primary hover:bg-primary/10 hover:text-primary"
  },
  domain: {
    bar: "bg-secondary",
    button: "border-secondary text-secondary hover:bg-secondary/10 hover:text-secondary"
  }
} as const

const ExamCard = ({ exam }: ExamCardProps) => {
  const accent = ACCENT[exam.type]

  const t = {
    type: translate(`exam.type.${exam.type}`),
    viewQuestions: translate("exam.library.view-questions"),
    duration: translate("exam.stats.duration", [exam.durationMinutes]),
    questions: translate("exam.stats.questions", [exam.questionCount]),
    pass: translate("exam.stats.pass", [exam.passingRate])
  }

  return (
    <Link
      to={`/exams/${exam.type}/${exam.id}`}
      className="flex gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-shadow hover:shadow-md"
    >
      <div className={`w-1 shrink-0 self-stretch rounded ${accent.bar}`} />

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="font-bold text-tertiary">{exam.name}</span>
          <ExamTypeBadge type={exam.type} label={t.type} />
        </div>

        <ExamStats duration={t.duration} questions={t.questions} pass={t.pass} />
      </div>

      <Button variant="outline" size="sm" className={`self-center ${accent.button}`} asChild>
        <span>{t.viewQuestions}</span>
      </Button>
    </Link>
  )
}

export default ExamCard
