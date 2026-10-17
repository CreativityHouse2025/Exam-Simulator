import React from "react";
import { ROUTES } from "@/routes/routes";
import { translate } from "@/core/utils/translation";
import { FULL_TAG_CODE } from "@shared/exam.schema";
import { CategoriesMarker, FullExamsMarker } from "./CatalogMarkers";
import TrackShortcut from "./TrackShortcut";

type TrackCatalogShortcutsProps = {
  trackId: string;
};

/** A student's two ways into a track's exams — full exams or by category — as hero tiles. */
const TrackCatalogShortcuts: React.FC<TrackCatalogShortcutsProps> = ({
  trackId,
}) => (
  <>
    <TrackShortcut
      marker={<FullExamsMarker />}
      title={translate("catalog.full.title")}
      description={translate("catalog.full.description")}
      to={ROUTES.trackExams.to(trackId, FULL_TAG_CODE)}
    />
    <TrackShortcut
      marker={<CategoriesMarker />}
      title={translate("catalog.categories.title")}
      description={translate("catalog.categories.description")}
      to={ROUTES.trackCategories.to(trackId)}
    />
  </>
);

export default TrackCatalogShortcuts;
