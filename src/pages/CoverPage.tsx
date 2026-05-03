import React from "react"
import { useNavigate } from "react-router-dom"
import Cover from "../components/Cover"
import { DEFAULT_SESSION } from "../constants"
import useExam from "../hooks/useExam"

/** Cover page — lets the user start a new exam or continue an existing one. */
const CoverPage: React.FC = () => {
  const navigate = useNavigate()
  const { session, startNewExam, resumeExam } = useExam()

  const handleFullExam = (examId: number) => {
    if (startNewExam({ ...DEFAULT_SESSION, examType: "full", examId })) navigate("/app/exam")
  }

  const handleDomainExam = (categoryId: number) => {
    if (startNewExam({ ...DEFAULT_SESSION, examType: "domain", categoryId })) navigate("/app/exam")
  }

  const handleContinue = () => {
    if (resumeExam(session)) navigate("/app/exam")
  }

  return (
    <Cover
      onDomainExam={handleDomainExam}
      onFullExam={handleFullExam}
      canContinue={session.examType ? true : false}
      onContinue={handleContinue}
    />
  )
}

export default CoverPage
