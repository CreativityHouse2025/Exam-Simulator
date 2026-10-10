import React from "react";
import { FileQuestion } from "lucide-react";
import ExamCardSkeleton from "./ExamCardSkeleton";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import type { ExamDetails } from "@/core/api/apiTypes";

type ExamBrowserProps = {
  exams: ExamDetails[];
  /** Renders one exam. The browser owns the states; the caller owns the card. */
  renderCard: (exam: ExamDetails) => React.ReactNode;
  isPending: boolean;
  isError: boolean;
  errorMessage: string;
  onRetry: () => void;
  isRetrying?: boolean;
  emptyMessage: string;
  emptyHint?: string;
  skeletonCount?: number;
};

const DEFAULT_SKELETON_COUNT = 3;

/**
 * The exam list every reader of a tag's exams shares: the list plus its loading / error / empty
 * states.
 *
 * It knows nothing about who is reading or what an exam does — the caller supplies the card, so
 * a student's "Start" and a supervisor's "View questions" never meet inside a variant prop.
 */
const ExamBrowser: React.FC<ExamBrowserProps> = ({
  exams,
  renderCard,
  isPending,
  isError,
  errorMessage,
  onRetry,
  isRetrying = false,
  emptyMessage,
  emptyHint,
  skeletonCount = DEFAULT_SKELETON_COUNT,
}) => {
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

  return (
    <div className="flex flex-col gap-4">
      {exams.map((exam) => (
        <React.Fragment key={exam.id}>{renderCard(exam)}</React.Fragment>
      ))}
    </div>
  );
};

export default ExamBrowser;
