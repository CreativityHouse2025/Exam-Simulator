import React from "react"
import { useNavigate } from "react-router-dom"
import { Assignment, PlayArrow, ViewModule } from "@styled-icons/material"
import Dashboard from "@/components/dashboard/Dashboard"
import DashboardButton from "@/components/dashboard/DashboardButton"
import DashboardButtonRow from "@/components/dashboard/DashboardButtonRow"
import CategoryDropdown from "@/components/exam-dropdown/CategoryDropdown"
import FullExamDropdown from "@/components/exam-dropdown/FullExamDropdown"
import Loading from "@/components/Loading"
import useLatestAttemptId from "@/hooks/useLatestAttempt"
import { useSessionControl } from "@/contexts"
import { translate } from "@/utils/translation"
import type { DropdownItem } from "@/types"

/** Student dashboard — lets the user start a new exam or continue an existing one. */
const StudentDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { startNewExam, resumeAttempt } = useSessionControl()
  const [latestAttemptId] = useLatestAttemptId()
  const [isStarting, setIsStarting] = React.useState(false)

  const [fullExamDropdown, setFullExamDropdown] = React.useState(false)
  const [categoryDropdown, setCategoryDropdown] = React.useState(false)

  // button ref to fix immediate dropdown close on touch event
  const fullButtonRef = React.useRef<HTMLButtonElement | null>(null)
  const miniButtonRef = React.useRef<HTMLButtonElement | null>(null)

  const handleFullExam = async (examId: DropdownItem["id"]) => {
    setIsStarting(true)
    const id = await startNewExam("full", examId)
    if (id) navigate(`/exam?id=${id}`)
    else setIsStarting(false)
  }

  const handleDomainExam = async (categoryId: DropdownItem["id"]) => {
    setIsStarting(true)
    const id = await startNewExam("domain", categoryId)
    if (id) navigate(`/exam?id=${id}`)
    else setIsStarting(false)
  }

  const handleContinue = async () => {
    if (latestAttemptId) {
      setIsStarting(true)
      const attemptId = await resumeAttempt(latestAttemptId)
      if (attemptId) navigate(`/exam?id=${attemptId}`)
      else setIsStarting(false)
    }
  }

  if (isStarting) return <Loading size={100} />

  return (
    <Dashboard subtitle={translate("about.description")}>
      <DashboardButtonRow>
        <DashboardButton
          ref={fullButtonRef}
          className="no-select"
          title="Start a new exam"
          icon={<Assignment size={22} />}
          label={translate("cover.new")}
          onClick={() => setFullExamDropdown(true)}
        />

        <DashboardButton
          ref={miniButtonRef}
          className="no-select"
          title="Start a mini-exam"
          icon={<ViewModule size={22} />}
          label={translate("cover.mini")}
          onClick={() => setCategoryDropdown(true)}
        />
      </DashboardButtonRow>

      {latestAttemptId !== null && (
        <DashboardButton
          variant="secondary"
          className="no-select"
          title="Continue last exam"
          icon={<PlayArrow size={22} />}
          label={translate("cover.continue")}
          onClick={handleContinue}
        />
      )}

      <FullExamDropdown
        open={fullExamDropdown}
        setOpen={setFullExamDropdown}
        buttonRef={fullButtonRef}
        title={translate("cover.select-fullexam")}
        onSelect={handleFullExam}
      />
      <CategoryDropdown
        open={categoryDropdown}
        setOpen={setCategoryDropdown}
        buttonRef={miniButtonRef}
        title={translate("cover.select-category")}
        onSelect={handleDomainExam}
      />
    </Dashboard>
  )
}

export default StudentDashboardPage
