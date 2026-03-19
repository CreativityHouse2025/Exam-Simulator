import { AppError } from "../errors/AppError.js"

/** Asserts that the value is a non-null object and returns it as a string-keyed record. */
export function assertJsonObject(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "Request body must be a JSON object" })
  }
  return body as Record<string, unknown>
}
