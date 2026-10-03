import type { LangCode } from "../types.js";

import { formatDistance, format } from "date-fns";

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {T[]} array - The array to shuffle
 * @returns {T[]} - The shuffled array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Format a date string to a human-readable format
 * @param {string} date - The date string to format.
 * @returns {string} - The formatted date string.
 */
export function formatCreatedAt(date: string): string {
  try {
    return formatDistance(new Date(date), new Date()).replace(
      /about|over|almost|less/,
      "",
    );
  } catch {
    return "Unknown time";
  }
}

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
 * Format seconds into HH:MM:SS. `null` means there is no timer to show (a supervisor preview
 * session never runs a real countdown) — the caller decides what counts as "no timer", this just
 * renders the placeholder for it.
 * @param {number | null} sec - The time in seconds to format, or null for no timer.
 * @returns {string}
 */
export function formatTimer(sec: number | null): string {
  if (sec === null) return "--:--:--";

  try {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;

    return [hours, minutes, seconds]
      .map((unit) => unit.toString().padStart(2, "0"))
      .join(":");
  } catch {
    return "00:00:00";
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

export function hasInvalidNameChars(name: string): boolean {
  // \p{L} = any kind of letter from any language
  // \s = space
  const invalidPattern = /[^\p{L}\s]/u;
  return invalidPattern.test(name);
}
