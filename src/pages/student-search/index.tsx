import React from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@mantine/hooks";
import { UserSearch, Search as SearchIcon, RotateCcw } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/BackButton";
import StudentCard, { StudentCardSkeleton } from "./StudentCard";
import { createStudentSearchQueryOptions } from "@/utils/queryOptions";
import { translate } from "@/utils/translation";
import { ROUTES } from "@/config/routes";

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;
const SKELETON_COUNT = 5;

const EmptyState = ({
  icon: Icon,
  message,
}: {
  icon: typeof SearchIcon;
  message: string;
}) => (
  <div className="flex flex-col items-center gap-3 py-20">
    <Icon className="size-9 text-grey-500" strokeWidth={1.4} />
    <p className="text-sm text-grey-800">{message}</p>
  </div>
);

/** Supervisor-only: search students by name or email, then open a student to review their attempts. */
const StudentSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = React.useState(
    searchParams.get("q") ?? "",
  );
  const [debouncedValue] = useDebouncedValue(inputValue, SEARCH_DEBOUNCE_MS);
  const query = debouncedValue.trim();

  // Reflect the debounced query in the URL (replace, not push) so a supervisor returning via the
  // breadcrumb link can restore this exact search — see StudentCard's `fromSearch` prop.
  React.useEffect(() => {
    setSearchParams(query ? { q: query } : {}, { replace: true });
  }, [query, setSearchParams]);

  const isIdle = query.length < MIN_QUERY_LENGTH;
  const {
    data: students,
    isFetching,
    isError,
    refetch,
  } = useQuery(createStudentSearchQueryOptions(query));

  const t = {
    back: translate("exam.library.back"),
    title: translate("students.search.title"),
    subtitle: translate("students.search.subtitle"),
    placeholder: translate("students.search.placeholder"),
    idle: translate("students.search.idle"),
    empty: translate("students.search.empty", [query]),
    error: translate("students.search.error"),
    retry: translate("students.search.retry"),
    count: (n: number) => translate("students.search.count", [n]),
  };

  const fromSearch = searchParams.toString()
    ? `?${searchParams.toString()}`
    : "";

  let content: React.ReactNode;

  if (isIdle) {
    content = <EmptyState icon={SearchIcon} message={t.idle} />;
  } else if (isFetching) {
    content = (
      <div className="divide-y divide-grey-100 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <StudentCardSkeleton key={i} />
        ))}
      </div>
    );
  } else if (isError) {
    content = (
      <div className="flex flex-col items-center gap-3 py-20">
        <p className="text-sm text-grey-800">{t.error}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RotateCcw className="size-3.5" />
          {t.retry}
        </Button>
      </div>
    );
  } else if (students && students.length === 0) {
    content = <EmptyState icon={UserSearch} message={t.empty} />;
  } else {
    content = (
      <div className="animate-[fadeIn_0.25s_ease-out]">
        <p className="mb-3 text-xs text-grey-800">{t.count(students?.length ?? 0)}</p>

        <div className="divide-y divide-grey-100 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {students?.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              fromSearch={fromSearch}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="tailwind-page mx-auto w-full max-w-4xl px-4 py-8">
      <BackButton to={ROUTES.home} text={t.back} />

      <h1 className="text-2xl font-bold text-tertiary">{t.title}</h1>
      <p className="mt-1.5 mb-0 text-xs text-grey-800">{t.subtitle}</p>

      <SearchBar
        value={inputValue}
        onChange={setInputValue}
        placeholder={t.placeholder}
        className="mt-6 mb-4"
      />

      {content}
    </div>
  );
};

export default StudentSearchPage;
