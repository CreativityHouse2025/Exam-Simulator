import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/components/ui/utils";
import type { Tag } from "@/core/api/apiTypes";
import type { LangCode } from "@/core/types";
import TagDot from "./TagDot";
import { TILE_SURFACE } from "./TileStyles";

type CategoryTileProps = {
  category: Tag;
  langCode: LangCode;
  to: string;
};

/**
 * One category as a row: its colour as a small marker, then its name. The name leads — the colour
 * only tells categories apart, so legibility never depends on it.
 */
const CategoryTile: React.FC<CategoryTileProps> = ({
  category,
  langCode,
  to,
}) => (
  <Link
    to={to}
    className={cn(TILE_SURFACE, "flex min-h-14 items-center gap-3 px-4 py-3")}
  >
    <TagDot colorHexCode={category.colorHexCode} />

    <span className="min-w-0 flex-1 font-bold text-tertiary">
      {category.name[langCode]}
    </span>

    <ChevronRight
      aria-hidden
      className="size-4 shrink-0 text-grey-1000 transition-transform duration-200 rtl:rotate-180 motion-safe:group-hover:translate-x-0.5 motion-safe:rtl:group-hover:-translate-x-0.5"
    />
  </Link>
);

export default CategoryTile;
