import type { Question } from '../../types'

import React from 'react'
import { styled } from 'styled-components'

const QuestionStyles = styled.div`
  font: 2rem 'Open Sans';
  margin-bottom: 4rem;
`

const QuestionComponent: React.FC<Question> = ({ text }) => {
  if (!text) return null

  return (
    <QuestionStyles id="question" data-test="Question">
      {text}
    </QuestionStyles>
  )
}

export default QuestionComponent
