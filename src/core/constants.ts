import type { Lang, LangCode, Settings } from "./types";

// Language configuration
export const LANGUAGES: Record<LangCode, Lang> = {
  ar: { code: "ar", name: "العربية", dir: "rtl" } as const,
  en: { code: "en", name: "English", dir: "ltr" } as const,
} as const;
// Default user settings
export const DEFAULT_USER_SETTINGS: Settings = {
  language: "en",
  appVersion: "1.4",
};
