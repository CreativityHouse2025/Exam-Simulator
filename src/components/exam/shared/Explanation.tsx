import type { Answer, LangCode, Question, QuestionTypes, ThemedStyles } from '../../../types'

import React from 'react'
import styled from 'styled-components'
import { lighten, darken } from 'polished'
import { VisibilityOff } from '@styled-icons/material/VisibilityOff'
import { formatCorrectAnswerLabel } from '../../../utils/format'
import { isAnswerCorrect } from '../../../utils/results'
import { translate } from '../../../utils/translation'
import useSettings from '../../../hooks/useSettings'
import { fadeIn } from '../../SharedStyles'

const ExplanationStyles = styled.div<ExplanationStylesProps>`
  position: relative;
  background: ${({ $correct, theme }) => lighten(0.4, $correct ? theme.correct : theme.incorrect)};
  border: 1px solid ${({ theme }) => theme.grey[2]};
  margin-top: 5rem;
  padding: 1rem 1rem 1rem 1rem;
  font: 1.4rem 'Open Sans';
  animation: ${fadeIn} 0.4s ease-out;
`

const HideButtonStyles = styled.button<ThemedStyles>`
  position: absolute;
  top: 0.5rem;
  inset-inline-end: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.grey[8]};
  transition: color 0.3s;

  &:hover {
    color: ${({ theme }) => theme.tertiary};
  }
`

const StatusStyles = styled.span<ExplanationStylesProps>`
  text-transform: uppercase;
  font-weight: 700;
  color: ${({ $correct, theme }) => darken(0.1, $correct ? theme.correct : theme.incorrect)};
`

const CorrectStyles = styled.span<ThemedStyles>`
  font-weight: 700;
  color: ${({ theme }) => darken(0.1, theme.correct)};
`

const ExplanationTextStyles = styled.p`
  font-weight: 700;
  margin-top: 1rem;
`

const NormalText = styled.span`
  font: 1.4rem 'Open Sans';
  margin-bottom: 0.5rem;
`

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

    return (
      <ExplanationStyles ref={ref} id="explanation" $correct={correct}>
        {onHide && (
          <HideButtonStyles type="button" onClick={onHide} aria-label="Hide explanation">
            <VisibilityOff size={28} />
          </HideButtonStyles>
        )}

        <p>
          {translated.yours}
          <StatusStyles $correct={correct}>{translated.correct}</StatusStyles>
        </p>

        <p>
          {translated.answer}
          <CorrectStyles>{formatCorrectAnswerLabel(question, langCode as LangCode)}</CorrectStyles>
        </p>

        {question.explanation && (
          <ExplanationTextStyles>
            {translated.explain}
            <br />
            <NormalText>{question.explanation}</NormalText>
          </ExplanationTextStyles>
        )}
      </ExplanationStyles>
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

export interface ExplanationStylesProps extends ThemedStyles {
  $correct: boolean
}
