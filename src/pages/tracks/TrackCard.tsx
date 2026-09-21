import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/config/routes";
import { formatDate } from "@/utils/format";
import { translate } from "@/utils/translation";
import { cn } from "@/components/ui/utils";
import type { LangCode } from "@/types";
import type { TrackAccess } from "@/utils/tracks";

type TrackCardProps = {
  track: TrackAccess;
  langCode: LangCode;
};

const CARD_BASE =
  "group relative h-full gap-5 overflow-hidden border-grey-200 pt-0 pb-4 transition-all duration-300";

/** One track in the dashboard grid. Enrolled tracks link into the track page; the rest are inert and muted. */
const TrackCard: React.FC<TrackCardProps> = ({ track, langCode }) => {
  const body = (
    <Card
      className={cn(
        CARD_BASE,
        track.enrolled
          ? "cursor-pointer hover:border-primary hover:bg-grey-50"
          : "cursor-default border-dashed bg-grey-50 opacity-70",
      )}
    >
      {/* Accent rail doubles as the enrolled/locked signal, so colour is never the only cue. */}
      <div
        className={cn(
          "h-1.5 w-full",
          track.enrolled ? "bg-primary" : "bg-grey-300",
        )}
      />

      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg font-bold text-tertiary">
            {track.name[langCode]}
          </CardTitle>

          {track.enrolled ? (
            <Badge className="shrink-0 bg-primary text-white">
              {translate("tracks.badge.active")}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="shrink-0 gap-1 border-grey-300 text-grey-700"
            >
              <Lock className="size-3" />
              {translate("tracks.badge.locked")}
            </Badge>
          )}
        </div>

        {track.description && (
          <CardDescription className="text-sm leading-relaxed text-grey-800">
            {track.description[langCode]}
          </CardDescription>
        )}
      </CardHeader>

      {/* mt-auto pins the footer without an empty spacer, which the Card's own gap would pad twice. */}
      <CardFooter className="mt-auto justify-between gap-2 border-t border-grey-100 pt-2.5 text-xs">
        {track.enrolled && track.expiresAt ? (
          <span className="flex items-center gap-1.5 text-grey-700">
            <CalendarClock className="size-3.5 text-secondary" />
            {translate("tracks.expires", [formatDate(track.expiresAt)])}
          </span>
        ) : (
          <span className="text-grey-600">
            {translate("tracks.locked-hint")}
          </span>
        )}

        {track.enrolled && (
          <ArrowRight className="size-4 shrink-0 text-primary transition-transform duration-300 group-hover:translate-x-0.5 rtl:rotate-180" />
        )}
      </CardFooter>
    </Card>
  );

  if (!track.enrolled) {
    return (
      <div aria-disabled className="h-full">
        {body}
      </div>
    );
  }

  return (
    <Link
      to={ROUTES.track.to(track.id)}
      className="h-full no-select"
      aria-label={track.name[langCode]}
    >
      {body}
    </Link>
  );
};

export default TrackCard;
