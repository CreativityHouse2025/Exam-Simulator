import type { AppErrorCode, AppErrorParams } from "../types.js"

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
