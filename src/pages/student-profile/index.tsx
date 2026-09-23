import React from "react";
import { useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layers } from "lucide-react";
import StudentSummaryCard, {
  StudentSummaryCardSkeleton,
} from "@/components/students/StudentSummaryCard";
import StudentBreadcrumb from "@/components/students/StudentBreadcrumb";
import TrackLinkCard, {
  TRACK_GRID_CLASSES,
} from "@/components/tracks/TrackLinkCard";
import TrackCardSkeleton from "@/components/tracks/TrackCardSkeleton";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import useAuth from "@/hooks/useAuth";
import useSettings from "@/hooks/useSettings";
import { createStudentQueryOptions } from "@/utils/queryOptions";
import { formatDate } from "@/utils/format";
import { translate } from "@/utils/translation";
import { ROUTES } from "@/config/routes";

const SKELETON_COUNT = 2;

/**
 * `/students/:id` — who the student is, and which of their tracks this supervisor may open.
 *
 * A track is listed only when both hold an active enrollment in it: the supervisor's own
 * enrollment is what `/api/students/:id/attempts` checks, so listing the rest would offer a door
 * that answers 403. The attempts page still renders that 403 for deep links and for an enrollment
 * that lapses while the tab is open.
 */
const StudentProfilePage: React.FC = () => {
  const { id = "" } = useParams();
  const location = useLocation();
  const fromSearch = (location.state as { from?: string } | null)?.from ?? "";
  const { settings } = useSettings();
  const langCode = settings.language;
  const { enrolledTracks } = useAuth();

  const { data, isPending, isError, refetch, isFetching } = useQuery(
    createStudentQueryOptions(id),
  );

  const supervisorTrackIds = React.useMemo(
    () => new Set(enrolledTracks.map((track) => track.id)),
    [enrolledTracks],
  );

  const sharedTracks = React.useMemo(
    () =>
      (data?.tracks ?? []).filter((track) => supervisorTrackIds.has(track.id)),
    [data, supervisorTrackIds],
  );

  const studentName = data
    ? `${data.user.firstName} ${data.user.lastName}`
    : "…";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <StudentBreadcrumb
        fromSearch={fromSearch}
        studentId={id}
        studentName={studentName}
      />

      {isPending ? (
        <>
          <StudentSummaryCardSkeleton />
          <div className={`mt-8 ${TRACK_GRID_CLASSES}`}>
            {Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <TrackCardSkeleton key={i} />
            ))}
          </div>
        </>
      ) : isError || !data ? (
        <ErrorState
          message={translate("students.profile.error")}
          onRetry={refetch}
          isRetrying={isFetching}
        />
      ) : (
        <>
          <StudentSummaryCard student={data.user} />

          <section className="mt-8">
            <h2 className="text-lg font-bold text-tertiary md:text-xl">
              {translate("students.profile.tracks-title")}
            </h2>
            <p className="mt-1.5 mb-4 text-sm text-grey-800">
              {translate("students.profile.tracks-subtitle")}
            </p>

            {sharedTracks.length === 0 ? (
              <EmptyState
                icon={Layers}
                message={translate("students.profile.tracks-empty")}
                hint={translate("students.profile.tracks-empty-hint")}
              />
            ) : (
              <div className={TRACK_GRID_CLASSES}>
                {sharedTracks.map((track) => (
                  <TrackLinkCard
                    key={track.id}
                    track={track}
                    to={ROUTES.studentAttempts.to(id, track.id)}
                    langCode={langCode}
                    state={{ from: fromSearch }}
                    footnote={translate("students.profile.enrolled-until", [
                      formatDate(track.expiresAt),
                    ])}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default StudentProfilePage;
