import React from "react";
import { ClipboardList, LayoutGrid } from "lucide-react";
import TileMarker from "./TileMarker";

const ICON_CLASSES = "size-5";
const ICON_STROKE = 1.8;

/** Full exams: gold, as on the track hub's catalog cards. */
export const FullExamsMarker: React.FC = () => (
  <TileMarker toneClassName="bg-primary/15 text-primary">
    <ClipboardList className={ICON_CLASSES} strokeWidth={ICON_STROKE} />
  </TileMarker>
);

/** Categories: plum, as on the track hub's catalog cards. */
export const CategoriesMarker: React.FC = () => (
  <TileMarker toneClassName="bg-grey-100 text-secondary">
    <LayoutGrid className={ICON_CLASSES} strokeWidth={ICON_STROKE} />
  </TileMarker>
);
