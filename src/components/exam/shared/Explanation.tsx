import type { Answer, LangCode, Question, QuestionTypes } from '../../../types'

import React from 'react'
import { EyeOff } from 'lucide-react'
import { formatCorrectAnswerLabel } from '../../../utils/format'
import { isAnswerCorrect } from '../../../utils/results'
import { translate } from '../../../utils/translation'
import useSettings from '../../../hooks/useSettings'
import { cn } from '../../ui/utils'

const ExplanationComponent = React.forwardRef<HTMLDivElement, ExplanationProps>(
  ({ question, userAnswer, onHide }, ref) => {
    const correct = isAnswerCorrect(userAnswer, question.answer)

    const { settings } = useSettings()
    const langCode = settings.language

    const translated = {
      yours: translate('content.explain.yours'),
      correct: translate(`content.explain.${correct ? 'correct' : 'incorrect'}`),
      answer: translate('content.explain.answer'),
      explain: translate('content.explain.explain')
    }

    const strongColor = correct ? "text-correct-strong" : "text-destructive-strong"

    return (
      <div
        ref={ref}
        id="explanation"
        className={cn(
          "relative border border-grey-200 mt-12.5 p-2.5 text-sm",
          "animate-in fade-in slide-in-from-bottom-3 animation-duration-400 ease-out",
          correct ? "bg-correct-bg" : "bg-destructive-bg",
        )}
      >
        {onHide && (
          <button
            type="button"
            onClick={onHide}
            aria-label="Hide explanation"
            className="absolute top-1.25 end-1.25 bg-transparent border-0 cursor-pointer p-1 flex items-center justify-center text-grey-800 transition-colors duration-300 hover:text-tertiary"
          >
            <EyeOff size={28} />
          </button>
        )}

        <p>
          {translated.yours}
          <span className={cn("uppercase font-bold", strongColor)}>{translated.correct}</span>
        </p>

        <p>
          {translated.answer}
          <span className="font-bold text-correct-strong">{formatCorrectAnswerLabel(question, langCode as LangCode)}</span>
        </p>

        {question.explanation && (
          <p className="font-bold mt-2.5">
            {translated.explain}
            <br />
            {/* margin-bottom on the original inline <span> was a no-op (vertical margin doesn't
                apply to inline elements) — preserved as-is, not "fixed" into a block element.
                See docs/refactor/phase-1-report.md PRE-EXISTING DEFECTS FOUND. */}
            <span className="font-normal text-sm">{question.explanation}</span>
          </p>
        )}
      </div>
    )
  }
)

ExplanationComponent.displayName = 'Explanation'

export default ExplanationComponent

export interface ExplanationProps {
  question: Question
  userAnswer: Answer<QuestionTypes>
  onHide?: () => void
}
