import { Check } from "lucide-react"
import type { Choice } from "@/types"

type ChoiceRowProps = {
  choice: Choice
  letter: string
}

/** Read-only choice display for the supervisor question viewer — no selection state, just reveals the answer. */
const ChoiceRow = ({ choice, letter }: ChoiceRowProps) => {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${
        choice.correct ? "border-correct bg-correct/10 text-tertiary" : "border-border text-grey-900"
      }`}
    >
      <span
        className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          choice.correct ? "bg-correct text-white" : "bg-grey-100 text-grey-900"
        }`}
      >
        {letter}
      </span>

      <span className="flex-1">{choice.text}</span>

      {choice.correct && <Check className="size-4 shrink-0 text-correct" />}
    </div>
  )
}

export default ChoiceRow
