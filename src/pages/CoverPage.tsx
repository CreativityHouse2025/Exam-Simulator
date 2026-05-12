import React from "react"
import { useNavigate } from "react-router-dom"
import Cover from "../components/Cover"
import Loading from "../components/Loading"
import useLatestAttemptId from "../hooks/useLatestAttempt"
import { useSessionControl } from "../contexts"

/** Cover page — lets the user start a new exam or continue an existing one. */
const CoverPage: React.FC = () => {
  const navigate = useNavigate()
  const { startNewExam } = useSessionControl()
  const [latestAttemptId] = useLatestAttemptId()
  const [isStarting, setIsStarting] = React.useState(false)

  const handleFullExam = async (examId: number) => {
    setIsStarting(true)
    const id = await startNewExam("full", examId)
    if (id) navigate(`/app/exam?id=${id}`)
    else setIsStarting(false)
  }

  const handleDomainExam = async (categoryId: number) => {
    setIsStarting(true)
    const id = await startNewExam("domain", categoryId)
    if (id) navigate(`/app/exam?id=${id}`)
    else setIsStarting(false)
  }

  const handleContinue = () => {
    if (latestAttemptId) navigate(`/app/exam?id=${latestAttemptId}`)
  }

  if (isStarting) return <Loading size={200} />

  return (
    <Cover
      onDomainExam={handleDomainExam}
      onFullExam={handleFullExam}
      canContinue={latestAttemptId !== null}
      onContinue={handleContinue}
    />
  )
}

export default CoverPage
