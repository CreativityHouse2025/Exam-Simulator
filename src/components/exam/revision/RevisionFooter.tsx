import React from 'react'
import FooterShell from '../shared/Footer/FooterShell'
import Arrows from '../shared/Footer/Arrows'

const RevisionFooter: React.FC<RevisionFooterProps> = ({ open, questionCount }) => (
  <FooterShell open={open}>
    <Arrows questionCount={questionCount} />
  </FooterShell>
)

export default RevisionFooter

interface RevisionFooterProps {
  open: boolean
  questionCount: number
}
