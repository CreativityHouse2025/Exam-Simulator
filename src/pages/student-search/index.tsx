import React from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@mantine/hooks";
import { Search, UserSearch } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import BackButton from "@/components/BackButton";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import StudentCard, { StudentCardSkeleton } from "./StudentCard";
import { createStudentSearchQueryOptions } from "@/utils/queryOptions";
import { translate } from "@/utils/translation";
import { ROUTES } from "@/config/routes";

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;
const SKELETON_COUNT = 5;

const LIST_CLASSES =
  "divide-y divide-grey-100 overflow-hidden rounded-xl border border-grey-200 bg-white";

/** Supervisor-only: search students by name or email, then open one to review their attempts. */
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

  const fromSearch = searchParams.toString()
    ? `?${searchParams.toString()}`
    : "";

  let content: React.ReactNode;

  if (isIdle) {
    content = (
      <EmptyState
        icon={Search}
        message={translate("students.search.idle")}
        hint={translate("students.search.idle-hint")}
      />
    );
  } else if (isFetching) {
    content = (
      <div className={LIST_CLASSES}>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <StudentCardSkeleton key={i} />
        ))}
      </div>
    );
  } else if (isError) {
    content = (
      <ErrorState
        message={translate("students.search.error")}
        onRetry={refetch}
        isRetrying={isFetching}
      />
    );
  } else if (!students || students.length === 0) {
    content = (
      <EmptyState
        icon={UserSearch}
        message={translate("students.search.empty", [query])}
        hint={translate("students.search.empty-hint")}
      />
    );
  } else {
    content = (
      <div className="animate-[fadeIn_0.25s_ease-out]">
        <p className="mb-3 text-xs text-grey-800">
          {translate("students.search.count", [students.length])}
        </p>

        <div className={LIST_CLASSES}>
          {students.map((student) => (
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
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <BackButton to={ROUTES.home} text={translate("exam.library.back")} />

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-tertiary md:text-3xl">
          {translate("students.search.title")}
        </h1>
        <p className="mt-1.5 text-sm text-grey-800">
          {translate("students.search.subtitle")}
        </p>
      </header>

      <SearchBar
        value={inputValue}
        onChange={setInputValue}
        placeholder={translate("students.search.placeholder")}
        className="mb-5"
      />

      {content}
    </div>
  );
};

export default StudentSearchPage;
