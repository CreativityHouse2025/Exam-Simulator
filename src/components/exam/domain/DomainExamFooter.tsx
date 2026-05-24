import React from 'react'
import FooterShell from '../shared/Footer/FooterShell'
import Arrows from '../shared/Footer/Arrows'
import DomainTimer from './DomainTimer'

interface DomainExamFooterProps {
  open: boolean
  questionCount: number
}

const DomainExamFooter: React.FC<DomainExamFooterProps> = ({ open, questionCount }) => (
  <FooterShell open={open}>
    <Arrows questionCount={questionCount} />
    <DomainTimer />
  </FooterShell>
)

export default DomainExamFooter
