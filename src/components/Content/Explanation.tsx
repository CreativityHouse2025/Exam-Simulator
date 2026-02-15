import type { Answer, LangCode, Question, QuestionTypes, ThemedStyles } from '../../types'

import React from 'react'
import styled from 'styled-components'
import { lighten, darken } from 'polished'
import { formatAnswerLabel } from '../../utils/format'
import { translate } from '../../utils/translation'
import useSettings from '../../hooks/useSettings'

const ExplanationStyles = styled.div<ExplanationStylesProps>`
  background: ${({ $correct, theme }) => lighten(0.4, $correct ? theme.correct : theme.incorrect)};
  border: 1px solid ${({ theme }) => theme.grey[2]};
  margin-top: 5rem;
  padding-right: 1rem;
  padding-left: 1rem;
  font: 1.4rem 'Open Sans';
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

const ExplanationComponent: React.FC<ExplanationProps> = ({ question, answer }) => {
  const correct: boolean =
    question.answer.length === answer.length && question.answer.every((ans, index) => ans === answer[index])

  const { settings } = useSettings();
  const langCode = settings.language;

  const translated = {
    yours: translate('content.explain.yours'),
    correct: translate(`content.explain.${correct ? 'correct' : 'incorrect'}`),
    answer: translate('content.explain.answer'),
    explain: translate('content.explain.explain')
  }


  return (
    <ExplanationStyles id="explanation" $correct={correct}>
      <p>
        {translated.yours}
        <StatusStyles $correct={correct}>{translated.correct}</StatusStyles>
      </p>

      <p>
        {translated.answer}
        <CorrectStyles>{formatAnswerLabel(question, langCode as LangCode)}</CorrectStyles>
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

export default ExplanationComponent

export interface ExplanationProps {
  question: Question
  answer: Answer<QuestionTypes>
}

export interface ExplanationStylesProps extends ThemedStyles {
  $correct: boolean
}
