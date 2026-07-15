import React from "react"
import { Download, FileQuestion } from "lucide-react"
import fullExams from "@/data/exam/full-exams.json"
import categories from "@/data/exam/categories.json"
import examTypes from "@/data/exam/exam-types.json"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SearchBar from "@/components/SearchBar"
import BackButton from "@/components/BackButton"
import ExamCard from "./ExamCard"
import useSettings from "@/hooks/useSettings"
import { translate } from "@/utils/translation"
import { LANGUAGES } from "@/constants"
import type { ExamListItem } from "./types"

type Tab = "all" | "full" | "domain"

const TAB_VALUES: Tab[] = ["all", "full", "domain"]

/** Supervisor-only: browse every exam in the system (full exams + domain/category exams). */
const ExamLibraryPage: React.FC = () => {
  const { settings } = useSettings()
  const langCode = settings.language

  const [tab, setTab] = React.useState<Tab>("all")
  const [search, setSearch] = React.useState("")

  const exams: ExamListItem[] = React.useMemo(() => {
    const full = fullExams.map((exam) => ({
      type: "full" as const,
      id: exam.id,
      name: exam.name[langCode],
      durationMinutes: examTypes.full.durationMinutes,
      passingRate: examTypes.full.passingRate,
      questionCount: exam.questionCount
    }))

    const domain = categories.map((category) => ({
      type: "domain" as const,
      id: category.id,
      name: category.name[langCode],
      durationMinutes: examTypes.domain.durationMinutes,
      passingRate: examTypes.domain.passingRate,
      questionCount: category.questionCount
    }))

    return [...full, ...domain]
  }, [langCode])

  const byTab = tab === "all" ? exams : exams.filter((exam) => exam.type === tab)
  const filtered = search.trim() ? byTab.filter((exam) => exam.name.toLowerCase().includes(search.trim().toLowerCase())) : byTab

  const counts = {
    all: exams.length,
    full: exams.filter((exam) => exam.type === "full").length,
    domain: exams.filter((exam) => exam.type === "domain").length
  }

  const t = {
    back: translate("exam.library.back"),
    title: translate("exam.library.title"),
    subtitle: translate("exam.library.subtitle"),
    export: translate("exam.export"),
    search: translate("exam.library.search"),
    empty: translate("exam.library.empty"),
    tabs: {
      all: translate("exam.library.tabs.all"),
      full: translate("exam.library.tabs.full"),
      domain: translate("exam.library.tabs.domain")
    }
  }

  return (
    <div className="tailwind-page mx-auto w-full max-w-4xl px-4 py-8">
      <BackButton to="/" text={t.back} />

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tertiary">{t.title}</h1>
          <p className="mt-1.5 mb-0 text-xs text-grey-800">{t.subtitle}</p>
        </div>

        {/* TODO(export-csv): unhide once CSV export is implemented (spec AC3). Kept rendered-but-hidden for now. */}
        <Button variant="outline" size="sm" className="hidden gap-2 text-grey-900 hover:text-tertiary">
          <Download className="size-4 text-primary" />
          {t.export}
        </Button>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder={t.search} className="mb-4" />

      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)} dir={LANGUAGES[langCode].dir} className="mb-6">
        <TabsList>
          {TAB_VALUES.map((value) => (
            <TabsTrigger key={value} value={value} className="cursor-pointer data-[state=active]:text-tertiary">
              {t.tabs[value]} ({counts[value]})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <FileQuestion className="size-9 text-grey-500" strokeWidth={1.4} />
          <p className="text-sm text-grey-800">{t.empty}</p>
        </div>
      ) : (
        <div className="flex animate-[fadeIn_0.25s_ease-out] flex-col gap-3">
          {filtered.map((exam) => (
            <ExamCard key={`${exam.type}-${exam.id}`} exam={exam} />
          ))}
        </div>
      )}
    </div>
  )
}

export default ExamLibraryPage
