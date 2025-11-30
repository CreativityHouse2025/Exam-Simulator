import type { Lang, LangCode, Session } from './types'
import styled from "styled-components";

// Theme constants
const colors = ['#b5965d', '#593752', '#301e2c', '#f8e3e0', '#000000', '#ffffff']

const grey = [
  '#FAFAFA',
  '#F2F2F2',
  '#E6E5E5',
  '#D9D8D8',
  '#CDCCCB',
  '#C0BFBF',
  '#B3B2B2',
  '#A7A5A5',
  '#9A9898',
  '#817E7E',
  '#747272',
  '#676565',
  '#5A5858',
  '#4D4C4C',
  '#403F3F'
]

const shadows = [
  'none',
  '0 1px 2px rgba(0,0,0,.1)',
  '0px 1px 3px 0px rgba(0, 0, 0, 0.2),0px 1px 1px 0px rgba(0, 0, 0, 0.14),0px 2px 1px -1px rgba(0, 0, 0, 0.12)',
  '0px 1px 5px 0px rgba(0, 0, 0, 0.2),0px 2px 2px 0px rgba(0, 0, 0, 0.14),0px 3px 1px -2px rgba(0, 0, 0, 0.12)',
  '0px 1px 8px 0px rgba(0, 0, 0, 0.2),0px 3px 4px 0px rgba(0, 0, 0, 0.14),0px 3px 3px -2px rgba(0, 0, 0, 0.12)',
  '0px 2px 4px -1px rgba(0, 0, 0, 0.2),0px 4px 5px 0px rgba(0, 0, 0, 0.14),0px 1px 10px 0px rgba(0, 0, 0, 0.12)',
  '0px 3px 5px -1px rgba(0, 0, 0, 0.2),0px 5px 8px 0px rgba(0, 0, 0, 0.14),0px 1px 14px 0px rgba(0, 0, 0, 0.12)',
  '0px 3px 5px -1px rgba(0, 0, 0, 0.2),0px 6px 10px 0px rgba(0, 0, 0, 0.14),0px 1px 18px 0px rgba(0, 0, 0, 0.12)',
  '0px 4px 5px -2px rgba(0, 0, 0, 0.2),0px 7px 10px 1px rgba(0, 0, 0, 0.14),0px 2px 16px 1px rgba(0, 0, 0, 0.12)',
  '0px 5px 5px -3px rgba(0, 0, 0, 0.2),0px 8px 10px 1px rgba(0, 0, 0, 0.14),0px 3px 14px 2px rgba(0, 0, 0, 0.12)',
  '0px 5px 6px -3px rgba(0, 0, 0, 0.2),0px 9px 12px 1px rgba(0, 0, 0, 0.14),0px 3px 16px 2px rgba(0, 0, 0, 0.12)',
  '0px 6px 6px -3px rgba(0, 0, 0, 0.2),0px 10px 14px 1px rgba(0, 0, 0, 0.14),0px 4px 18px 3px rgba(0, 0, 0, 0.12)',
  '0px 6px 7px -4px rgba(0, 0, 0, 0.2),0px 11px 15px 1px rgba(0, 0, 0, 0.14),0px 4px 20px 3px rgba(0, 0, 0, 0.12)',
  '0px 7px 8px -4px rgba(0, 0, 0, 0.2),0px 12px 17px 2px rgba(0, 0, 0, 0.14),0px 5px 22px 4px rgba(0, 0, 0, 0.12)',
  '0px 7px 8px -4px rgba(0, 0, 0, 0.2),0px 13px 19px 2px rgba(0, 0, 0, 0.14),0px 5px 24px 4px rgba(0, 0, 0, 0.12)',
  '0px 7px 9px -4px rgba(0, 0, 0, 0.2),0px 14px 21px 2px rgba(0, 0, 0, 0.14),0px 5px 26px 4px rgba(0, 0, 0, 0.12)',
  '0px 8px 9px -5px rgba(0, 0, 0, 0.2),0px 15px 22px 2px rgba(0, 0, 0, 0.14),0px 6px 28px 5px rgba(0, 0, 0, 0.12)',
  '0px 8px 10px -5px rgba(0, 0, 0, 0.2),0px 16px 24px 2px rgba(0, 0, 0, 0.14),0px 6px 30px 5px rgba(0, 0, 0, 0.12)',
  '0px 8px 11px -5px rgba(0, 0, 0, 0.2),0px 17px 26px 2px rgba(0, 0, 0, 0.14),0px 6px 32px 5px rgba(0, 0, 0, 0.12)',
  '0px 9px 11px -5px rgba(0, 0, 0, 0.2),0px 18px 28px 2px rgba(0, 0, 0, 0.14),0px 7px 34px 6px rgba(0, 0, 0, 0.12)',
  '0px 9px 12px -6px rgba(0, 0, 0, 0.2),0px 19px 29px 2px rgba(0, 0, 0, 0.14),0px 7px 36px 6px rgba(0, 0, 0, 0.12)',
  '0px 10px 13px -6px rgba(0, 0, 0, 0.2),0px 20px 31px 3px rgba(0, 0, 0, 0.14),0px 8px 38px 7px rgba(0, 0, 0, 0.12)',
  '0px 10px 13px -6px rgba(0, 0, 0, 0.2),0px 21px 33px 3px rgba(0, 0, 0, 0.14),0px 8px 40px 7px rgba(0, 0, 0, 0.12)',
  '0px 10px 14px -6px rgba(0, 0, 0, 0.2),0px 22px 35px 3px rgba(0, 0, 0, 0.14),0px 8px 42px 7px rgba(0, 0, 0, 0.12)',
  '0px 11px 14px -7px rgba(0, 0, 0, 0.2),0px 23px 36px 3px rgba(0, 0, 0, 0.14),0px 9px 44px 8px rgba(0, 0, 0, 0.12)',
  '0px 11px 15px -7px rgba(0, 0, 0, 0.2),0px 24px 38px 3px rgba(0, 0, 0, 0.14),0px 9px 46px 8px rgba(0, 0, 0, 0.12)'
]

// Default theme object
export const DEFAULT_THEME = {
  grey,
  black: '#333333',
  white: colors[5],
  primary: colors[0],
  secondary: colors[1],
  tertiary: colors[2],
  quatro: colors[3],
  borderRadius: '2px',
  shadows,
  scrollbar: '8px',
  fontSize: '10px',
  fontFamily: '"Open Sans", sans-serif',
  correct: '#4CAF50',
  incorrect: '#F44336'
} as const

// Session action types
export const SESSION_ACTION_TYPES = {
  SET_INDEX: 'SET_INDEX' as const,
  SET_BOOKMARKS: 'SET_BOOKMARKS' as const,
  SET_ANSWERS: 'SET_ANSWERS' as const,
  SET_TIME: 'SET_TIME' as const,
  SET_TIMER_PAUSED: 'SET_TIMER_PAUSED' as const,
  SET_EXAM_STATE: 'SET_EXAM_STATE' as const,
  SET_REVIEW_STATE: 'SET_REVIEW_STATE' as const
} as const

// Property mapping for session actions
export const SESSION_ACTION_PROPS = {
  SET_INDEX: 'index' as const,
  SET_BOOKMARKS: 'bookmarks' as const,
  SET_ANSWERS: 'answers' as const,
  SET_TIME: 'time' as const,
  SET_TIMER_PAUSED: 'paused' as const,
  SET_EXAM_STATE: 'examState' as const,
  SET_REVIEW_STATE: 'reviewState' as const
} as const

// Constant for the general category (mix of all categories)
export const GENERAL_CATEGORY_ID = 0

// Constant for category menu padding (shared variable)
export const MENU_PADDING = "1.6rem 1.4rem"

// Default session
export const DEFAULT_SESSION: Session = {
  index: 0 as const,
  maxTime: 0 as const,
  time: 0 as const,
  paused: false as const,
  examState: 'not-started' as const,
  reviewState: 'summary' as const,
  questions: [] as const,
  answers: [] as const,
  categoryId: GENERAL_CATEGORY_ID,
  bookmarks: [] as const,
} as const

// Language configuration
export const LANGUAGES: Record<LangCode, Lang> = {
  ar: { code: 'ar', name: 'العربية', dir: 'rtl' } as const,
  en: { code: 'en', name: 'English', dir: 'ltr' } as const
} as const

// Wrappe component to query for reduced animations in user's device
export const ReducedMotionWrapper = styled.div`
  @media (prefers-reduced-motion: reduce) {
    & *,
    & *::before,
    & *::after {
      animation: none !important;
      transition: none !important;
      transform: none !important;
      scroll-behavior: auto !important;
    }
  }
`;