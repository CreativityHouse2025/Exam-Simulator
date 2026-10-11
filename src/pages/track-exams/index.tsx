import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SearchX } from "lucide-react";
import { TrackExamCard, TrackLockedState } from "@/features/tracks";
import {
  ExamBrowser,
  createTrackExamsQueryOptions,
  examListTitle,
} from "@/features/exams";
import {
  createAttemptsQueryOptions,
  statsByExamId,
  statsForExam,
} from "@/features/attempts";
import EmptyState from "@/components/states/EmptyState";
import BackButton from "@/components/BackButton";
import Loading from "@/components/Loading";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth";
import useSettings from "@/core/hooks/useSettings";
import { useAttemptActions } from "@/features/exam-session";
import { translate } from "@/core/utils/translation";
import { isNotFoundError } from "@/core/errors";
import { ROUTES } from "@/routes/routes";
import { FULL_TAG_CODE } from "@shared/exam.schema";

/** `/tracks/:trackId/exams?tag=<code>` — one tag's exams, ready to start. */
const TrackExamsPage: React.FC = () => {
  const { trackId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const tagCode = searchParams.get("tag") ?? "";
  const navigate = useNavigate();
  const { settings } = useSettings();
  const langCode = settings.language;
  const { user, enrolledTracks } = useAuth();

  const track = enrolledTracks.find((enrolled) => enrolled.id === trackId);
  const isEnrolled = track !== undefined;

  const examsQuery = useQuery({
    ...createTrackExamsQueryOptions(trackId, tagCode, user?.id),
    enabled: isEnrolled && tagCode !== "",
  });
  const attemptsQuery = useQuery({
    ...createAttemptsQueryOptions(trackId, user?.id),
    enabled: isEnrolled,
  });

  const { startExam, isBusy } = useAttemptActions();

  const attemptStats = React.useMemo(
    () => statsByExamId(attemptsQuery.data ?? []),
    [attemptsQuery.data],
  );

  const exams = examsQuery.data ?? [];

  // Full exams sit directly under the track; a category sits under the categories page.
  const backTo =
    tagCode === FULL_TAG_CODE
      ? ROUTES.track.to(trackId)
      : ROUTES.trackCategories.to(trackId);
  const backText = translate(
    tagCode === FULL_TAG_CODE
      ? "catalog.back-to-track"
      : "catalog.back-to-categories",
  );

  if (!isEnrolled) {
    return (
      <TrackLockedState
        backTo={ROUTES.home}
        backText={translate("tracks.back")}
      />
    );
  }

  if (isBusy) return <Loading size={100} />;

  if (tagCode === "" || isNotFoundError(examsQuery.error)) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <BackButton to={backTo} text={backText} />
        <EmptyState
          icon={SearchX}
          message={translate("catalog.not-found")}
          hint={translate("catalog.not-found-hint")}
          className="mt-6"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <BackButton to={backTo} text={backText} />

      <header className="mb-6">
        <p className="text-sm font-semibold text-grey-800">
          {track.name[langCode]}
        </p>
        {examsQuery.isPending ? (
          <Skeleton className="mt-1 h-8 w-48" />
        ) : (
          <h1 className="text-2xl font-bold text-tertiary md:text-3xl">
            {examListTitle(exams, langCode)}
          </h1>
        )}
      </header>

      <ExamBrowser
        exams={exams}
        isPending={examsQuery.isPending}
        isError={examsQuery.isError}
        errorMessage={translate("exams.errors.fetch")}
        onRetry={examsQuery.refetch}
        isRetrying={examsQuery.isFetching}
        emptyMessage={translate("exams.empty")}
        renderCard={(exam) => (
          <TrackExamCard
            exam={exam}
            stats={statsForExam(attemptStats, exam.id)}
            langCode={langCode}
            disabled={isBusy}
            onStart={() => startExam(exam.id)}
            onViewAttempts={() => navigate(ROUTES.trackHistory.to(trackId))}
          />
        )}
      />
    </div>
  );
};

export default TrackExamsPage;
