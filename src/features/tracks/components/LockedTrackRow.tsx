import React from "react";
import { Lock } from "lucide-react";
import { translate } from "@/core/utils/translation";
import type { LangCode } from "@/core/types";
import type { TrackAccess } from "../utils/tracks";

type LockedTrackRowProps = {
  track: TrackAccess;
  langCode: LangCode;
};

/** A catalogue track the student can't open yet — quiet, inert, and says how to get access. */
const LockedTrackRow: React.FC<LockedTrackRowProps> = ({ track, langCode }) => (
  <li className="flex items-start gap-3 rounded-xl border border-dashed border-grey-300 bg-grey-50 px-4 py-3.5">
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-grey-200">
      <Lock aria-hidden className="size-4 text-grey-1000" />
    </span>

    <span className="min-w-0 flex-1">
      <span className="block font-semibold text-grey-1000">
        {track.name[langCode]}
      </span>
      {track.description && (
        <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-grey-1000">
          {track.description[langCode]}
        </span>
      )}
      <span className="mt-1.5 block text-xs font-semibold text-secondary">
        {translate("tracks.locked-hint")}
      </span>
    </span>
  </li>
);

export default LockedTrackRow;
