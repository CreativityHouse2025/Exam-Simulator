import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { translate } from "@/utils/translation"
import Pager from "./Pager"

/** How many number cells the navigator shows at once — its pager scrolls through these windows. */
const NAV_CHUNK = 60

type QuestionNavigatorProps = {
  /** Original question numbers, in filtered order — cell labels reflect the real index, not the filtered one. */
  numbers: number[]
  perPage: number
  currentPage: number
  /** `questionNumber` is passed when a grid cell is clicked (jump + scroll to it); omitted by the pager (scroll to top). */
  onJump: (page: number, questionNumber?: number) => void
  /** "sidebar" = wrapping number grid (desktop). "strip" = horizontal scroll row (mobile). */
  variant: "sidebar" | "strip"
  className?: string
}

/** Number grid that doubles as pagination. The grid is windowed (NAV_CHUNK cells); its own pager scrolls the
 *  windows, while clicking a cell jumps the question page and scrolls to that question. */
const QuestionNavigator = ({ numbers, perPage, currentPage, onJump, variant, className }: QuestionNavigatorProps) => {
  const [navPage, setNavPage] = useState(0)
  const navPageCount = Math.max(1, Math.ceil(numbers.length / NAV_CHUNK))

  // Keep the visible window aligned with the active question page so the current cells stay on screen.
  useEffect(() => {
    const firstQuestionIndex = currentPage * perPage
    const sectionOfCurrentPage = Math.floor(firstQuestionIndex / NAV_CHUNK)
    const lastSection = navPageCount - 1
    setNavPage(Math.min(sectionOfCurrentPage, lastSection))
  }, [currentPage, perPage, navPageCount])

  const windowStart = navPage * NAV_CHUNK
  const visible = numbers.slice(windowStart, windowStart + NAV_CHUNK)

  const buttons = visible.map((num, j) => {
    const questionPage = Math.floor((windowStart + j) / perPage)
    const active = questionPage === currentPage

    return (
      <button
        key={num}
        type="button"
        onClick={() => onJump(questionPage, num)}
        className={`flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-xs font-semibold transition-colors ${
          active
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-background text-grey-900 hover:bg-accent hover:text-tertiary"
        }`}
      >
        {num}
      </button>
    )
  })

  const pager = (
    <Pager page={navPage} pageCount={navPageCount} onChange={setNavPage} label={translate("exam.details.pager.section")} />
  )

  if (variant === "strip") {
    return (
      <div className={`flex flex-col gap-2 bg-background p-3 ${className ?? ""}`}>
        {pager}
        <div className="flex gap-1.5 overflow-x-auto">{buttons}</div>
      </div>
    )
  }

  return (
    <Card className={`py-4 ${className ?? ""}`}>
      <CardContent className="flex flex-col gap-3 px-3">
        {pager}
        <div className="grid grid-cols-5 gap-1.5">{buttons}</div>
      </CardContent>
    </Card>
  )
}

export default QuestionNavigator
