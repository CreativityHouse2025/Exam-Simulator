import exams from "../data/exam-data/full-exams.json"
import useSettings from "./useSettings";

/**
 * Custom hook to get a full exam label (name) from its ID.
 */
export default function useFullExamLabel(id: number): string {
  const { settings } = useSettings();
  const langCode = settings.language;

  const examLabel = exams.find(e => e.id === id)?.name[langCode]
  if (examLabel) return examLabel

  throw new Error(`exam with id ${id} does not exist`)
}