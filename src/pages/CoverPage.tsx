import React from "react"
import { useNavigate } from "react-router-dom"
import Cover from "../components/Cover"
import Loading from "../components/Loading"
import { DEFAULT_SESSION } from "../constants"
import useExam from "../hooks/useExam"
import useAttemptId from "../hooks/useAttemptId"

/** Cover page — lets the user start a new exam or continue an existing one. */
const CoverPage: React.FC = () => {
  const navigate = useNavigate()
  const { startNewExam } = useExam()
  const [attemptId] = useAttemptId()
  const [isStarting, setIsStarting] = React.useState(false)

  const handleFullExam = async (examId: number) => {
    setIsStarting(true)
    const id = await startNewExam({ ...DEFAULT_SESSION, examType: "full", examId })
    if (id) navigate(`/app/exam?id=${id}`)
    else setIsStarting(false)
  }

  const handleDomainExam = async (categoryId: number) => {
    setIsStarting(true)
    const id = await startNewExam({ ...DEFAULT_SESSION, examType: "domain", categoryId })
    if (id) navigate(`/app/exam?id=${id}`)
    else setIsStarting(false)
  }

  const handleContinue = () => {
    if (attemptId) navigate(`/app/exam?id=${attemptId}`)
  }

  if (isStarting) return <Loading size={200} />

  return (
    <Cover
      onDomainExam={handleDomainExam}
      onFullExam={handleFullExam}
      canContinue={attemptId !== null}
      onContinue={handleContinue}
    />
  )
}

export default CoverPage
