import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Layers, Lock } from "lucide-react";
import {
  EnrolledTrackPanel,
  EnrolledTrackPanelSkeleton,
  LockedTrackRow,
  createTracksQueryOptions,
  mergeTrackAccess,
} from "@/features/tracks";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import { useAuth } from "@/features/auth";
import useSettings from "@/core/hooks/useSettings";
import { translate } from "@/core/utils/translation";

/** `/` for students — each enrolled track with direct ways into practice, then the tracks they can't open yet. */
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
  } = useQuery(createTracksQueryOptions(user?.id));

  const tracks = React.useMemo(
    () => mergeTrackAccess(catalogue ?? [], enrolledTracks),
    [catalogue, enrolledTracks],
  );
  const enrolled = tracks.filter((track) => track.enrolled);
  const locked = tracks.filter((track) => !track.enrolled);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:py-10">
      <header className="mb-6">
        <h1 className="text-lg font-semibold text-tertiary md:text-xl">
          {translate("tracks.welcome", [user?.firstName ?? ""])}
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-grey-1000">
          {translate("tracks.lead")}
        </p>
      </header>

      {isPending ? (
        <EnrolledTrackPanelSkeleton />
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
        <>
          {enrolled.length === 0 ? (
            <EmptyState
              icon={Lock}
              message={translate("tracks.none-enrolled")}
              hint={translate("tracks.locked-hint")}
            />
          ) : (
            <div className="flex flex-col gap-5">
              {enrolled.map((track) => (
                <EnrolledTrackPanel
                  key={track.id}
                  track={track}
                  langCode={langCode}
                />
              ))}
            </div>
          )}

          {locked.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-3 text-base font-bold text-tertiary">
                {translate("tracks.other")}
              </h2>
              <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {locked.map((track) => (
                  <LockedTrackRow
                    key={track.id}
                    track={track}
                    langCode={langCode}
                  />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default TracksPage;
