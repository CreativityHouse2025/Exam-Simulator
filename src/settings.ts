import { createContext } from 'react'

// language

export type LangDir = 'rtl' | 'ltr'
export type LangCode = 'ar' | 'en'
export type LangName = 'العربية' | 'English'
export interface Lang {
  code: LangCode
  name: LangName
  dir: LangDir
}

export const langs: Record<LangCode, Lang> = {
  ar: { code: 'ar', name: 'العربية', dir: 'rtl' } as Lang,
  en: { code: 'en', name: 'English', dir: 'ltr' } as Lang
}

export function isLangCode(code: string): code is LangCode {
  return code in Object.keys(langs)
}
export function isLangName(name: string): name is LangName {
  return Object.values(langs).some((l) => l.name === name)
}

export const LangContext = createContext<Lang>(langs.ar)

// translation

const translation = new Map<string, string>()

export function translate(key: string, replacements?: (string | number)[]): string {
  let val = translation.get(key)
  if (!val) return key

  if (replacements && replacements.length > 0)
    for (let i = 0; i < replacements.length; i++)
      val = val.replace(new RegExp(`\\$${i + 1}`, 'g'), replacements[i].toString())

  return val
}

export function setTranslation(lang: Lang, obj: object) {
  if (lang.code === translation.get('lang')) return

  translation.set('lang', lang.code)
  flattenJson(obj)

  document.documentElement.lang = lang.code
}

export function flattenJson(obj: object, parentKey?: string) {
  for (const key in obj) {
    const el: object | string = obj[key]
    const fullKey = parentKey ? `${parentKey}.${key}` : key

    if (typeof el === 'object') {
      flattenJson(el, fullKey)
    } else {
      translation.set(fullKey, el)
    }
  }
}
