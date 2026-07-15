import React from "react"
import { useNavigate } from "react-router-dom"
import { BookOpen, Users } from "lucide-react"
import Dashboard from "@/components/dashboard/Dashboard"
import DashboardButton from "@/components/dashboard/DashboardButton"
import DashboardButtonRow from "@/components/dashboard/DashboardButtonRow"
import { translate } from "@/utils/translation"

/** Supervisor dashboard — view exams in the system, or search for a student (search is a future spec, stub for now). */
const SupervisorDashboardPage: React.FC = () => {
  const navigate = useNavigate()

  const t = {
    subtitle: translate("dashboard.supervisor.subtitle"),
    searchStudents: translate("dashboard.supervisor.search-students"),
    viewExams: translate("dashboard.supervisor.view-exams")
  }

  return (
    <Dashboard subtitle={t.subtitle}>
      <DashboardButtonRow>
        <DashboardButton
          className="no-select"
          title="Search Students"
          icon={<Users size={22} />}
          label={t.searchStudents}
        />

        <DashboardButton
          variant="secondary"
          className="no-select"
          title="View Exams"
          icon={<BookOpen size={22} />}
          label={t.viewExams}
          onClick={() => navigate("/exams")}
        />
      </DashboardButtonRow>
    </Dashboard>
  )
}

export default SupervisorDashboardPage
