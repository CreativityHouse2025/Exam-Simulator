import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import ExamCard from "./ExamCard";
import ExamBrowser from "@/components/exams/ExamBrowser";
import EmptyState from "@/components/states/EmptyState";
import BackButton from "@/components/BackButton";
import useAuth from "@/hooks/useAuth";
import useSettings from "@/hooks/useSettings";
import { createTrackExamsQueryOptions } from "@/utils/queryOptions";
import { translate } from "@/utils/translation";
import { ROUTES } from "@/config/routes";

/**
 * `/exams/:trackId` — every exam in one track, for a supervisor.
 *
 * The page holds no filtering logic of its own: it fetches the track's exams and hands them to
 * `ExamBrowser`, which is also what the student's track page uses. All this page decides is what
 * a single card offers.
 */
const ExamLibraryPage: React.FC = () => {
  const { trackId = "" } = useParams();
  const { settings } = useSettings();
  const langCode = settings.language;
  const { enrolledTracks } = useAuth();

  const track = enrolledTracks.find((enrolled) => enrolled.id === trackId);
  const isEnrolled = track !== undefined;

  const examsQuery = useQuery({
    ...createTrackExamsQueryOptions(trackId),
    enabled: isEnrolled,
  });

  // Enrollment gates the whole page; `/api/tracks/:trackId/exams` would answer 403 anyway.
  if (!isEnrolled) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <BackButton to={ROUTES.exams} text={translate("exam.tracks.back")} />
        <EmptyState
          icon={Lock}
          message={translate("tracks.locked")}
          hint={translate("tracks.locked-hint")}
          className="mt-6"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <BackButton to={ROUTES.exams} text={translate("exam.tracks.back")} />

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-tertiary md:text-3xl">
          {track.name[langCode]}
        </h1>
        <p className="mt-1.5 text-sm text-grey-800">
          {translate("exam.library.subtitle")}
        </p>
      </header>

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
            trackId={trackId}
            langCode={langCode}
          />
        )}
      />
    </div>
  );
};

export default ExamLibraryPage;
