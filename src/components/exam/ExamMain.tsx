import React from "react";
import { useSearchParams } from "react-router-dom";
import ExamContent from "./ExamContent";
import ExamSummary from "./ExamSummary";
import { useExamSession } from "../../hooks/examSession/useExamSession";

const ExamMain: React.FC<{ open: boolean }> = () => {
  const { examState } = useExamSession();
  const [searchParams] = useSearchParams();
  const finished = examState === "completed";
  // Absence of ?view= (or any value but 'question') means summary — submit lands here by default.
  const isSummaryView = searchParams.get("view") !== "question";

  return (
    <main id="main" className="w-full overflow-hidden bg-white">
      <div
        id="content"
        className="w-full h-full overflow-y-auto scrollbar-gutter-stable box-border grid justify-items-center items-center p-5 transition-all duration-300"
      >
        {finished && isSummaryView ? (
          <ExamSummary />
        ) : (
          <ExamContent isReview={finished} />
        )}
      </div>
    </main>
  );
};

export default ExamMain;
