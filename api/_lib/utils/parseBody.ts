import { AppError } from "../errors/AppError.js"

const DEFAULT_MAX_BODY_BYTES = 10 * 1024 // 10 KB

/** Asserts that the value is a non-null object and returns it as a string-keyed record. */
export function assertJsonObject(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "Request body must be a JSON object" })
  }
  return body as Record<string, unknown>
}

/**
 * Reads the request body as text, enforces a size limit, then parses as JSON.
 * @param request - The incoming request.
 * @param maxBytes - Maximum allowed body size in bytes. Defaults to 10 KB.
 * @returns The parsed JSON value (caller is responsible for further validation).
 */
export async function parseJsonBody(request: Request, maxBytes = DEFAULT_MAX_BODY_BYTES): Promise<unknown> {
  const contentLength = request.headers.get("Content-Length")
  if (contentLength && Number(contentLength) > maxBytes) {
    throw new AppError({ statusCode: 413, code: "VALIDATION_ERROR", message: "Request body too large" })
  }

  const text = await request.text()
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new AppError({ statusCode: 413, code: "VALIDATION_ERROR", message: "Request body too large" })
  }

  return JSON.parse(text)
}
