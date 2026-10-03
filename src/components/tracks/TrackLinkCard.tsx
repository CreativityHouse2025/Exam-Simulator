import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock } from "lucide-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/utils/format";
import { translate } from "@/utils/translation";
import type { EnrolledTrack } from "@/apiTypes";
import type { LangCode } from "@/types";

/** Shared grid rhythm for every track picker, so the two supervisor pickers stay in step. */
export const TRACK_GRID_CLASSES =
  "grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3";

type TrackLinkCardProps = {
  track: EnrolledTrack;
  /** Where this card leads — the exam library for one picker, a student's attempts for the other. */
  to: string;
  langCode: LangCode;
  /** Replaces the enrollment-expiry footer, e.g. "Enrolled until …" phrased about someone else. */
  footnote?: string;
  /** Router state carried through the link — the search query the next page's breadcrumb restores. */
  state?: Record<string, unknown>;
};

/**
 * One always-openable track. Supervisor pickers list only tracks the supervisor can actually
 * open, so unlike the student's TrackCard there is no locked variant to style for.
 *
 * The plum rail is the supervisor accent throughout; gold stays reserved for primary actions.
 */
const TrackLinkCard: React.FC<TrackLinkCardProps> = ({
  track,
  to,
  langCode,
  footnote,
  state,
}) => (
  <Link
    to={to}
    state={state}
    className="no-select h-full"
    aria-label={track.name[langCode]}
  >
    <Card className="group h-full gap-5 overflow-hidden border-grey-200 pt-0 pb-4 transition-colors duration-200 hover:border-secondary hover:bg-grey-50">
      <div className="h-1.5 w-full bg-secondary" />

      <CardHeader className="gap-2">
        <CardTitle className="text-lg font-bold text-tertiary">
          {track.name[langCode]}
        </CardTitle>

        {track.description && (
          <CardDescription className="text-sm leading-relaxed text-grey-800">
            {track.description[langCode]}
          </CardDescription>
        )}
      </CardHeader>

      <CardFooter className="mt-auto justify-between gap-2 border-t border-grey-100 pt-2.5 text-xs">
        <span className="flex items-center gap-1.5 text-grey-700">
          <CalendarClock className="size-3.5 text-secondary" />
          {footnote ??
            translate("tracks.expires", [formatDate(track.expiresAt)])}
        </span>

        <ArrowRight className="size-4 shrink-0 text-secondary transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180" />
      </CardFooter>
    </Card>
  </Link>
);

export default TrackLinkCard;
