import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CategoryGrid,
  TrackLockedState,
  TrackSectionHeader,
  createTrackTagsQueryOptions,
} from "@/features/tracks";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/features/auth";
import useSettings from "@/core/hooks/useSettings";
import { translate } from "@/core/utils/translation";
import { ROUTES } from "@/routes/routes";
import { FULL_TAG_CODE } from "@shared/exam.schema";

/** `/tracks/:trackId/by-category` — a track's categories, each leading to its exams. */
const TrackCategoriesPage: React.FC = () => {
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

  const backTo = ROUTES.track.to(trackId);
  const backText = translate("catalog.back-to-track");

  if (!isEnrolled) {
    return (
      <TrackLockedState
        backTo={ROUTES.home}
        backText={translate("tracks.back")}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <BackButton to={backTo} text={backText} />

      <div className="mb-6">
        <TrackSectionHeader
          title={translate("catalog.categories.title")}
          description={translate("catalog.categories.lead", [
            track.name[langCode],
          ])}
        />
      </div>

      <CategoryGrid
        categories={categories}
        langCode={langCode}
        toCategory={(tagCode) => ROUTES.trackExams.to(trackId, tagCode)}
        isPending={tagsQuery.isPending}
        isError={tagsQuery.isError}
        onRetry={tagsQuery.refetch}
        isRetrying={tagsQuery.isFetching}
      />
    </div>
  );
};

export default TrackCategoriesPage;
