import { BookOpen, Clock, Target } from "lucide-react"

type ExamStatsProps = {
  /** Pre-translated labels — the parent interpolates the numbers via `translate`. */
  duration: string
  questions: string
  pass: string
  className?: string
}

/** Duration / question-count / pass-rate row with icons. Shared by the exam-library cards and the exam-detail header. */
const ExamStats = ({ duration, questions, pass, className }: ExamStatsProps) => {
  return (
    <div className={`flex flex-wrap gap-4 text-xs text-grey-800 ${className ?? ""}`}>
      <span className="flex items-center gap-1.5">
        <Clock className="size-3.5" />
        {duration}
      </span>

      <span className="flex items-center gap-1.5">
        <BookOpen className="size-3.5" />
        {questions}
      </span>

      <span className="flex items-center gap-1.5">
        <Target className="size-3.5" />
        {pass}
      </span>
    </div>
  )
}

export default ExamStats
