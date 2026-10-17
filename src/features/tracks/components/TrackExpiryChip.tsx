import React from "react";
import { CalendarClock } from "lucide-react";
import { translate } from "@/core/utils/translation";
import { cn } from "@/components/ui/utils";
import type { LangCode } from "@/core/types";
import {
  EXPIRY_WARNING_DAYS,
  daysUntil,
  formatDaysFromNow,
} from "../utils/expiry";

type TrackExpiryChipProps = {
  expiresAt: string;
  langCode: LangCode;
};

/** Countdown to when access ends, on the panel's plum band — quiet normally, amber once the end is close. */
const TrackExpiryChip: React.FC<TrackExpiryChipProps> = ({
  expiresAt,
  langCode,
}) => {
  const days = daysUntil(expiresAt);
  const isEnding = days <= EXPIRY_WARNING_DAYS;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 self-start rounded-full px-3 py-1 text-xs",
        isEnding
          ? "bg-warning-bg font-semibold text-warning"
          : "bg-white/10 text-white ring-1 ring-white/25 backdrop-blur-md",
      )}
    >
      <CalendarClock aria-hidden className="size-3.5" />
      {translate("tracks.ends", [formatDaysFromNow(days, langCode)])}
    </span>
  );
};

export default TrackExpiryChip;
