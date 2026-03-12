import type { VercelRequest, VercelResponse } from "@vercel/node"

export type AppErrorCode = "METHOD_NOT_ALLOWED" | "MISSING_FIELDS" | "INTERNAL_ERROR"

export type ErrorResponseBody = {
  error: {
    code: AppErrorCode
    message: string
  }
}

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


export type AppErrorParams = {
  statusCode: number
  code: AppErrorCode
  message: string
}

export type VercelHandler = (req: VercelRequest, res: VercelResponse) => Promise<VercelResponse | void>
