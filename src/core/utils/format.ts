import type { LangCode } from "../types";
import { format } from "date-fns";

/**
 * Format a date to 'MM/dd/yyyy'
 * @param {string} date - The date string to format.
 * @returns {string} - The formatted date string.
 */
export function formatDate(date: number | string | Date): string {
  try {
    return format(new Date(date), "dd/MM/yyyy");
  } catch {
    return "00/00/0000";
  }
}

/**
 * Format seconds into total minutes and seconds, e.g. "239m 13s". `null` means there is no timer
 * to show (a supervisor preview session never runs a real countdown) — the caller decides what
 * counts as "no timer", this just renders the placeholder for it.
 * @param {number | null} sec - The time in seconds to format, or null for no timer.
 * @returns {string}
 */
export function formatTimer(sec: number | null): string {
  if (sec === null) return "--- ---";

  try {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;

    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  } catch {
    return "0m 00s";
  }
}

/**
 * Format a span of seconds as "2h 15m", or "15m" under an hour. Null for anything that is not a
 * real span — a negative one is the caller's arithmetic disagreeing with itself (a clock reported
 * above its own exam duration), not a duration to render.
 * @param {number} totalSeconds - The span in seconds.
 * @returns {string | null} The formatted span, or null when there isn't one.
 */
export function formatDurationHoursMinutes(
  totalSeconds: number,
): string | null {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return null;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

// Choice labels for different languages
const CHOICE_LABELS = {
  en: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  ar: "أبجدهوزحطيكلمنسعفصقرشتثخذضظغ".split(""),
} as const;

/**
 * Convert index to choice label (A, B, C... or أ, ب, ج...)
 * @param {number} index - The index of the choice
 * @param {LangCode} lang - The language code
 * @returns Formatted choice label
 */
export function formatChoiceLabel(index: number, lang: LangCode): string {
  try {
    return CHOICE_LABELS[lang][index] || "A";
  } catch {
    return "A";
  }
}

/**
 * Joins the labels of a disclosed question's correct choices ("A, C") for the review Explanation.
 * @param {{ choices: { position: number; isCorrect: boolean }[] }} question - A disclosed question.
 * @param {LangCode} lang - The language code.
 * @returns Comma-separated choice labels.
 */
export function formatCorrectAnswerLabel(
  question: { choices: { position: number; isCorrect: boolean }[] },
  lang: LangCode,
): string {
  return question.choices
    .filter((choice) => choice.isCorrect)
    .map((choice) => formatChoiceLabel(choice.position, lang))
    .join(", ");
}
