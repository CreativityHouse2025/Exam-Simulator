import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  TrackCatalogShortcuts,
  TrackHero,
  TrackLockedState,
} from "@/features/tracks";
import {
  AttemptsTable,
  AttemptsTableSkeleton,
  ContinueAttemptCard,
  DEFAULT_ATTEMPT_PAGE,
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
import type { Attempt, InProgressAttempt } from "@/core/api/apiTypes";

const RECENT_ATTEMPT_COUNT = 5;

const isInProgress = (attempt: Attempt): attempt is InProgressAttempt =>
  attempt.examState === "in-progress";

/** One track: its identity and two ways into the exams, an unfinished exam to resume, then recent attempts. */
const TrackPage: React.FC = () => {
  const { trackId = "" } = useParams();
  const { settings } = useSettings();
  const langCode = settings.language;
  const { user, enrolledTracks } = useAuth();

  const track = enrolledTracks.find((enrolled) => enrolled.id === trackId);
  const isEnrolled = track !== undefined;

  // The history page's default page, so both share one cache entry.
  const attemptsQuery = useQuery({
    ...createAttemptsQueryOptions(trackId, DEFAULT_ATTEMPT_PAGE, user?.id),
    enabled: isEnrolled,
  });

  const { openAttempt, reviseAttempt, isBusy } = useAttemptActions();

  const attempts = attemptsQuery.data?.attempts ?? [];
  const recentAttempts = attempts.slice(0, RECENT_ATTEMPT_COUNT);
  // History is newest first, so this is the most recently started unfinished exam.
  const unfinishedAttempt = attempts.find(isInProgress);

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
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <BackButton to={ROUTES.home} text={translate("tracks.back")} />

      <TrackHero
        title={track.name[langCode]}
        description={track.description?.[langCode]}
        expiresAt={track.expiresAt}
        langCode={langCode}
        headingLevel="h1"
        columns={2}
      >
        <TrackCatalogShortcuts trackId={trackId} />
      </TrackHero>

      {unfinishedAttempt && (
        <div className="mt-6">
          <ContinueAttemptCard
            attempt={unfinishedAttempt}
            langCode={langCode}
            onContinue={openAttempt}
            disabled={isBusy}
          />
        </div>
      )}

      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-bold text-tertiary md:text-xl">
            {translate("history.recent")}
          </h2>

          {recentAttempts.length > 0 && (
            <Link
              to={ROUTES.trackHistory.to(trackId)}
              className="shrink-0 rounded-md text-sm font-semibold text-secondary underline-offset-4 outline-none transition-colors duration-150 hover:text-secondary-hover hover:underline focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
            >
              {translate("history.view-all")}
            </Link>
          )}
        </div>

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
          <AttemptsTable
            attempts={recentAttempts}
            langCode={langCode}
            disabled={isBusy}
            onOpen={openAttempt}
            onRevise={reviseAttempt}
          />
        )}
      </section>
    </div>
  );
};

export default TrackPage;
