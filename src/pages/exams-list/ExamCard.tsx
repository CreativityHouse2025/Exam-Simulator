import { Link } from "react-router-dom"
import { BookOpen, Clock, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import ExamTypeBadge from "@/components/ExamTypeBadge"
import type { ExamListItem } from "./types"

type ExamCardProps = {
  exam: ExamListItem
}

/** Each exam type carries its own accent colour, applied to the card's edge bar, pass rate and action button. */
const ACCENT = {
  full: {
    bar: "bg-primary",
    text: "text-primary",
    button: "border-primary text-primary hover:bg-primary/10 hover:text-primary"
  },
  domain: {
    bar: "bg-secondary",
    text: "text-secondary",
    button: "border-secondary text-secondary hover:bg-secondary/10 hover:text-secondary"
  }
} as const

const ExamCard = ({ exam }: ExamCardProps) => {
  const accent = ACCENT[exam.type]

  return (
    <Link
      to={`/exams/${exam.type}/${exam.id}`}
      className="flex gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-shadow hover:shadow-md"
    >
      <div className={`w-1 shrink-0 self-stretch rounded ${accent.bar}`} />

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="font-bold text-tertiary">{exam.name}</span>
          <ExamTypeBadge type={exam.type} />
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-grey-800">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {exam.durationMinutes}m
          </span>

          <span className="flex items-center gap-1.5">
            <BookOpen className="size-3.5" />
            {exam.questionCount} questions
          </span>

          <span className={`flex items-center gap-1.5 font-semibold ${accent.text}`}>
            <Target className="size-3.5" />
            Pass: {exam.passingRate}%
          </span>
        </div>
      </div>

      <Button variant="outline" size="sm" className={`self-center ${accent.button}`} asChild>
        <span>View Questions</span>
      </Button>
    </Link>
  )
}

export default ExamCard
