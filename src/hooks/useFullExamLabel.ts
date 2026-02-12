import exams from "../data/exam-data/fullExams.json"
import { RANDOM_EXAM_ID } from "../constants";
import { translate } from "../utils/translation";
import type { DropdownItem } from "../types";
import useSettings from "./useSettings";

/**
 * Custom hook to get a full exam label (name) from its ID
 * @param id - Exam id
 */
export default function useFullExamLabel(id: DropdownItem['id']): string {
  const { settings } = useSettings();
  const langCode = settings.language;

  if (id === RANDOM_EXAM_ID) {
    return translate('cover.random')
  } else {
    const examLabel = (exams.find(e => e.id === id))?.name[langCode]
    if (examLabel) {
      return examLabel;
    }
    throw new Error(`exam with id ${id} does not exist`)
  }
}