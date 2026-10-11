import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { TILE_SURFACE } from "./TileStyles";

type TrackShortcutProps = {
  /** The destination's marker square. */
  marker: React.ReactNode;
  title: string;
  description: string;
  to: string;
};

/**
 * One direct way into a track's content. A list row with a chevron on phones, a tile from `sm` up.
 */
const TrackShortcut: React.FC<TrackShortcutProps> = ({
  marker,
  title,
  description,
  to,
}) => (
  <Link
    to={to}
    className={cn(
      TILE_SURFACE,
      "flex items-center gap-3 p-3.5 sm:flex-col sm:items-start sm:p-4",
    )}
  >
    {marker}

    <span className="min-w-0 flex-1">
      <span className="block text-sm font-bold text-tertiary">{title}</span>
      <span className="mt-0.5 block text-xs leading-relaxed text-grey-1000">
        {description}
      </span>
    </span>

    <ChevronRight
      aria-hidden
      className="size-4 shrink-0 text-grey-1000 sm:hidden rtl:rotate-180"
    />
  </Link>
);

export default TrackShortcut;
