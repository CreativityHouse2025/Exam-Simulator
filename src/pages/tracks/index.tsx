import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Layers } from "lucide-react";
import TrackCard from "./TrackCard";
import TrackCardSkeleton from "@/components/tracks/TrackCardSkeleton";
import WelcomeHero from "./WelcomeHero";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import useAuth from "@/hooks/useAuth";
import useSettings from "@/hooks/useSettings";
import { createTracksQueryOptions } from "@/utils/queryOptions";
import { mergeTrackAccess } from "@/utils/tracks";
import { translate } from "@/utils/translation";

const SKELETON_COUNT = 3;

const GRID_CLASSES =
  "grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3";

/** `/` for students — every track in the catalogue, with the ones they are enrolled in clickable. */
const TracksPage: React.FC = () => {
  const { settings } = useSettings();
  const langCode = settings.language;
  const { user, enrolledTracks } = useAuth();

  const {
    data: catalogue,
    isPending,
    isFetching,
    error,
    refetch,
  } = useQuery(createTracksQueryOptions());

  const tracks = React.useMemo(
    () => mergeTrackAccess(catalogue ?? [], enrolledTracks),
    [catalogue, enrolledTracks],
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <WelcomeHero
        firstName={user?.firstName ?? ""}
        latestTrack={enrolledTracks[0] ?? null}
        langCode={langCode}
      />

      <div className="mb-4">
        <h2 className="text-lg font-bold text-tertiary md:text-xl">
          {translate("tracks.title")}
        </h2>
        <p className="mt-1 text-sm text-grey-800">
          {translate("tracks.subtitle")}
        </p>
      </div>

      {isPending ? (
        <div className={GRID_CLASSES}>
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <TrackCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          message={translate("tracks.errors.fetch")}
          onRetry={refetch}
          isRetrying={isFetching}
        />
      ) : tracks.length === 0 ? (
        <EmptyState
          icon={Layers}
          message={translate("tracks.empty")}
          hint={translate("tracks.empty-hint")}
        />
      ) : (
        <div className={GRID_CLASSES}>
          {tracks.map((track) => (
            <TrackCard key={track.id} track={track} langCode={langCode} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TracksPage;
