import React from 'react'
import FooterShell from './Footer/FooterShell'
import Arrows from './Footer/Arrows'
import Timer from './Timer'
import { useExamSession } from '../../hooks/examSession/useExamSession'

interface ExamFooterProps {
  open: boolean
  questionCount: number
}

const ExamFooter: React.FC<ExamFooterProps> = ({ open, questionCount }) => {
  const { isTimed } = useExamSession()

  return (
    <FooterShell open={open}>
      <Arrows questionCount={questionCount} />
      {isTimed && <Timer />}
    </FooterShell>
  )
}

export default ExamFooter
