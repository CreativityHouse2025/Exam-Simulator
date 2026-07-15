import { ChevronDown } from "lucide-react"
import { CollapsibleTrigger } from "@/components/ui/collapsible"

type SectionToggleProps = {
  label: string
  open: boolean
}

/** Chevron + label trigger for a CollapsibleContent section. Rotates the chevron based on `open`. */
const SectionToggle = ({ label, open }: SectionToggleProps) => {
  return (
    <>
      {/* Full-bleed divider — breaks out of the card's px-6 padding to span the whole width. */}
      <div className="-mx-6 border-t border-grey-200" />
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-2 pt-4 text-start text-xs font-semibold tracking-wide text-grey-800 uppercase hover:text-tertiary">
        {label}
        <ChevronDown className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
    </>
  )
}

export default SectionToggle
