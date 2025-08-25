import type { Answer, LangCode, Question, QuestionTypes, ThemedStyles } from '../../types'

import React from 'react'
import styled from 'styled-components'
import { lighten, darken } from 'polished'
import { formatAnswerLabel } from '../../utils/format'
import { translate } from '../../utils/translation'

const ExplanationStyles = styled.div<ExplanationStylesProps>`
  background: ${({ $correct, theme }) => ($correct ? lighten(0.4, theme.correct) : lighten(0.4, theme.incorrect))};
  border: 1px solid ${({ theme }) => theme.grey[2]};
  margin-top: 5rem;
  padding-right: 1rem;
  padding-left: 1rem;
  font: 1.4rem 'Open Sans';
`

const StatusStyles = styled.span<ExplanationStylesProps>`
  text-transform: uppercase;
  font-weight: 700;
  color: ${({ $correct, theme }) => ($correct ? darken(0.1, theme.correct) : darken(0.1, theme.incorrect))};
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

  const [yours, _correct, _answer, explain] = React.useMemo(
    () => [
      translate('content.explain.yours'),
      translate(`content.explain.${correct ? 'correct' : 'incorrect'}`),
      translate('content.explain.answer'),
      translate('content.explain.explain')
    ],
    [document.documentElement.lang, translate, correct]
  )

  return (
    <ExplanationStyles id="explanation" $correct={correct}>
      <p>
        {yours}
        <StatusStyles $correct={correct}>{_correct}</StatusStyles>
      </p>

      <p>
        {_answer}
        <CorrectStyles>{formatAnswerLabel(question, document.documentElement.lang as LangCode)}</CorrectStyles>
      </p>

      {question.explanation && (
        <ExplanationTextStyles>
          {explain}
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
