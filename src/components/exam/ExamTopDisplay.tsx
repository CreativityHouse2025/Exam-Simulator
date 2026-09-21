import React from "react";
import BookmarkButton from "./BookmarkButton";
import SaveButtonWithReminder from "./SaveButtonWithReminder";
import RevealAnswerButton from "./RevealAnswerButton";
import { translate } from "../../utils/translation";
import useSettings from "../../hooks/useSettings";
import { useExamSession } from "../../hooks/examSession/useExamSession";

const ExamTopDisplay: React.FC<TopDisplayProps> = ({
  questionCount,
  isReview = false,
  isAnswerRevealed = false,
  onToggleAnswerReveal,
}) => {
  const {
    index,
    dirtyQuestions,
    isSyncing,
    saveProgress,
    persists,
    examDetails,
  } = useExamSession();
  const { settings } = useSettings();
  const langCode = settings.language;

  const question = translate("content.top-display.question", [
    index + 1,
    questionCount,
  ]);
  const examChipLabel = translate("content.top-display.exam");

  return (
    <div
      id="exam-header"
      className="flex flex-col items-start justify-center gap-1.25 mb-7.5"
    >
      <div
        id="top-display"
        className="flex items-center justify-between min-w-full"
      >
        <div
          id="question-text"
          className="flex items-center text-xl md:text-2xl font-bold text-grey-950"
        >
          {question}
        </div>

        {!isReview && (
          <div className="flex items-center justify-end flex-wrap gap-1.25 me-1.25 md:gap-2.5 md:me-5">
            {/* A session that never persists (preview, revision) has nothing to save. */}
            {persists && (
              <SaveButtonWithReminder
                isSyncing={isSyncing}
                dirtyCount={Object.keys(dirtyQuestions).length}
                onSave={() => saveProgress()}
              />
            )}
            {/* Only present when ExamContent's canReveal capability allows it. */}
            {onToggleAnswerReveal && (
              <RevealAnswerButton
                isAnswerRevealed={isAnswerRevealed}
                onToggleAnswerReveal={onToggleAnswerReveal}
              />
            )}
            <BookmarkButton />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="py-1 px-2.5 font-sans bg-grey-100 text-grey-950 text-xs md:text-sm font-semibold rounded-3xl border border-grey-200 w-auto">
          {examChipLabel}: {examDetails.name[langCode]}
        </div>
      </div>
    </div>
  );
};

export default ExamTopDisplay;

export interface TopDisplayProps {
  questionCount: number;
  isReview?: boolean;
  isAnswerRevealed?: boolean;
  onToggleAnswerReveal?: () => void;
}
