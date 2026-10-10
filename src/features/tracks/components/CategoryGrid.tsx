import React from "react";
import { Folder, LayoutGrid } from "lucide-react";
import ActionCard from "@/components/ActionCard";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import TrackCardSkeleton from "./TrackCardSkeleton";
import { TRACK_GRID_CLASSES } from "./TrackLinkCard";
import { tagAccent } from "@/features/exams";
import { translate } from "@/core/utils/translation";
import type { Tag } from "@/core/api/apiTypes";
import type { LangCode } from "@/core/types";

type CategoryGridProps = {
  categories: Tag[];
  langCode: LangCode;
  /** Where a category's card leads — the student or the supervisor exam list. */
  toCategory: (tagCode: string) => string;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  isRetrying?: boolean;
};

const SKELETON_COUNT = 3;

/** One card per category, in the track's order, with the loading / error / empty states. */
const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  langCode,
  toCategory,
  isPending,
  isError,
  onRetry,
  isRetrying = false,
}) => {
  if (isPending) {
    return (
      <div className={TRACK_GRID_CLASSES}>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <TrackCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message={translate("catalog.categories.errors.fetch")}
        onRetry={onRetry}
        isRetrying={isRetrying}
      />
    );
  }

  if (categories.length === 0) {
    return (
      <EmptyState
        icon={LayoutGrid}
        message={translate("catalog.categories.empty")}
      />
    );
  }

  return (
    <div className={TRACK_GRID_CLASSES}>
      {categories.map((tag) => (
        <ActionCard
          key={tag.id}
          icon={Folder}
          title={tag.name[langCode]}
          to={toCategory(tag.code)}
          accent={tagAccent(tag.colorHexCode)}
        />
      ))}
    </div>
  );
};

export default CategoryGrid;
