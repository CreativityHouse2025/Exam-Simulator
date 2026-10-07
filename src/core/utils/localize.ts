import type { DisclosedQuestion, ExamDetails, Question } from "../api/apiTypes";
import type { LangCode, Localized, LocalizedExamDetails } from "../types";

/** A question with its text, explanation and choices in `lang`. */
export function localizeQuestion<Q extends Question | DisclosedQuestion>(
  question: Q,
  lang: LangCode,
): Localized<Q> {
  const isAr = lang === "ar";
  const { textAr, textEn, explanationAr, explanationEn, choices, ...rest } =
    question as Q &
      Partial<Pick<DisclosedQuestion, "explanationAr" | "explanationEn">>;

  return {
    ...rest,
    text: isAr ? textAr : textEn,
    ...(explanationAr !== undefined && {
      explanation: isAr ? explanationAr : explanationEn,
    }),
    choices: choices.map(({ textAr, textEn, ...choice }) => ({
      ...choice,
      text: isAr ? textAr : textEn,
    })),
  } as Localized<Q>;
}

/** Exam details with name and description in `lang`. */
export function localizeExamDetails(
  examDetails: ExamDetails,
  lang: LangCode,
): LocalizedExamDetails {
  return {
    ...examDetails,
    name: examDetails.name[lang],
    description: examDetails.description[lang],
  };
}
