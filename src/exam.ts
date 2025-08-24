import type { Exam } from './types'

import { createContext } from 'react'

export const ExamContext = createContext<Exam>({} as Exam)
