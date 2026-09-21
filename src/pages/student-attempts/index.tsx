import React from "react";
import { useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Inbox, Lock } from "lucide-react";
import AttemptsTable from "@/components/attempts/AttemptsTable";
import AttemptsTableSkeleton from "@/components/attempts/AttemptsTableSkeleton";
import StudentSummaryCard, {
  StudentSummaryCardSkeleton,
} from "@/components/students/StudentSummaryCard";
import StudentBreadcrumb from "@/components/students/StudentBreadcrumb";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import AttemptStats from "./AttemptStats";
import AttemptDetailDialog from "./AttemptDetailDialog";
import useAuth from "@/hooks/useAuth";
import useSettings from "@/hooks/useSettings";
import { AppApiError } from "@/errors";
import {
  createStudentAttemptsQueryOptions,
  createStudentQueryOptions,
  createTrackExamsQueryOptions,
} from "@/utils/queryOptions";
import { resolveErrorKey } from "@/utils/errorTranslation";
import { translate } from "@/utils/translation";
import type { AttemptSummary } from "@/apiTypes";

/**
 * `/students/:id/tracks/:trackId` — one student's attempts in one track.
 *
 * Read-only: the table is the student's own history table with its resume and retry actions left
 * out, so both roles read an attempt the same way. Access is the supervisor's own enrollment,
 * checked here to avoid a doomed request and again against the API's 403 for deep links.
 */
const StudentAttemptsPage: React.FC = () => {
  const { id = "", trackId = "" } = useParams();
  const location = useLocation();
  const fromSearch = (location.state as { from?: string } | null)?.from ?? "";
  const { settings } = useSettings();
  const langCode = settings.language;
  const { enrolledTracks } = useAuth();

  const [selectedAttempt, setSelectedAttempt] =
    React.useState<AttemptSummary | null>(null);

  const supervisorTrack = enrolledTracks.find((track) => track.id === trackId);
  const hasAccess = supervisorTrack !== undefined;

  const profileQuery = useQuery(createStudentQueryOptions(id));
  const attemptsQuery = useQuery({
    ...createStudentAttemptsQueryOptions(id, trackId),
    enabled: hasAccess,
  });
  // Only for resolving exam names — an AttemptSummary carries examId but never the name.
  const examsQuery = useQuery({
    ...createTrackExamsQueryOptions(trackId),
    enabled: hasAccess,
  });

  const examNameById = React.useMemo(
    () =>
      new Map(
        (examsQuery.data?.exams ?? []).map((exam) => [
          exam.id,
          exam.name[langCode],
        ]),
      ),
    [examsQuery.data, langCode],
  );

  const studentName = profileQuery.data
    ? `${profileQuery.data.user.firstName} ${profileQuery.data.user.lastName}`
    : "…";
  const trackName =
    supervisorTrack?.name[langCode] ??
    translate("students.attempts.track-fallback");

  const breadcrumb = (
    <StudentBreadcrumb
      fromSearch={fromSearch}
      studentId={id}
      studentName={studentName}
      trackName={trackName}
    />
  );

  // A lapsed or missing enrollment on the SUPERVISOR's side — the student's own access is not the
  // question here, which is why the copy names the supervisor.
  const isForbidden =
    !hasAccess ||
    (attemptsQuery.error instanceof AppApiError &&
      attemptsQuery.error.code === "FORBIDDEN");

  if (isForbidden) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        {breadcrumb}
        <EmptyState
          icon={Lock}
          message={translate("students.attempts.forbidden")}
          hint={translate("students.attempts.forbidden-hint")}
          className="mt-6"
        />
      </div>
    );
  }

  const attempts = attemptsQuery.data ?? [];
  const isPending = profileQuery.isPending || attemptsQuery.isPending;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      {breadcrumb}

      {isPending ? (
        <>
          <StudentSummaryCardSkeleton />
          <div className="mt-6">
            <AttemptsTableSkeleton rows={5} />
          </div>
        </>
      ) : profileQuery.isError || !profileQuery.data ? (
        <ErrorState
          message={translate(resolveErrorKey(profileQuery.error))}
          onRetry={profileQuery.refetch}
          isRetrying={profileQuery.isFetching}
        />
      ) : (
        <>
          <StudentSummaryCard student={profileQuery.data.user} />

          <section className="mt-6">
            <h1 className="mb-4 text-lg font-bold text-tertiary md:text-xl">
              {translate("students.attempts.title-in-track", [trackName])}
            </h1>

            {attemptsQuery.isError ? (
              <ErrorState
                message={translate("students.attempts.error")}
                onRetry={attemptsQuery.refetch}
                isRetrying={attemptsQuery.isFetching}
              />
            ) : attempts.length === 0 ? (
              <EmptyState
                icon={Inbox}
                message={translate("students.attempts.empty")}
                hint={translate("students.attempts.empty-hint")}
              />
            ) : (
              <>
                <AttemptStats attempts={attempts} />

                <div className="mt-6">
                  <AttemptsTable
                    attempts={attempts}
                    examNameById={examNameById}
                    onDetails={setSelectedAttempt}
                    onRefresh={attemptsQuery.refetch}
                    isRefreshing={attemptsQuery.isFetching}
                  />
                </div>
              </>
            )}
          </section>
        </>
      )}

      {selectedAttempt && (
        <AttemptDetailDialog
          attempt={selectedAttempt}
          examName={
            examNameById.get(selectedAttempt.examId) ??
            `#${selectedAttempt.examId}`
          }
          onOpenChange={(open) => !open && setSelectedAttempt(null)}
        />
      )}
    </div>
  );
};

export default StudentAttemptsPage;
