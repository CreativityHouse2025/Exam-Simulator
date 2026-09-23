import React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { translate } from "@/utils/translation";
import { LANGUAGES } from "@/constants";
import type { ExamType } from "@/apiTypes";
import type { LangCode } from "@/types";

type ExamFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  types: ExamType[];
  langCode: LangCode;
};

/** Name search plus a type select built from whichever types this track's exams actually use. */
const ExamFilters: React.FC<ExamFiltersProps> = ({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  types,
  langCode,
}) => (
  <div className="mb-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-grey-800" />
      <Input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={translate("exams.search")}
        aria-label={translate("exams.search")}
        className="h-11 rounded-lg border-grey-300 bg-white ps-10 pe-10 text-sm shadow-none focus-visible:border-primary focus-visible:ring-primary/20"
      />
      {search && (
        <button
          type="button"
          onClick={() => onSearchChange("")}
          aria-label={translate("common.clear")}
          className="absolute inset-e-2 top-1/2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-grey-800 transition-colors duration-150 hover:bg-grey-100 hover:text-tertiary"
        >
          <X className="size-4" />
        </button>
      )}
    </div>

    <Select
      value={typeFilter}
      onValueChange={onTypeFilterChange}
      dir={LANGUAGES[langCode].dir}
    >
      {/* The primitive ships bg-transparent + border-input, which disappears over the page gradient. */}
      <SelectTrigger className="h-11 w-full rounded-lg border-grey-300 bg-white text-sm shadow-none data-[size=default]:h-11 sm:w-56">
        <SelectValue placeholder={translate("exams.filter.type")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{translate("exams.filter.all")}</SelectItem>
        {types.map((examType) => (
          <SelectItem key={examType.id} value={String(examType.id)}>
            {examType.name[langCode]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export default ExamFilters;
