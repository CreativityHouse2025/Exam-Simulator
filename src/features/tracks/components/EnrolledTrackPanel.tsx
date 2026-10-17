import React from "react";
import { Link } from "react-router-dom";
import { History } from "lucide-react";
import { ROUTES } from "@/routes/routes";
import { translate } from "@/core/utils/translation";
import type { LangCode } from "@/core/types";
import type { TrackAccess } from "../utils/tracks";
import TrackCatalogShortcuts from "./TrackCatalogShortcuts";
import TrackHero from "./TrackHero";
import TileMarker from "./TileMarker";
import TrackShortcut from "./TrackShortcut";

type EnrolledTrackPanelProps = {
  track: TrackAccess;
  langCode: LangCode;
};

/**
 * A track the student can open, with its three destinations one tap away — full exams,
 * categories and attempt history — so the dashboard leads straight into practice. The track hub
 * stays reachable through the overview link.
 */
const EnrolledTrackPanel: React.FC<EnrolledTrackPanelProps> = ({
  track,
  langCode,
}) => (
  <TrackHero
    title={track.name[langCode]}
    description={track.description?.[langCode]}
    expiresAt={track.expiresAt}
    langCode={langCode}
    headingLevel="h2"
    columns={3}
    footer={
      <Link
        to={ROUTES.track.to(track.id)}
        className="rounded-md text-sm font-semibold text-secondary underline-offset-4 outline-none transition-colors duration-150 hover:text-secondary-hover hover:underline focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
      >
        {translate("tracks.overview")}
      </Link>
    }
  >
    <TrackCatalogShortcuts trackId={track.id} />
    <TrackShortcut
      marker={
        <TileMarker toneClassName="bg-quatro text-tertiary">
          <History className="size-5" strokeWidth={1.8} />
        </TileMarker>
      }
      title={translate("tracks.history.title")}
      description={translate("tracks.history.description")}
      to={ROUTES.trackHistory.to(track.id)}
    />
  </TrackHero>
);

export default EnrolledTrackPanel;
