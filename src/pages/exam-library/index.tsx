import React from "react";
import { useParams } from "react-router-dom";
import { CatalogEntryCards, TrackLockedState } from "@/features/tracks";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/features/auth";
import useSettings from "@/core/hooks/useSettings";
import { translate } from "@/core/utils/translation";
import { ROUTES } from "@/routes/routes";
import { FULL_TAG_CODE } from "@shared/exam.schema";

/** `/tracks/:trackId/library` — a supervisor's way into one track's exams: full or by category. */
const ExamLibraryPage: React.FC = () => {
  const { trackId = "" } = useParams();
  const { settings } = useSettings();
  const langCode = settings.language;
  const { enrolledTracks } = useAuth();

  const track = enrolledTracks.find((enrolled) => enrolled.id === trackId);

  const backText = translate("exam.tracks.back");

  // Enrollment gates the whole library; every endpoint behind it would answer 403 anyway.
  if (!track) {
    return <TrackLockedState backTo={ROUTES.exams} backText={backText} />;
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <BackButton to={ROUTES.exams} text={backText} />

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-tertiary md:text-3xl">
          {track.name[langCode]}
        </h1>
        <p className="mt-1.5 text-sm text-grey-1000">
          {translate("exam.library.subtitle")}
        </p>
      </header>

      <CatalogEntryCards
        fullExamsTo={ROUTES.libraryExams.to(trackId, FULL_TAG_CODE)}
        categoriesTo={ROUTES.libraryCategories.to(trackId)}
      />
    </div>
  );
};

export default ExamLibraryPage;
