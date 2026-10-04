import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Lock } from "lucide-react";
import AttemptsTable from "@/components/attempts/AttemptsTable";
import AttemptsTableSkeleton from "@/components/attempts/AttemptsTableSkeleton";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import BackButton from "@/components/BackButton";
import Loading from "@/components/Loading";
import useAuth from "@/hooks/useAuth";
import useSettings from "@/hooks/useSettings";
import useAttemptActions from "@/hooks/useAttemptActions";
import {
  createAttemptsQueryOptions,
  createTrackExamsQueryOptions,
} from "@/utils/queryOptions";
import { translate } from "@/utils/translation";
import { ROUTES } from "@/config/routes";

/** The student's recent attempts in one track, capped server-side. */
const AttemptHistoryPage: React.FC = () => {
  const { trackId = "" } = useParams();
  const { settings } = useSettings();
  const langCode = settings.language;
  const { enrolledTracks } = useAuth();

  const track = enrolledTracks.find((enrolled) => enrolled.id === trackId);
  const isEnrolled = track !== undefined;

  const attemptsQuery = useQuery({
    ...createAttemptsQueryOptions(trackId),
    enabled: isEnrolled,
  });
  // Only for resolving exam names — AttemptSummary carries exam_id but never the name.
  const examsQuery = useQuery({
    ...createTrackExamsQueryOptions(trackId),
    enabled: isEnrolled,
  });

  const { openAttempt, reviseAttempt, isBusy } = useAttemptActions();

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

  if (!isEnrolled) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <BackButton to={ROUTES.home} text={translate("tracks.back")} />
        <EmptyState
          icon={Lock}
          message={translate("tracks.locked")}
          hint={translate("tracks.locked-hint")}
          className="mt-6"
        />
      </div>
    );
  }

  if (isBusy) return <Loading size={100} />;

  const attempts = attemptsQuery.data ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <BackButton
        to={ROUTES.track.to(trackId)}
        text={translate("history.back", [track.name[langCode]])}
      />

      <header className="mb-5">
        <h1 className="text-2xl font-bold text-tertiary md:text-3xl">
          {translate("history.title")}
        </h1>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-grey-800">
          <p>{translate("history.subtitle", [track.name[langCode]])}</p>
          {attemptsQuery.isSuccess && (
            <span className="flex items-center gap-1.5">
              <ClipboardList className="size-3.5 shrink-0" />
              {translate("history.attempt-count", [attempts.length])}
            </span>
          )}
        </div>
      </header>

      {attemptsQuery.isPending ? (
        <AttemptsTableSkeleton rows={5} />
      ) : attemptsQuery.error ? (
        <ErrorState
          message={translate("history.fetchError")}
          onRetry={attemptsQuery.refetch}
          isRetrying={attemptsQuery.isFetching}
        />
      ) : attempts.length === 0 ? (
        <EmptyState
          message={translate("history.table.empty")}
          hint={translate("history.empty-hint")}
        />
      ) : (
        <AttemptsTable
          attempts={attempts}
          examNameById={examNameById}
          disabled={isBusy}
          onOpen={openAttempt}
          onRevise={reviseAttempt}
          onRefresh={attemptsQuery.refetch}
          isRefreshing={attemptsQuery.isFetching}
        />
      )}
    </div>
  );
};

export default AttemptHistoryPage;
