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
  | "UNAUTHORIZED"


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

// Email API arguments type
export type SendEmailRequest = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: {
    filename: string;
    /** pdf content in base64 */
    content: string;
  }[]
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

export type AuthenticatedApiHandler = (req: Request, userId: string) => Promise<Response>
