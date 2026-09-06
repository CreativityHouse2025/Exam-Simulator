import React from "react"
import { useNavigate } from "react-router-dom"
import { useSessionControl } from "../contexts"
import { ROUTES } from "../config/routes"

/** Starts a supervisor preview session for the given exam/category and navigates to it on success. */
export default function useExamPreview(type: "full" | "domain", id: number) {
  const navigate = useNavigate()
  const { startNewExam } = useSessionControl()
  const [isPreviewing, setIsPreviewing] = React.useState(false)

  const handlePreview = async () => {
    setIsPreviewing(true)
    const attemptId = await startNewExam({ type, examOrCategoryId: id, preview: true })
    if (attemptId) navigate(ROUTES.examPreview.to(type, id, attemptId))
    else setIsPreviewing(false)
  }

  return { isPreviewing, handlePreview }
}
