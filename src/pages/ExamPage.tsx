import React from "react"
import Navigation from "../components/Navigation"
import Loading from "../components/Loading"
import { useExam, useSessionControl } from "../contexts"

/**
 * Exam page — renders the active exam session once both the Session (from SessionProvider)
 * and the exam data (from ExamContextProvider) are ready.
 *
 * This component only coordinates rendering — it shows a loading spinner until both
 * contexts are populated, then hands off to Navigation.
 */
const ExamPage: React.FC = () => {
  const { exam } = useExam()
  const { session } = useSessionControl()

  // Both contexts must be ready before the exam UI is safe to render.
  if (!session || !exam) return <Loading size={200} />

  return <Navigation />
}

export default ExamPage
