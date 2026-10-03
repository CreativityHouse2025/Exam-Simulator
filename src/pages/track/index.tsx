import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, History, Lock } from "lucide-react";
import ExamCard from "./ExamCard";
import ExamBrowser from "@/components/exams/ExamBrowser";
import AttemptsTable from "@/components/attempts/AttemptsTable";
import AttemptsTableSkeleton from "@/components/attempts/AttemptsTableSkeleton";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import BackButton from "@/components/BackButton";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import useAuth from "@/hooks/useAuth";
import useSettings from "@/hooks/useSettings";
import useAttemptActions from "@/hooks/useAttemptActions";
import {
  createAttemptsQueryOptions,
  createTrackExamsQueryOptions,
} from "@/utils/queryOptions";
import { statsByExamId, statsForExam } from "@/utils/attempts";
import { translate } from "@/utils/translation";
import { ROUTES } from "@/config/routes";
import { cn } from "@/components/ui/utils";

const RECENT_ATTEMPT_COUNT = 5;

/** One track: its exams first, then the student's most recent attempts in it. */
const TrackPage: React.FC = () => {
  const { trackId = "" } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const langCode = settings.language;
  const { enrolledTracks } = useAuth();

  const [examsCollapsed, setExamsCollapsed] = React.useState(false);

  const track = enrolledTracks.find((enrolled) => enrolled.id === trackId);
  const isEnrolled = track !== undefined;

  const examsQuery = useQuery({
    ...createTrackExamsQueryOptions(trackId),
    enabled: isEnrolled,
  });
  const attemptsQuery = useQuery({
    ...createAttemptsQueryOptions(trackId),
    enabled: isEnrolled,
  });

  const { startExam, openAttempt, reviseAttempt, isBusy } = useAttemptActions();

  const attemptStats = React.useMemo(
    () => statsByExamId(attemptsQuery.data ?? []),
    [attemptsQuery.data],
  );

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

  const attempts = attemptsQuery.data ?? [];
  const recentAttempts = attempts.slice(0, RECENT_ATTEMPT_COUNT);

  // Enrollment is the gate for everything below; the API would answer 403 anyway.
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
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-tertiary md:text-xl">
            {translate("exams.title")}
          </h2>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExamsCollapsed((prev) => !prev)}
            aria-expanded={!examsCollapsed}
            className="gap-1.5 text-xs font-semibold text-grey-950 hover:text-primary"
          >
            {translate(
              `exams.${examsCollapsed ? "show-section" : "hide-section"}`,
            )}
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-200",
                examsCollapsed && "-rotate-90 rtl:rotate-90",
              )}
            />
          </Button>
        </div>

        {!examsCollapsed && (
          <ExamBrowser
            exams={examsQuery.data?.exams ?? []}
            types={examsQuery.data?.types ?? []}
            langCode={langCode}
            isPending={examsQuery.isPending}
            isError={examsQuery.isError}
            errorMessage={translate("exams.errors.fetch")}
            onRetry={examsQuery.refetch}
            isRetrying={examsQuery.isFetching}
            emptyMessage={translate("exams.empty")}
            renderCard={(exam, examType) => (
              <ExamCard
                exam={exam}
                examType={examType}
                stats={statsForExam(attemptStats, exam.id)}
                langCode={langCode}
                disabled={isBusy}
                onStart={() => startExam(exam.id)}
                onViewAttempts={() => navigate(ROUTES.trackHistory.to(trackId))}
              />
            )}
          />
        )}
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
              examNameById={examNameById}
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
