import type { Question } from '../../../types'

import React from 'react'

const QuestionComponent: React.FC<Question> = ({ text }) => {
  if (!text) return null

  return (
    <div id="question" data-test="Question" className="text-xl mb-10">
      {text}
    </div>
  )
}

export default QuestionComponent
