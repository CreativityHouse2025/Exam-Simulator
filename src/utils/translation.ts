import type { Lang, LangCode } from '../types'

// Translation system
const translations = new Map<string, string>()
let currentLang: LangCode | null = null

export const translate = (key: string, replacements?: (string | number)[]): string => {
  const value = translations.get(key)
  if (!value) return key

  if (!replacements?.length) return value

  // @ts-expect-error
  return replacements.reduce(
    // @ts-expect-error
    (result, replacement, index) => result.replace(new RegExp(`\\$${index + 1}`, 'g'), replacement.toString()),
    value
  )
}

export const hasTranslation = (key: string): boolean => translations.has(key)

export const setTranslation = (lang: Lang, translationData: Record<string, any>): void => {
  if (lang.code === currentLang && translations.size > 0) return

  currentLang = lang.code
  translations.clear()

  flattenTranslations(translationData)
}

const flattenTranslations = (obj: Record<string, any>, parentKey = ''): void => {
  Object.entries(obj).forEach(([key, value]) => {
    const fullKey = parentKey ? `${parentKey}.${key}` : key

    if (typeof value === 'object' && value !== null) {
      flattenTranslations(value, fullKey)
    } else if (typeof value === 'string') {
      translations.set(fullKey, value)
    }
  })
}
