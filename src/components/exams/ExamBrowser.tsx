import React from "react";
import { ChevronDown, FileQuestion, SearchX } from "lucide-react";
import ExamCardSkeleton from "./ExamCardSkeleton";
import ExamFilters from "./ExamFilters";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import { Button } from "@/components/ui/button";
import { translate } from "@/utils/translation";
import { cn } from "@/components/ui/utils";
import type { ExamDetails, ExamType } from "@/apiTypes";
import type { LangCode } from "@/types";

type ExamBrowserProps = {
  exams: ExamDetails[];
  types: ExamType[];
  langCode: LangCode;
  /** Renders one exam. The browser owns filtering and the four states; the caller owns the card. */
  renderCard: (
    exam: ExamDetails,
    examType: ExamType | undefined,
  ) => React.ReactNode;
  isPending: boolean;
  isError: boolean;
  errorMessage: string;
  onRetry: () => void;
  isRetrying?: boolean;
  emptyMessage: string;
  emptyHint?: string;
  pageSize?: number;
  skeletonCount?: number;
};

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SKELETON_COUNT = 3;
const ALL_TYPES = "all";

/**
 * The exam list every reader of `/api/tracks/:trackId/exams` shares: search, type filter, capped
 * list with a show-more, and the loading / error / empty / no-results states.
 *
 * It knows nothing about who is reading or what an exam does — the caller supplies the card, so
 * a student's "Start" and a supervisor's "View questions" never meet inside a variant prop.
 */
const ExamBrowser: React.FC<ExamBrowserProps> = ({
  exams,
  types,
  langCode,
  renderCard,
  isPending,
  isError,
  errorMessage,
  onRetry,
  isRetrying = false,
  emptyMessage,
  emptyHint,
  pageSize = DEFAULT_PAGE_SIZE,
  skeletonCount = DEFAULT_SKELETON_COUNT,
}) => {
  const [typeFilter, setTypeFilter] = React.useState<string>(ALL_TYPES);
  const [search, setSearch] = React.useState("");
  const [showAll, setShowAll] = React.useState(false);

  const typeById = React.useMemo(
    () => new Map(types.map((examType) => [examType.id, examType])),
    [types],
  );

  const visibleExams = React.useMemo(() => {
    const byType =
      typeFilter === ALL_TYPES
        ? exams
        : exams.filter((exam) => String(exam.typeId) === typeFilter);
    const query = search.trim().toLowerCase();
    return query
      ? byType.filter((exam) =>
          exam.name[langCode].toLowerCase().includes(query),
        )
      : byType;
  }, [exams, typeFilter, search, langCode]);

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: skeletonCount }, (_, i) => (
          <ExamCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message={errorMessage}
        onRetry={onRetry}
        isRetrying={isRetrying}
      />
    );
  }

  if (exams.length === 0) {
    return (
      <EmptyState icon={FileQuestion} message={emptyMessage} hint={emptyHint} />
    );
  }

  const shownExams = showAll ? visibleExams : visibleExams.slice(0, pageSize);
  const hiddenCount = visibleExams.length - shownExams.length;

  return (
    <>
      <ExamFilters
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        types={types}
        langCode={langCode}
      />

      {visibleExams.length === 0 ? (
        <EmptyState
          icon={SearchX}
          message={translate("exams.no-results")}
          hint={translate("exams.no-results-hint")}
        />
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {shownExams.map((exam) => (
              <React.Fragment key={exam.id}>
                {renderCard(exam, typeById.get(exam.typeId))}
              </React.Fragment>
            ))}
          </div>

          {(hiddenCount > 0 || showAll) && (
            <Button
              variant="outline"
              onClick={() => setShowAll((prev) => !prev)}
              className="mt-4 w-full gap-1.5 border-grey-300 font-semibold text-grey-950 hover:border-primary hover:text-primary"
            >
              {showAll
                ? translate("exams.show-less")
                : translate("exams.show-more", [hiddenCount])}
              <ChevronDown
                className={cn(
                  "size-4 transition-transform duration-200",
                  showAll && "rotate-180",
                )}
              />
            </Button>
          )}
        </>
      )}
    </>
  );
};

export default ExamBrowser;
