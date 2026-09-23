import type { QuestionFilter } from "../../../types";
import type { DisclosedAttemptQuestion } from "../../../apiTypes";

import React from "react";
import Cell from "./Cell";
import { useExamSession } from "../../../hooks/examSession/useExamSession";
import { isAnswerCorrect } from "../../../utils/results";

const GridComponent: React.FC<GridProps> = ({ filter }) => {
  const { questions, bookmarks, selectedChoices } = useExamSession();

  // The empty check lives below the hooks so they stay unconditional (rules-of-hooks).
  // Correct/incorrect can only be read once the exam is disclosed — a completed attempt always is
  // (SessionProvider.submitExam / resumeAttempt both go through getAttempt, which discloses
  // whenever exam_state is 'completed'). Checked once for the whole set, since disclosure is
  // all-or-nothing per exam, not per question.
  const isDisclosed = questions.length > 0 && "explanation" in questions[0];

  const categorizedAnswers = React.useMemo(() => {
    const answered: number[] = [];
    const correct: number[] = [];
    const incorrect: number[] = [];

    selectedChoices.forEach((userAnswer, i) => {
      if (userAnswer.length === 0) return;
      answered.push(i);

      const question = questions[i] as DisclosedAttemptQuestion | undefined;
      // selectedChoices can outrun questions if the set shrank — skip rather than crash.
      if (isDisclosed && question) {
        const correctPositions = question.choices
          .filter((choice) => choice.isCorrect)
          .map((choice) => choice.position);
        if (isAnswerCorrect(userAnswer, correctPositions)) {
          correct.push(i);
        } else {
          incorrect.push(i);
        }
      }
    });

    const incomplete = Array.from(
      { length: questions.length },
      (_, i) => i,
    ).filter((i) => !answered.includes(i));

    return { answered, correct, incorrect, incomplete };
  }, [questions, selectedChoices, isDisclosed]);

  const visibleQuestions = React.useMemo(() => {
    switch (filter) {
      case "marked":
        return bookmarks;
      case "complete":
        return categorizedAnswers.answered;
      case "incorrect":
        return categorizedAnswers.incorrect;
      case "correct":
        return categorizedAnswers.correct;
      case "incomplete":
        return categorizedAnswers.incomplete;
      case "all":
      default:
        return Array.from({ length: questions.length }, (_, i) => i);
    }
  }, [filter, questions.length, bookmarks, categorizedAnswers]);

  if (questions.length === 0) return null;

  return (
    <div
      id="grid"
      className="max-h-50 flex flex-wrap content-start p-2.5 overflow-y-auto border-y border-grey-200"
    >
      {visibleQuestions.map((i) => (
        <Cell
          key={i}
          index={i}
          bookmarks={bookmarks}
          answered={categorizedAnswers.answered}
        />
      ))}
    </div>
  );
};

export default GridComponent;

export interface GridProps {
  filter: QuestionFilter;
}
