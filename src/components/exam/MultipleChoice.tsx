import type { LangCode } from "../../types";

import React from "react";
import Choice from "./Choice";
import { formatChoiceLabel } from "../../utils/format";
import { useExamSession } from "../../hooks/examSession/useExamSession";
import useSettings from "../../hooks/useSettings";

const MultipleChoiceComponent: React.FC<MultipleChoiceProps> = ({
  isReview,
  isAnswerRevealed = false,
}) => {
  const {
    question,
    index: questionIndex,
    selectedChoices,
    setAnswer,
  } = useExamSession();
  const { settings } = useSettings();
  const langCode = settings.language;

  const selectedPositions = selectedChoices[questionIndex] || [];

  const shouldShowCorrectness = isReview || isAnswerRevealed;
  const isChoiceInteractionLocked = isReview;
  // answerCount is a count, never the key — selected unconditionally on every question read
  // (questionService.getQuestions), so it's known before the choices themselves are disclosed.
  const isSingleAnswer = question.answerCount === 1;
  const maxAnswersReached = selectedPositions.length >= question.answerCount;

  const onChoose = React.useCallback(
    (position: number) => {
      if (isChoiceInteractionLocked) return;

      if (isSingleAnswer) {
        setAnswer(questionIndex, [position]);
        return;
      }

      const isAlreadySelected = selectedPositions.includes(position);
      if (isAlreadySelected) {
        setAnswer(
          questionIndex,
          selectedPositions.filter((selected) => selected !== position),
        );
      } else if (!maxAnswersReached) {
        setAnswer(questionIndex, [...selectedPositions, position]);
      }
    },
    [
      questionIndex,
      selectedPositions,
      isChoiceInteractionLocked,
      isSingleAnswer,
      maxAnswersReached,
      setAnswer,
    ],
  );

  return (
    <div>
      {question.choices.map((choice, i) => {
        const isSelected = selectedPositions.includes(choice.position);
        const isCorrect = "isCorrect" in choice && choice.isCorrect;
        return (
          <Choice
            key={choice.position}
            singleAnswer={isSingleAnswer}
            selected={isSelected}
            review={shouldShowCorrectness}
            correct={isCorrect}
            disabled={
              isChoiceInteractionLocked ||
              (!isSingleAnswer && !isSelected && maxAnswersReached)
            }
            label={formatChoiceLabel(i, langCode as LangCode)}
            text={choice.text}
            onClick={() => onChoose(choice.position)}
          />
        );
      })}
    </div>
  );
};

export default MultipleChoiceComponent;

export interface MultipleChoiceProps {
  isReview: boolean;
  isAnswerRevealed?: boolean;
}
