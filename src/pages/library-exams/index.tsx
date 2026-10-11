import React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SearchX } from "lucide-react";
import { TrackLockedState } from "@/features/tracks";
import {
  ExamBrowser,
  LibraryExamCard,
  createTrackExamsQueryOptions,
} from "@/features/exams";
import EmptyState from "@/components/states/EmptyState";
import BackButton from "@/components/BackButton";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth";
import useSettings from "@/core/hooks/useSettings";
import { translate } from "@/core/utils/translation";
import { isNotFoundError } from "@/core/errors";
import { ROUTES } from "@/routes/routes";
import { FULL_TAG_CODE } from "@shared/exam.schema";

/** `/tracks/:trackId/library/exams?tag=<code>` — one tag's exams, to inspect or preview. */
const LibraryExamsPage: React.FC = () => {
  const { trackId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const tagCode = searchParams.get("tag") ?? "";
  const { settings } = useSettings();
  const langCode = settings.language;
  const { user, enrolledTracks } = useAuth();

  const track = enrolledTracks.find((enrolled) => enrolled.id === trackId);
  const isEnrolled = track !== undefined;

  const examsQuery = useQuery({
    ...createTrackExamsQueryOptions(trackId, tagCode, user?.id),
    enabled: isEnrolled && tagCode !== "",
  });

  const exams = examsQuery.data?.exams ?? [];

  // Full exams sit directly under the library; a category sits under the categories page.
  const backTo =
    tagCode === FULL_TAG_CODE
      ? ROUTES.examLibrary.to(trackId)
      : ROUTES.libraryCategories.to(trackId);
  const backText = translate(
    tagCode === FULL_TAG_CODE
      ? "catalog.back-to-track"
      : "catalog.back-to-categories",
  );

  if (!isEnrolled) {
    return (
      <TrackLockedState
        backTo={ROUTES.exams}
        backText={translate("exam.tracks.back")}
      />
    );
  }

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
        {examsQuery.data ? (
          <h1 className="text-2xl font-bold text-tertiary md:text-3xl">
            {examsQuery.data.tag.name[langCode]}
          </h1>
        ) : (
          <Skeleton className="mt-1 h-8 w-48" />
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
          <LibraryExamCard exam={exam} trackId={trackId} langCode={langCode} />
        )}
      />
    </div>
  );
};

export default LibraryExamsPage;
