import exams from "../data/exam/full-exams.json"
import useSettings from "./useSettings";

/**
 * Custom hook to get a full exam label (name) from its ID.
 */
export default function useFullExamLabel(id: number): string | undefined {
  const { settings } = useSettings();
  const langCode = settings.language;

  const examLabel = exams.find(e => e.id === id)?.name[langCode]
  return examLabel
}