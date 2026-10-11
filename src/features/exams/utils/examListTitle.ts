import { translate } from "@/core/utils/translation";
import type { Exam } from "@/core/api/apiTypes";
import type { LangCode } from "@/core/types";

/** Heading of one tag's exam list: the tag's name, or a generic label when the list is empty. */
export function examListTitle(
  exams: Exam[],
  langCode: LangCode,
): string {
  return exams[0]?.tag.name[langCode] ?? translate("catalog.exams");
}
