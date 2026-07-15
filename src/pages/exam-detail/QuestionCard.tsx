import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import ChoiceRow from "./ChoiceRow"
import SectionToggle from "./SectionToggle"
import { formatChoiceLabel } from "@/utils/format"
import { translate } from "@/utils/translation"
import useSettings from "@/hooks/useSettings"
import type { Question } from "@/types"
import type { QuestionSection, SectionOpen } from "./types"

type QuestionCardProps = {
  question: Question
  number: number
  open: SectionOpen
  onToggle: (section: QuestionSection) => void
}

/** Read-only question viewer for supervisors — no answer selection, choices/explanation independently collapsible. */
const QuestionCard = ({ question, number, open, onToggle }: QuestionCardProps) => {
  const { settings } = useSettings()

  const t = {
    choices: translate("exam.details.choices"),
    explanation: translate("content.explain.explain")
  }

  return (
    <Card id={`question-${number}`} className="scroll-mt-28 md:scroll-mt-4">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="shrink-0 rounded-md bg-primary/10 px-2 text-sm font-bold text-primary">{number}</span>
          <p className="mt-0 text-sm font-semibold text-tertiary">{question.text}</p>
        </div>

        <Collapsible open={open.choices} onOpenChange={() => onToggle("choices")}>
          <SectionToggle label={t.choices} open={open.choices} />
          <CollapsibleContent className="mt-3 flex flex-col gap-2">
            {question.choices.map((choice, i) => (
              <ChoiceRow key={i} choice={choice} letter={formatChoiceLabel(i, settings.language)} />
            ))}
          </CollapsibleContent>
        </Collapsible>

        {question.explanation && (
          <Collapsible open={open.explanation} onOpenChange={() => onToggle("explanation")}>
            <SectionToggle label={t.explanation} open={open.explanation} />
            <CollapsibleContent className="mt-3 rounded-lg bg-grey-100 p-3 text-sm text-grey-900">
              {question.explanation}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )
}

export default QuestionCard
