import React from "react";
import { useNavigate } from "react-router-dom";
import Dashboard from "@/components/dashboard/Dashboard";
import DashboardButton from "@/components/dashboard/DashboardButton";
import DashboardButtonRow from "@/components/dashboard/DashboardButtonRow";
import { translate } from "@/utils/translation";
import { ICONS } from "@/config/icons";
import { ROUTES } from "@/config/routes";

/** Supervisor dashboard — view exams in the system, or search for a student. */
const SupervisorDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const SearchStudentsIcon = ICONS.searchStudents;
  const ExamsIcon = ICONS.exams;

  const t = {
    subtitle: translate("dashboard.supervisor.subtitle"),
    searchStudents: translate("dashboard.supervisor.search-students"),
    viewExams: translate("dashboard.supervisor.view-exams"),
  };

  return (
    <Dashboard subtitle={t.subtitle}>
      <DashboardButtonRow>
        <DashboardButton
          className="no-select"
          title="Search Students"
          icon={<SearchStudentsIcon size={25} />}
          label={t.searchStudents}
          onClick={() => navigate(ROUTES.students)}
        />

        <DashboardButton
          variant="secondary"
          className="no-select"
          title="View Exams"
          icon={<ExamsIcon size={22} />}
          label={t.viewExams}
          onClick={() => navigate(ROUTES.exams)}
        />
      </DashboardButtonRow>
    </Dashboard>
  );
};

export default SupervisorDashboardPage;
