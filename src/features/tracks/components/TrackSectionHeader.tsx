import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

type TrackSectionHeaderProps = {
  /** Null while the title is still loading — a placeholder holds the heading's exact line. */
  title: string | null;
  description?: string;
};

/**
 * Header for the pages one level inside a track — full exams and categories. A soft plum panel:
 * lighter than the track's own band, so depth reads as moving inward.
 */
const TrackSectionHeader: React.FC<TrackSectionHeaderProps> = ({
  title,
  description,
}) => (
  <header className="rounded-2xl border border-secondary/15 bg-secondary/5 px-5 py-5 md:px-8 md:py-7">
    {title === null ? (
      // Sized to the heading's line box (text-2xl/3xl at leading-tight); tinted to show on the panel.
      <Skeleton className="h-7.5 w-56 max-w-full bg-secondary/10 md:h-9.5" />
    ) : (
      <h1 className="text-2xl leading-tight font-bold tracking-tight text-tertiary md:text-3xl rtl:tracking-normal">
        {title}
      </h1>
    )}
    {description && (
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-grey-1000 md:text-base">
        {description}
      </p>
    )}
  </header>
);

export default TrackSectionHeader;
