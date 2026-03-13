export type AppErrorCode =
  | "METHOD_NOT_ALLOWED"
  | "MISSING_FIELDS"
  | "INTERNAL_ERROR"
  | "VALIDATION_ERROR"
  | "SUBSCRIPTION_REQUIRED"
  | "SIGNUP_FAILED"


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
