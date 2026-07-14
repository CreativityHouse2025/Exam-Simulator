import { Badge } from "@/components/ui/badge"

type ExamTypeBadgeProps = {
  type: "full" | "domain"
}

/** Shared FULL EXAM / DOMAIN pill — used on both the exams-list cards and the exam-detail header. */
const ExamTypeBadge = ({ type }: ExamTypeBadgeProps) => {
  return (
    <Badge variant={type === "full" ? "default" : "secondary"} className="uppercase">
      {type === "full" ? "Full Exam" : "Domain"}
    </Badge>
  )
}

export default ExamTypeBadge
