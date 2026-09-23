import React from "react";
import { Layers } from "lucide-react";
import TrackLinkCard, {
  TRACK_GRID_CLASSES,
} from "@/components/tracks/TrackLinkCard";
import EmptyState from "@/components/states/EmptyState";
import BackButton from "@/components/BackButton";
import useAuth from "@/hooks/useAuth";
import useSettings from "@/hooks/useSettings";
import { translate } from "@/utils/translation";
import { ROUTES } from "@/config/routes";

/**
 * `/exams` — pick the track whose exam library to open.
 *
 * Lists the supervisor's own active enrollments only: every exam endpoint behind this page is
 * guarded by `assertTrackAccess`, so a track they do not hold would lead nowhere. The list is
 * already in AuthContext, which is why this page fetches nothing and cannot fail.
 */
const ExamTracksPage: React.FC = () => {
  const { enrolledTracks } = useAuth();
  const { settings } = useSettings();
  const langCode = settings.language;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <BackButton to={ROUTES.home} text={translate("exam.library.back")} />

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-tertiary md:text-3xl">
          {translate("exam.tracks.title")}
        </h1>
        <p className="mt-1.5 text-sm text-grey-800">
          {translate("exam.tracks.subtitle")}
        </p>
      </header>

      {enrolledTracks.length === 0 ? (
        <EmptyState
          icon={Layers}
          message={translate("exam.tracks.empty")}
          hint={translate("tracks.locked-hint")}
        />
      ) : (
        <div className={TRACK_GRID_CLASSES}>
          {enrolledTracks.map((track) => (
            <TrackLinkCard
              key={track.id}
              track={track}
              to={ROUTES.examLibrary.to(track.id)}
              langCode={langCode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamTracksPage;
