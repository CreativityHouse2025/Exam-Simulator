import type { Lang, LangCode } from "../types";

// Translation system
const translations = new Map<string, string>();
let currentLang: LangCode | null = null;

export const translate = (
  key: string,
  replacements?: (string | number)[],
): string => {
  const value = translations.get(key);
  if (!value) return key;

  if (!replacements?.length) return value;

  return replacements.reduce<string>(
    (result, replacement, index) =>
      result.replace(new RegExp(`\\$${index + 1}`, "g"), String(replacement)),
    value,
  );
};

export const hasTranslation = (): boolean => translations.size > 0;

export const setTranslation = (
  lang: Lang,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pre-existing, unrelated to this change
  translationData: Record<string, any>,
): void => {
  if (lang.code === currentLang && translations.size > 0) return;

  currentLang = lang.code;
  translations.clear();

  flattenTranslations(translationData);
};

const flattenTranslations = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pre-existing, unrelated to this change
  obj: Record<string, any>,
  parentKey = "",
): void => {
  Object.entries(obj).forEach(([key, value]) => {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;

    if (typeof value === "object" && value !== null) {
      flattenTranslations(value, fullKey);
    } else if (typeof value === "string") {
      translations.set(fullKey, value);
    }
  });
};
