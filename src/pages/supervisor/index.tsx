import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Layers, NotepadText, Users } from "lucide-react";
import ActionCard from "./ActionCard";
import SearchLauncher from "./SearchLauncher";
import EmptyState from "@/components/states/EmptyState";
import useAuth from "@/hooks/useAuth";
import useSettings from "@/hooks/useSettings";
import { translate } from "@/utils/translation";
import { ROUTES } from "@/config/routes";

/**
 * `/` for supervisors — look a student up, or open a track's exam library.
 *
 * Everything here comes from `/api/auth/me`, already in AuthContext, so the page issues no request
 * and has no loading or error state of its own. The one empty state is a supervisor with no
 * enrollments, who can reach neither destination until someone grants them a track.
 */
const SupervisorDashboardPage: React.FC = () => {
  const { user, enrolledTracks } = useAuth();
  const { settings } = useSettings();
  const langCode = settings.language;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <section className="mb-8 rounded-2xl bg-secondary px-5 py-7 shadow-4 md:px-8 md:py-9">
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
          {translate("dashboard.supervisor.welcome", [user?.firstName ?? ""])}
        </h1>
        <p className="mt-2 mb-6 max-w-xl text-sm leading-relaxed text-quatro">
          {translate("dashboard.supervisor.lead")}
        </p>

        <SearchLauncher />
      </section>

      <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2">
        <ActionCard
          icon={Users}
          accent="secondary"
          to={ROUTES.students}
          title={translate("dashboard.supervisor.search-students")}
          description={translate("dashboard.supervisor.students-description")}
        />
        <ActionCard
          icon={NotepadText}
          accent="primary"
          to={ROUTES.exams}
          title={translate("dashboard.supervisor.view-exams")}
          description={translate("dashboard.supervisor.exams-description")}
        />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold text-tertiary md:text-xl">
          {translate("dashboard.supervisor.tracks-title")}
        </h2>

        {enrolledTracks.length === 0 ? (
          <EmptyState
            icon={Layers}
            message={translate("dashboard.supervisor.tracks-empty")}
            hint={translate("tracks.locked-hint")}
          />
        ) : (
          <ul className="flex flex-wrap gap-2.5">
            {enrolledTracks.map((track) => (
              <li key={track.id}>
                <Link
                  to={ROUTES.examLibrary.to(track.id)}
                  className="flex h-11 items-center gap-2 rounded-full border border-grey-300 bg-white px-4 text-sm font-semibold text-grey-950 transition-colors duration-150 hover:border-secondary hover:text-secondary"
                >
                  {track.name[langCode]}
                  <ArrowRight className="size-3.5 rtl:rotate-180" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default SupervisorDashboardPage;
