import React from 'react'
import FooterShell from '../shared/Footer/FooterShell'
import Arrows from '../shared/Footer/Arrows'
import Timer from './Timer'

interface FullExamFooterProps {
  open: boolean
  questionCount: number
}

const FullExamFooter: React.FC<FullExamFooterProps> = ({ open, questionCount }) => (
  <FooterShell open={open}>
    <Arrows questionCount={questionCount} />
    <Timer />
  </FooterShell>
)

export default FullExamFooter
