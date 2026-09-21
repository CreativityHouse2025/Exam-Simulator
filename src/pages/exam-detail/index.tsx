import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileQuestion, Loader2, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/SearchBar";
import ExamFacts from "@/components/exams/ExamFacts";
import PreviewExamButton from "@/components/PreviewExamButton";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import QuestionCard from "./QuestionCard";
import QuestionNavigator from "./QuestionNavigator";
import Pager from "./Pager";
import BackButton from "@/components/BackButton";
import {
  createExamQuestionsQueryOptions,
  createTrackExamsQueryOptions,
} from "@/utils/queryOptions";
import { translate } from "@/utils/translation";
import { examTypeAccent } from "@/utils/examTypeColour";
import { ROUTES } from "@/config/routes";
import { cn } from "@/components/ui/utils";
import useSettings from "@/hooks/useSettings";
import type { DisclosedQuestion } from "@/apiTypes";
import type { OpenState, QuestionSection, SectionOpen } from "./types";

const PER_PAGE = 10;
const DEFAULT_OPEN: SectionOpen = { choices: true, explanation: false };

/** Supervisor-only, read-only question viewer for one exam of a track. No attempt is created. */
const ExamDetailPage: React.FC = () => {
  const { settings } = useSettings();
  const langCode = settings.language;
  const { trackId = "", examId } = useParams<{
    trackId: string;
    examId: string;
  }>();

  const numericId = Number(examId);
  const validId = Number.isInteger(numericId) && numericId > 0;

  const { data, isPending, isError, refetch, isFetching } = useQuery({
    ...createExamQuestionsQueryOptions(numericId, langCode),
    enabled: validId,
  });

  // Only for the type chip: the questions endpoint carries `typeId` but not the type's name or
  // colour. The library page has already cached this list, so it is usually a cache hit.
  const { data: trackExams } = useQuery({
    ...createTrackExamsQueryOptions(trackId),
    enabled: trackId !== "",
  });

  const questions: DisclosedQuestion[] | null = data?.questions ?? null;

  const [open, setOpen] = React.useState<OpenState>({});
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [scrollTarget, setScrollTarget] = React.useState<number | "top" | null>(
    null,
  );

  const topRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!questions) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pre-existing, unrelated to this change
    setOpen(Object.fromEntries(questions.map((q) => [q.id, DEFAULT_OPEN])));
  }, [questions]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pre-existing, unrelated to this change
    setPage(0);
  }, [search]);

  // Runs after the new page has committed, so the target question is already mounted.
  React.useLayoutEffect(() => {
    if (scrollTarget === null) return;
    if (scrollTarget === "top") {
      topRef.current?.scrollIntoView({ block: "start" });
    } else {
      document
        .getElementById(`question-${scrollTarget}`)
        ?.scrollIntoView({ block: "start" });
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pre-existing, unrelated to this change
    setScrollTarget(null);
  }, [scrollTarget]);

  const filtered = React.useMemo(() => {
    if (!questions) return [];
    // Keep each question's original 1-based position so the card/navigator show the real index, not the filtered one.
    const withNumber = questions.map((question, i) => ({
      question,
      number: i + 1,
    }));
    const q = search.trim().toLowerCase();
    return q
      ? withNumber.filter(({ question }) =>
          question.text.toLowerCase().includes(q),
        )
      : withNumber;
  }, [questions, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageQuestions = filtered.slice(
    currentPage * PER_PAGE,
    currentPage * PER_PAGE + PER_PAGE,
  );

  const setAll = (value: boolean) => {
    if (!questions) return;
    setOpen(
      Object.fromEntries(
        questions.map((q) => [q.id, { choices: value, explanation: value }]),
      ),
    );
  };

  const toggleSection = (
    questionId: DisclosedQuestion["id"],
    section: QuestionSection,
  ) => {
    setOpen((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [section]: !prev[questionId][section],
      },
    }));
  };

  // Navigator cells pass the question number → jump to its page and scroll to it. The pager omits it → scroll to top.
  const handleJump = (nextPage: number, questionNumber?: number) => {
    setPage(nextPage);
    setScrollTarget(questionNumber ?? "top");
  };

  const backButton = (
    <BackButton
      to={ROUTES.examLibrary.to(trackId)}
      text={translate("exam.details.back")}
    />
  );

  if (!validId) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        {backButton}
        <EmptyState
          icon={FileQuestion}
          message={translate("exam.details.not-found")}
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        {backButton}
        <ErrorState
          message={translate("exam.details.no-questions")}
          onRetry={refetch}
          isRetrying={isFetching}
        />
      </div>
    );
  }

  const examType = trackExams?.types.find(
    (type) => type.id === data?.exam.typeId,
  );
  const accent = examTypeAccent(examType?.colour ?? null);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div ref={topRef} />
      {backButton}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-tertiary">
              {data?.exam.name[langCode]}
            </h1>
            {examType && (
              <Badge className={cn("shrink-0 text-xs", accent.chip)}>
                {examType.name[langCode]}
              </Badge>
            )}
          </div>

          {data && (
            <ExamFacts
              config={data.exam.config}
              questionCount={data.exam.questionCount}
              iconClassName={accent.icon}
            />
          )}
        </div>

        <PreviewExamButton
          trackId={trackId}
          examId={numericId}
          className="shrink-0"
        />
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder={translate("exam.details.search")}
        className="mb-4"
      />

      <QuestionNavigator
        numbers={filtered.map((item) => item.number)}
        perPage={PER_PAGE}
        currentPage={currentPage}
        onJump={handleJump}
        variant="strip"
        className="sticky top-1 z-10 mb-4 rounded-lg border border-border md:hidden"
      />

      <div className="flex gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {isPending ? (
            <div className="flex justify-center py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : questions === null || questions.length === 0 ? (
            <EmptyState
              icon={FileQuestion}
              message={translate("exam.details.no-questions")}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={SearchX}
              message={translate("exam.details.empty-search")}
              hint={translate("exams.no-results-hint")}
            />
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAll(true)}
                  className="text-grey-900 hover:text-tertiary"
                >
                  {translate("exam.details.expand-all")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAll(false)}
                  className="text-grey-900 hover:text-tertiary"
                >
                  {translate("exam.details.collapse-all")}
                </Button>
              </div>

              <div className="flex animate-[fadeIn_0.25s_ease-out] flex-col gap-4">
                {pageQuestions.map(({ question, number }) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    number={number}
                    open={open[question.id] ?? DEFAULT_OPEN}
                    onToggle={(section) => toggleSection(question.id, section)}
                  />
                ))}
              </div>

              <Pager
                page={currentPage}
                pageCount={pageCount}
                onChange={handleJump}
                showText
                centered
                label={translate("exam.details.pager.page")}
                className="mt-2 gap-4"
              />
            </>
          )}
        </div>

        {questions !== null && filtered.length > 0 && (
          <QuestionNavigator
            numbers={filtered.map((item) => item.number)}
            perPage={PER_PAGE}
            currentPage={currentPage}
            onJump={handleJump}
            variant="sidebar"
            className="sticky top-4 hidden h-fit w-fit shrink-0 md:block"
          />
        )}
      </div>
    </div>
  );
};

export default ExamDetailPage;
