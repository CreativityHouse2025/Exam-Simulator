import { AppError } from "../errors/AppError.js"

const DEFAULT_MAX_BODY_BYTES = 10 * 1024 // 10 KB

/**
 * Reads the request body as text, enforces a size limit, then parses as JSON.
 * @param request - The incoming request.
 * @param maxBytes - Maximum allowed body size in bytes. Defaults to 10 KB.
 * @returns The parsed JSON value (caller is responsible for further validation).
 */
export async function parseJsonBody(request: Request, maxBytes = DEFAULT_MAX_BODY_BYTES): Promise<unknown> {
  const contentLength = request.headers.get("Content-Length")
  // use content-length header first if available
  if (contentLength && Number(contentLength) > maxBytes) {
    throw new AppError({ statusCode: 413, code: "VALIDATION_ERROR", message: "Request body too large" })
  }

  // fallback to manual encoding
  const text = await request.text()
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new AppError({ statusCode: 413, code: "VALIDATION_ERROR", message: "Request body too large" })
  }

  return JSON.parse(text)
}
