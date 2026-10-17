import { differenceInCalendarDays } from "date-fns";
import type { LangCode } from "@/core/types";

/** Inside this many days, an enrollment's countdown turns into a warning. */
export const EXPIRY_WARNING_DAYS = 14;

export function daysUntil(date: string): number {
  return differenceInCalendarDays(new Date(date), new Date());
}

/** Always "in X days", in the UI language with Latin digits like the rest of the app. */
export function formatDaysFromNow(days: number, langCode: LangCode): string {
  return new Intl.RelativeTimeFormat(`${langCode}-u-nu-latn`, {
    numeric: "always",
  }).format(days, "day");
}
