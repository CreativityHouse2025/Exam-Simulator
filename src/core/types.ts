import type { LangCode as SharedLangCode } from "@shared/exam.schema";
import type { ExamDetails } from "./api/apiTypes";

// Language types
export type LangDir = "rtl" | "ltr";
/** Re-exported, not redeclared: the API decides which languages exist. */
export type LangCode = SharedLangCode;
export type LangName = "العربية" | "English";
export interface Lang {
  code: LangCode;
  name: LangName;
  dir: LangDir;
}
// User settings (initially null until user inserts data)
export type Settings = {
  /** last choice of language */
  language: Lang["code"];
  /** app version for future updates */
  appVersion: string;
};
export type SettingsContextType = {
  /** current user settings state */
  settings: Settings;
  /** state setter */
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
};
/** Per-language content fields, one per language. */
type PerLanguageField = "textAr" | "textEn" | "explanationAr" | "explanationEn";
/** `T` with its per-language fields replaced by `text`/`explanation` in the chosen language. */
export type Localized<T> = T extends unknown
  ? Omit<T, PerLanguageField | "choices"> & { text: string } & (T extends {
        explanationAr: string;
      }
        ? { explanation: string }
        : unknown) &
      (T extends { choices: (infer C)[] }
        ? { choices: Localized<C>[] }
        : unknown)
  : never;
/** Exam details with name and description in the chosen language. */
export type LocalizedExamDetails = Omit<ExamDetails, "name" | "description"> & {
  name: string;
  description: string;
};
// Type for the toast component state. Holds a translation key, not copy — the toast translates
// at render time so the message follows the current language.
export type ToastState = {
  translationKey: string;
  visible: boolean;
};
export interface ToastContextType {
  translationKey: string;
  visible: boolean;
  setToast: React.Dispatch<React.SetStateAction<ToastState>>;
}
