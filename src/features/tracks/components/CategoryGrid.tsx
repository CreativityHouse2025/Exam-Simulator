import React from "react";
import { LayoutGrid } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import CategoryTile from "./CategoryTile";
import { translate } from "@/core/utils/translation";
import type { Tag } from "@/core/api/apiTypes";
import type { LangCode } from "@/core/types";

type CategoryGridProps = {
  categories: Tag[];
  langCode: LangCode;
  /** Where a category's tile leads — the student or the supervisor exam list. */
  toCategory: (tagCode: string) => string;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  isRetrying?: boolean;
};

const SKELETON_COUNT = 4;

const GRID_CLASSES = "grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3";

/** One tile per category, in the track's order, with the loading / error / empty states. */
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
      <div className={GRID_CLASSES}>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
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
    <div className={GRID_CLASSES}>
      {categories.map((tag) => (
        <CategoryTile
          key={tag.id}
          category={tag}
          langCode={langCode}
          to={toCategory(tag.code)}
        />
      ))}
    </div>
  );
};

export default CategoryGrid;
