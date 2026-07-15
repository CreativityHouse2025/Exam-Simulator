import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/components/ui/utils"

type SearchBarProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
}

/** Shared search input — exam-library filters by title, exam-detail filters by question text. */
const SearchBar = ({ value, onChange, placeholder, className }: SearchBarProps) => {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-grey-800" />

      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn("bg-card ps-9", value && "pe-9")}
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute inset-e-3 top-1/2 -translate-y-1/2 text-grey-800 hover:text-black"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

export default SearchBar
