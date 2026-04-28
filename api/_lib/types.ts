export type AppErrorCode =
  | "METHOD_NOT_ALLOWED"
  | "MISSING_FIELDS"
  | "INTERNAL_ERROR"
  | "VALIDATION_ERROR"
  | "SUBSCRIPTION_REQUIRED"
  | "SIGNUP_FAILED"
  | "INVALID_CREDENTIALS"
  | "ACCOUNT_EXPIRED"
  | "SIGNIN_FAILED"
  | "SIGNOUT_FAILED"
  | "UNAUTHORIZED"
  | "CONFIRMATION_FAILED"
  | "SUBSCRIPTION_CHECK_FAILED"
  | "PASSWORD_UPDATE_FAILED"
  | "SESSION_CONFLICT"
  | "ATTEMPT_CREATE_FAILED"
  | "NOT_FOUND"
  | "FORBIDDEN"


export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: {
    code: AppErrorCode;
    message: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type SendEmailRequestBody = {
  subject: string
  text: string
  html?: string
  attachments?: {
    filename: string
    /** pdf content in base64 */
    content: string
  }[]
}

// Minimal exam types scoped to the API — not shared with the frontend
export type LangCode = 'ar' | 'en'

export type ReportChoice = {
  text: string
  correct: boolean
}

export type ReportQuestion = {
  id: number
  type: string
  categoryId: number
  text: string
  explanation: string
  choices: ReportChoice[]
  answer: number[]
}

export type ReportTranslations = {
  companyName: string
  reportTitle: string
  missing: string
  correct: string
  incorrect: string
  explanation: string
  fullName: string
}

export type GenerateReportRequestBody = {
  exam: ReportQuestion[]
  userAnswers: number[][]
  langCode: LangCode
  userFullName: string
  translations: ReportTranslations
}


export type SignupRequestBody = {
  email: string
  password: string
  first_name: string
  last_name: string
}

export type AppErrorParams = {
  statusCode: number
  code: AppErrorCode
  message: string
}

export type ApiHandler = (req: Request) => Promise<Response>

export type SigninRequestBody = {
  email: string
  password: string
  /**
   * When `false`, signin is rejected with `SESSION_CONFLICT` if the user already has an active session.
   * When `true`, all other active sessions are terminated and the new session proceeds.
   *
   * Must always be sent explicitly — there is no default.
   */
  force: boolean
}

export type UserProfile = {
  id: string
  email: string
  first_name: string
  last_name: string
  expires_at: string
}

export type SigninResult = {
  user: UserProfile
  access_token: string
  refresh_token: string
}

export type TokenExchangeRequestBody = {
  access_token: string
  refresh_token: string
}

export type PasswordResetRequestBody = Pick<SigninRequestBody, "email">

export type UpdatePasswordRequestBody = Pick<SigninRequestBody, "password">

export type ResponseHeaders = [string, string][]

export type AuthUser = {
  id: string
  email: string
  accessToken: string
}

export type AuthenticatedApiHandler = (req: Request, authUser: AuthUser, cookieHeaders?: ResponseHeaders) => Promise<Response>

type InsertAttemptFull = {
  exam_type: "full"
  exam_id: number
  category_id: null
  question_ids: number[]
  choices_orders: number[][]
  duration_minutes: number
}

type InsertAttemptDomain = {
  exam_type: "domain"
  category_id: number
  exam_id: null
  question_ids: number[]
  choices_orders: number[][]
  duration_minutes: number
}

export type InsertAttemptRequestBody = InsertAttemptFull | InsertAttemptDomain

export type AttemptSummary = {
  id: string
  exam_type: string
  exam_id: number | null
  category_id: number | null
  exam_state: string
  score: number
  status: string | null
  created_at: string
}

export type ListAttemptsResult = {
  attempts: AttemptSummary[]
}

export type AttemptQuestion = {
  question_index: number
  question_id: number
  choices_order: number[]
  selected_choices: number[]
  is_bookmarked: boolean
}

export type GetAttemptResult = {
  attempt: AttemptSummary
  questions: AttemptQuestion[]
}
