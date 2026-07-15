import { Badge } from "@/components/ui/badge"

type ExamTypeBadgeProps = {
  /** Drives the pill colour. */
  type: "full" | "domain"
  /** Pre-translated pill text. */
  label: string
}

/** Shared FULL EXAM / DOMAIN pill — used on both the exam-library cards and the exam-detail header. */
const ExamTypeBadge = ({ type, label }: ExamTypeBadgeProps) => {
  return (
    <Badge variant={type === "full" ? "default" : "secondary"} className="uppercase">
      {label}
    </Badge>
  )
}

export default ExamTypeBadge
