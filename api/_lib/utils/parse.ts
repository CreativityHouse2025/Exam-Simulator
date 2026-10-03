import { z } from "zod"
import { AppError } from "../errors/AppError.js"

/**
 * Parses `input` against `schema`, or throws a 400 `AppError` listing every failure.
 *
 * All parse failures map to `VALIDATION_ERROR`. The message is developer-facing only: the frontend
 * renders translated copy keyed off the error code and never displays this string.
 */
export function parseOrThrow<T extends z.ZodType>(
  schema: T,
  input: unknown,
): z.infer<T> {
  const result = schema.safeParse(input)

  if (!result.success) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: z.prettifyError(result.error),
    })
  }

  return result.data
}
