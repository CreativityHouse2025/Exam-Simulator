export type ExamListItem = {
  type: "full" | "domain"
  id: number
  name: string
  durationMinutes: number
  passingRate: number
  questionCount: number
}
