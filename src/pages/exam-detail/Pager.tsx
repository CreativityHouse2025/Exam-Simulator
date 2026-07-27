import { Button } from "@/components/ui/button"
import useDirectionalChevron from "@/hooks/useDirectionalChevron"
import { translate } from "@/utils/translation"

type PagerProps = {
  /** 0-based current page. */
  page: number
  pageCount: number
  onChange: (page: number) => void
  /** Show the "Previous"/"Next" labels beside the chevrons. Defaults to icon-only. */
  showText?: boolean
  /** Center the three items (Previous · indicator · Next) instead of spreading them apart. Pass a `gap-*` class for spacing. */
  centered?: boolean
  /** Pre-translated noun shown in the indicator, e.g. "Page 1 / 2" or "Section 1 / 2". */
  label: string
  className?: string
}

/** Previous/next pagination control with a "<label> X / Y" indicator. Chevrons flip and Previous/Next translate under RTL. */
const Pager = ({ page, pageCount, onChange, showText = false, centered = false, label, className }: PagerProps) => {
  const { PrevIcon, NextIcon } = useDirectionalChevron()

  const t = {
    previous: translate("exam.details.pager.previous"),
    next: translate("exam.details.pager.next")
  }

  const size = showText ? "sm" : "icon-sm"

  return (
    <div className={`flex items-center ${centered ? "justify-center" : "justify-between"} ${className ?? ""}`}>
      <Button
        variant="outline"
        size={size}
        className="gap-1.5 text-grey-900 hover:text-tertiary"
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        aria-label={t.previous}
      >
        <PrevIcon className="size-4" />
        {showText && t.previous}
      </Button>

      <span className="text-sm whitespace-nowrap text-grey-900">
        {label} {page + 1} / {pageCount}
      </span>

      <Button
        variant="outline"
        size={size}
        className="gap-1.5 text-grey-900 hover:text-tertiary"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount - 1}
        aria-label={t.next}
      >
        {showText && t.next}
        <NextIcon className="size-4" />
      </Button>
    </div>
  )
}

export default Pager
