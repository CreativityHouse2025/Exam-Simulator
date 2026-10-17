import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CategoryGrid,
  TrackLockedState,
  createTrackTagsQueryOptions,
} from "@/features/tracks";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/features/auth";
import useSettings from "@/core/hooks/useSettings";
import { translate } from "@/core/utils/translation";
import { ROUTES } from "@/routes/routes";
import { FULL_TAG_CODE } from "@shared/exam.schema";

/** `/tracks/:trackId/library/by-category` — a track's categories, for a supervisor. */
const LibraryCategoriesPage: React.FC = () => {
  const { trackId = "" } = useParams();
  const { settings } = useSettings();
  const langCode = settings.language;
  const { user, enrolledTracks } = useAuth();

  const track = enrolledTracks.find((enrolled) => enrolled.id === trackId);
  const isEnrolled = track !== undefined;

  const tagsQuery = useQuery({
    ...createTrackTagsQueryOptions(trackId, user?.id),
    enabled: isEnrolled,
  });

  // The tags endpoint also returns `full`, which is listed on its own page, not as a category.
  const categories = (tagsQuery.data ?? []).filter(
    (tag) => tag.code !== FULL_TAG_CODE,
  );

  const backTo = ROUTES.examLibrary.to(trackId);
  const backText = translate("catalog.back-to-track");

  if (!isEnrolled) {
    return (
      <TrackLockedState
        backTo={ROUTES.exams}
        backText={translate("exam.tracks.back")}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <BackButton to={backTo} text={backText} />

      <header className="mb-6">
        <p className="text-sm font-semibold text-grey-1000">
          {track.name[langCode]}
        </p>
        <h1 className="text-2xl font-bold text-tertiary md:text-3xl">
          {translate("catalog.categories.title")}
        </h1>
      </header>

      <CategoryGrid
        categories={categories}
        langCode={langCode}
        toCategory={(tagCode) => ROUTES.libraryExams.to(trackId, tagCode)}
        isPending={tagsQuery.isPending}
        isError={tagsQuery.isError}
        onRetry={tagsQuery.refetch}
        isRetrying={tagsQuery.isFetching}
      />
    </div>
  );
};

export default LibraryCategoriesPage;
