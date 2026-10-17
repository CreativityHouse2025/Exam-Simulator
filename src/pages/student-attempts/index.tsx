import React from "react";
import { useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Inbox, Lock } from "lucide-react";
import {
  AttemptsPagination,
  AttemptsTable,
  AttemptsTableSkeleton,
  AttemptDetailDialog,
  useAttemptPageParams,
} from "@/features/attempts";
import {
  StudentSummaryCard,
  StudentSummaryCardSkeleton,
  StudentBreadcrumb,
  createStudentAttemptsQueryOptions,
  createStudentQueryOptions,
} from "@/features/students";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import { useAuth } from "@/features/auth";
import useSettings from "@/core/hooks/useSettings";
import { AppApiError } from "@/core/errors";
import { resolveErrorKey } from "@/core/utils/errorTranslation";
import { translate } from "@/core/utils/translation";
import type { Attempt } from "@/core/api/apiTypes";

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
  const { user, enrolledTracks } = useAuth();
  const { attemptPage, setPage, setPerPage } = useAttemptPageParams();

  const [selectedAttempt, setSelectedAttempt] =
    React.useState<Attempt | null>(null);

  const supervisorTrack = enrolledTracks.find((track) => track.id === trackId);
  const hasAccess = supervisorTrack !== undefined;

  const profileQuery = useQuery(createStudentQueryOptions(id, user?.id));
  const attemptsQuery = useQuery({
    ...createStudentAttemptsQueryOptions(id, trackId, attemptPage, user?.id),
    enabled: hasAccess,
  });
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

  const attempts = attemptsQuery.data?.attempts ?? [];
  const total = attemptsQuery.data?.total ?? 0;
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
            <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <h1 className="text-lg font-bold text-tertiary md:text-xl">
                {translate("students.attempts.title-in-track", [trackName])}
              </h1>
              {attemptsQuery.isSuccess && (
                <span className="flex items-center gap-1.5 text-sm text-grey-800">
                  <ClipboardList className="size-3.5 shrink-0" />
                  {translate("history.attempt-count", [total])}
                </span>
              )}
            </div>

            {attemptsQuery.isError ? (
              <ErrorState
                message={translate("students.attempts.error")}
                onRetry={attemptsQuery.refetch}
                isRetrying={attemptsQuery.isFetching}
              />
            ) : (
              <>
                {/* Empty with a non-zero total: a page past the end, so the pager stays to go back. */}
                {attempts.length === 0 ? (
                  <EmptyState
                    icon={Inbox}
                    message={translate("students.attempts.empty")}
                    hint={translate("students.attempts.empty-hint")}
                  />
                ) : (
                  <AttemptsTable
                    attempts={attempts}
                    langCode={langCode}
                    onDetails={setSelectedAttempt}
                  />
                )}
                {total > 0 && (
                  <AttemptsPagination
                    page={attemptPage}
                    total={total}
                    onPageChange={setPage}
                    onPerPageChange={setPerPage}
                  />
                )}
              </>
            )}
          </section>
        </>
      )}

      {selectedAttempt && (
        <AttemptDetailDialog
          attempt={selectedAttempt}
          examName={selectedAttempt.exam.name[langCode]}
          onOpenChange={(open) => !open && setSelectedAttempt(null)}
        />
      )}
    </div>
  );
};

export default StudentAttemptsPage;
