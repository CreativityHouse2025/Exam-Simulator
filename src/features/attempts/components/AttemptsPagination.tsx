import React from "react";
import Pager from "@/components/Pager";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { translate } from "@/core/utils/translation";
import {
  PER_PAGE_MAX,
  PER_PAGE_MIN,
  PER_PAGE_STEP,
} from "@shared/attempt.schema";
import type { AttemptPage } from "@/core/api/apiTypes";

type AttemptsPaginationProps = {
  /** 1-based, as in the URL and the API. */
  page: AttemptPage;
  /** Attempts across all pages. */
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
};

const PER_PAGE_OPTIONS = Array.from(
  { length: (PER_PAGE_MAX - PER_PAGE_MIN) / PER_PAGE_STEP + 1 },
  (_, i) => PER_PAGE_MIN + i * PER_PAGE_STEP,
);

/** Previous / next through an attempt history, plus how many attempts each page shows. */
const AttemptsPagination: React.FC<AttemptsPaginationProps> = ({
  page,
  total,
  onPageChange,
  onPerPageChange,
}) => {
  const pageCount = Math.max(1, Math.ceil(total / page.perPage));
  const perPageLabel = translate("history.per-page");

  return (
    <div className="mt-4 flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between">
      <div className="flex items-center gap-2 text-sm text-grey-900">
        <span>{perPageLabel}</span>
        <Select
          value={String(page.perPage)}
          onValueChange={(value) => onPerPageChange(Number(value))}
        >
          <SelectTrigger
            size="sm"
            aria-label={perPageLabel}
            className="border-grey-300"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PER_PAGE_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pager counts from 0; the URL and the API count from 1. */}
      <Pager
        page={page.page - 1}
        pageCount={pageCount}
        onChange={(next) => onPageChange(next + 1)}
        label={translate("exam.details.pager.page")}
        showText
        centered
        className="gap-3"
      />
    </div>
  );
};

export default AttemptsPagination;
