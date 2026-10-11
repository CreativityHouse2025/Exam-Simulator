import React from "react";
import { cn } from "@/components/ui/utils";

type TileMarkerProps = {
  /** Background tint and icon colour — gold for full exams, plum for categories, as on the hub. */
  toneClassName: string;
  children: React.ReactNode;
};

/** The rounded square that marks a destination on its shortcut tile. */
const TileMarker: React.FC<TileMarkerProps> = ({ toneClassName, children }) => (
  <span
    aria-hidden
    className={cn(
      "flex size-10 shrink-0 items-center justify-center rounded-lg",
      toneClassName,
    )}
  >
    {children}
  </span>
);

export default TileMarker;
