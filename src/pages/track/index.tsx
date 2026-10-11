import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { CatalogEntryCards, TrackLockedState } from "@/features/tracks";
import {
  AttemptsTable,
  AttemptsTableSkeleton,
  createAttemptsQueryOptions,
} from "@/features/attempts";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import BackButton from "@/components/BackButton";
import Loading from "@/components/Loading";
import { useAuth } from "@/features/auth";
import useSettings from "@/core/hooks/useSettings";
import { useAttemptActions } from "@/features/exam-session";
import { translate } from "@/core/utils/translation";
import { ROUTES } from "@/routes/routes";
import { FULL_TAG_CODE } from "@shared/exam.schema";

const RECENT_ATTEMPT_COUNT = 5;

/** One track: its two ways into the exams, then the student's most recent attempts in it. */
const TrackPage: React.FC = () => {
  const { trackId = "" } = useParams();
  const { settings } = useSettings();
  const langCode = settings.language;
  const { user, enrolledTracks } = useAuth();

  const track = enrolledTracks.find((enrolled) => enrolled.id === trackId);
  const isEnrolled = track !== undefined;

  const attemptsQuery = useQuery({
    ...createAttemptsQueryOptions(trackId, user?.id),
    enabled: isEnrolled,
  });

  const { openAttempt, reviseAttempt, isBusy } = useAttemptActions();

  const recentAttempts = (attemptsQuery.data ?? []).slice(
    0,
    RECENT_ATTEMPT_COUNT,
  );

  // Enrollment is the gate for everything below; the API would answer 403 anyway.
  if (!isEnrolled) {
    return (
      <TrackLockedState
        backTo={ROUTES.home}
        backText={translate("tracks.back")}
      />
    );
  }

  if (isBusy) return <Loading size={100} />;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <BackButton to={ROUTES.home} text={translate("tracks.back")} />

      <header className="mb-5">
        <h1 className="text-2xl font-bold text-tertiary md:text-3xl">
          {track.name[langCode]}
        </h1>
        {track.description && (
          <p className="mt-1.5 text-sm text-grey-800">
            {track.description[langCode]}
          </p>
        )}
      </header>

      <section className="mb-10">
        <CatalogEntryCards
          fullExamsTo={ROUTES.trackExams.to(trackId, FULL_TAG_CODE)}
          categoriesTo={ROUTES.trackCategories.to(trackId)}
        />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-tertiary md:text-xl">
          {translate("history.recent")}
        </h2>

        {attemptsQuery.isPending ? (
          <AttemptsTableSkeleton />
        ) : attemptsQuery.error ? (
          <ErrorState
            message={translate("history.fetchError")}
            onRetry={attemptsQuery.refetch}
            isRetrying={attemptsQuery.isFetching}
          />
        ) : recentAttempts.length === 0 ? (
          <EmptyState
            message={translate("history.table.empty")}
            hint={translate("history.empty-hint")}
          />
        ) : (
          <>
            <AttemptsTable
              attempts={recentAttempts}
              langCode={langCode}
              disabled={isBusy}
              onOpen={openAttempt}
              onRevise={reviseAttempt}
              onRefresh={attemptsQuery.refetch}
              isRefreshing={attemptsQuery.isFetching}
            />

            <div className="mt-4 flex justify-center">
              <Link
                to={ROUTES.trackHistory.to(trackId)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 transition-colors duration-150 hover:text-secondary hover:underline"
              >
                <History className="size-4" />
                {translate("history.view-all")}
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default TrackPage;
