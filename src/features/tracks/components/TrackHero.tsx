import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/utils";
import type { LangCode } from "@/core/types";
import TrackExpiryChip from "./TrackExpiryChip";
import TrackPanelTexture from "./TrackPanelTexture";

type TrackHeroProps = {
  title: string;
  description?: string;
  /** Shows the access countdown chip when set. */
  expiresAt?: string | null;
  langCode: LangCode;
  /** `h1` where the track is the page's subject, `h2` where it is one of several on the page. */
  headingLevel: "h1" | "h2";
  /** The shortcut tiles, laid out on the band's lower edge. */
  children: React.ReactNode;
  columns: 2 | 3;
  footer?: React.ReactNode;
};

const COLUMN_CLASSES = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3" } as const;

/**
 * A track's identity band — plum gradient, texture, title and access countdown — with its
 * shortcut tiles overlapping the band's lower edge. Shared by the dashboard and the track hub.
 */
const TrackHero: React.FC<TrackHeroProps> = ({
  title,
  description,
  expiresAt,
  langCode,
  headingLevel: Heading,
  children,
  columns,
  footer,
}) => (
  <Card className="gap-0 overflow-hidden border-grey-200 py-0 shadow-1">
    {/* The band runs past the title so the shortcuts below can overlap its lower edge. */}
    <div className="relative isolate bg-linear-to-br from-secondary to-tertiary px-5 pt-6 pb-14 md:px-8 md:pt-8 md:pb-16">
      <TrackPanelTexture />

      <div className="relative flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
        <div className="min-w-0">
          <Heading className="text-2xl leading-tight font-bold tracking-tight text-white md:text-4xl rtl:tracking-normal">
            {title}
          </Heading>
          {description && (
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-white/80 md:text-base">
              {description}
            </p>
          )}
        </div>

        {expiresAt && (
          <TrackExpiryChip expiresAt={expiresAt} langCode={langCode} />
        )}
      </div>
    </div>

    <nav
      aria-label={title}
      className={cn(
        "relative -mt-9 grid grid-cols-1 gap-2 px-5 sm:gap-3 md:-mt-10 md:px-8",
        COLUMN_CLASSES[columns],
        !footer && "pb-5 md:pb-8",
      )}
    >
      {children}
    </nav>

    {footer && (
      <div className="flex justify-end px-5 py-4 md:px-8">{footer}</div>
    )}
  </Card>
);

export default TrackHero;
