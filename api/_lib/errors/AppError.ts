import type { AppErrorCode } from "../../../shared/schemas/api.schema.js"

export type AppErrorParams = {
  statusCode: number
  code: AppErrorCode
  message: string
}

export class AppError extends Error {
  readonly statusCode: number
  readonly code: AppErrorCode

  constructor({ statusCode, code, message }: AppErrorParams) {
    super(message)
    this.name = "AppError"
    this.statusCode = statusCode
    this.code = code
  }
}
