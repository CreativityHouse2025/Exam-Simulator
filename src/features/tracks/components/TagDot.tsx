import React from "react";
import { cn } from "@/components/ui/utils";
import { tagAccent } from "@/features/exams";

type TagDotProps = {
  colorHexCode: string | null;
};

/** A category's colour as a small dot, edged so even a pale admin-picked colour stays visible. */
const TagDot: React.FC<TagDotProps> = ({ colorHexCode }) => {
  const accent = tagAccent(colorHexCode);

  return (
    <span
      aria-hidden
      style={accent.style}
      className={cn(
        "size-3 shrink-0 rounded-full ring-1 ring-black/10",
        accent.rail,
      )}
    />
  );
};

export default TagDot;
