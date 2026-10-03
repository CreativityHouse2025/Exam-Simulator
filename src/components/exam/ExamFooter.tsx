import React from "react";
import FooterShell from "./Footer/FooterShell";
import Arrows from "./Footer/Arrows";
import Timer from "./Timer";

interface ExamFooterProps {
  open: boolean;
  questionCount: number;
}

// Timer renders unconditionally — it shows --:--:-- when there is no clock (untimed, revision, preview).
const ExamFooter: React.FC<ExamFooterProps> = ({ open, questionCount }) => (
  <FooterShell open={open}>
    <Arrows questionCount={questionCount} />
    <Timer />
  </FooterShell>
);

export default ExamFooter;
