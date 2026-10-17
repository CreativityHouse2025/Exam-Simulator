import React from "react";
import { ExamContext } from "../contexts";
import useSettings from "@/core/hooks/useSettings";
import { localizeExamDetails, localizeQuestion } from "@/core/utils/localize";
import type { ExamContent } from "../types";

/**
 * Sets ExamContext from already-resolved content, localized to the current language. Never
 * fetches — SessionProvider builds its props from an attempt, revision or preview response.
 */
export default function ExamProvider({
  examDetails,
  questions,
  children,
}: ExamContent & { children: React.ReactNode }) {
  const lang = useSettings().settings.language;

  const value = React.useMemo(
    () => ({
      examDetails: examDetails && localizeExamDetails(examDetails, lang),
      questions:
        questions &&
        questions.map((question) => localizeQuestion(question, lang)),
    }),
    [examDetails, questions, lang],
  );

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
}
