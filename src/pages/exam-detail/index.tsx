import React from "react"
import { useParams } from "react-router-dom"
import { Download, FileQuestion, Loader2 } from "lucide-react"
import fullExams from "@/data/exam/full-exams.json"
import categories from "@/data/exam/categories.json"
import examTypes from "@/data/exam/exam-types.json"
import { Button } from "@/components/ui/button"
import SearchBar from "@/components/SearchBar"
import ExamTypeBadge from "@/components/ExamTypeBadge"
import ExamStats from "@/components/ExamStats"
import QuestionCard from "./QuestionCard"
import QuestionNavigator from "./QuestionNavigator"
import Pager from "./Pager"
import BackButton from "@/components/BackButton"
import { loadFullExam, loadDomainExam } from "@/utils/exam"
import { translate } from "@/utils/translation"
import useSettings from "@/hooks/useSettings"
import type { Question } from "@/types"
import type { OpenState, QuestionSection, SectionOpen } from "./types"

const PER_PAGE = 10
const DEFAULT_OPEN: SectionOpen = { choices: true, explanation: false }

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center gap-3 py-20">
    <FileQuestion className="size-9 text-grey-500" strokeWidth={1.4} />
    <p className="text-sm text-grey-800">{message}</p>
  </div>
)

/** Supervisor-only, read-only question viewer for a single exam (full or domain). No attempt is created. */
const ExamDetailPage: React.FC = () => {
  const { settings } = useSettings()
  const langCode = settings.language
  const { type, id } = useParams<{ type: string; id: string }>()

  const validType = type === "full" || type === "domain"
  const numericId = Number(id)
  // Single source of truth for the exam/category — drives validity, name, and question count below.
  const record = !validType
    ? undefined
    : type === "full"
      ? fullExams.find((e) => e.id === numericId)
      : categories.find((c) => c.id === numericId)
  const validId = record !== undefined

  const [questions, setQuestions] = React.useState<Question[] | null>(null)
  const [loadError, setLoadError] = React.useState(false)
  const [open, setOpen] = React.useState<OpenState>({})
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(0)
  const [scrollTarget, setScrollTarget] = React.useState<number | "top" | null>(null)

  const topRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!validId) return
    let cancelled = false
    setQuestions(null)
    setLoadError(false)

    async function loadExam() {
      try {
        const loader = type === "full" ? loadFullExam : loadDomainExam
        const { questionList } = await loader(numericId, langCode)
        if (cancelled) return
        setQuestions(questionList)
        setOpen(Object.fromEntries(questionList.map((q) => [q.id, DEFAULT_OPEN])))
      } catch {
        if (!cancelled) setLoadError(true)
      }
    }
    loadExam()

    return () => {
      cancelled = true
    }
  }, [validId, type, numericId, langCode])

  React.useEffect(() => {
    setPage(0)
  }, [search])

  // Runs after the new page has committed, so the target question is already mounted.
  React.useLayoutEffect(() => {
    if (scrollTarget === null) return
    if (scrollTarget === "top") {
      topRef.current?.scrollIntoView({ block: "start" })
    } else {
      document.getElementById(`question-${scrollTarget}`)?.scrollIntoView({ block: "start" })
    }
    setScrollTarget(null)
  }, [scrollTarget])

  const filtered = React.useMemo(() => {
    if (!questions) return []
    // Keep each question's original 1-based position so the card/navigator show the real index, not the filtered one.
    const withNumber = questions.map((question, i) => ({ question, number: i + 1 }))
    const q = search.trim().toLowerCase()
    return q ? withNumber.filter(({ question }) => question.text.toLowerCase().includes(q)) : withNumber
  }, [questions, search])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const currentPage = Math.min(page, pageCount - 1)
  const pageQuestions = filtered.slice(currentPage * PER_PAGE, currentPage * PER_PAGE + PER_PAGE)

  const setAll = (value: boolean) => {
    if (!questions) return
    setOpen(Object.fromEntries(questions.map((q) => [q.id, { choices: value, explanation: value }])))
  }

  const toggleSection = (questionId: Question["id"], section: QuestionSection) => {
    setOpen((prev) => ({ ...prev, [questionId]: { ...prev[questionId], [section]: !prev[questionId][section] } }))
  }

  // Navigator cells pass the question number → jump to its page and scroll to it. The pager omits it → scroll to top.
  const handleJump = (nextPage: number, questionNumber?: number) => {
    setPage(nextPage)
    setScrollTarget(questionNumber ?? "top")
  }

  const t = {
    back: translate("exam.details.back"),
    notFound: translate("exam.details.not-found"),
    noQuestions: translate("exam.details.no-questions"),
    export: translate("exam.export"),
    search: translate("exam.details.search"),
    expandAll: translate("exam.details.expand-all"),
    collapseAll: translate("exam.details.collapse-all"),
    emptySearch: translate("exam.details.empty-search"),
    pagerPage: translate("exam.details.pager.page")
  }

  const backButton = <BackButton to="/exams" text={t.back} />

  if (!validId) {
    return (
      <div className="tailwind-page mx-auto w-full max-w-4xl px-4 py-8">
        {backButton}
        <EmptyState message={t.notFound} />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="tailwind-page mx-auto w-full max-w-4xl px-4 py-8">
        {backButton}
        <EmptyState message={t.noQuestions} />
      </div>
    )
  }

  const examType = type as "full" | "domain" // guaranteed valid past the guards above
  const meta = examTypes[examType]
  const name = record?.name[langCode]
  const questionCount = record?.questionCount
  const typeLabel = translate(`exam.type.${examType}`)
  const stats = {
    duration: translate("exam.stats.duration", [meta.durationMinutes]),
    questions: translate("exam.stats.questions", [questionCount ?? 0]),
    pass: translate("exam.stats.pass", [meta.passingRate])
  }

  return (
    <div className="tailwind-page mx-auto w-full max-w-4xl px-4 py-8">
      <div ref={topRef} />
      {backButton}

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-tertiary">{name}</h1>
            <ExamTypeBadge type={examType} label={typeLabel} />
          </div>
          <ExamStats duration={stats.duration} questions={stats.questions} pass={stats.pass} />
        </div>

        {/* TODO(export-csv): unhide once CSV export is implemented (spec AC3). Kept rendered-but-hidden for now. */}
        <Button variant="outline" size="sm" className="hidden gap-2 text-grey-900 hover:text-tertiary">
          <Download className="size-4 text-primary" />
          {t.export}
        </Button>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder={t.search} className="mb-4" />

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
          {questions === null ? (
            <div className="flex justify-center py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState message={t.emptySearch} />
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAll(true)}
                  className="text-grey-900 hover:text-tertiary"
                >
                  {t.expandAll}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAll(false)}
                  className="text-grey-900 hover:text-tertiary"
                >
                  {t.collapseAll}
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

              <Pager page={currentPage} pageCount={pageCount} onChange={handleJump} showText centered label={t.pagerPage} className="mt-2 gap-4" />
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
  )
}

export default ExamDetailPage
