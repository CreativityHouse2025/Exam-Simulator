import { drizzle } from "drizzle-orm/postgres-js"
import { DrizzleQueryError } from "drizzle-orm/errors"
import postgres from "postgres"
import type { z } from "zod"
import { requireEnv } from "../utils/env.js"
import { AppError } from "../errors/AppError.js"
import type { AppErrorCode } from "../../../shared/schemas/api.schema.js"
import * as schema from "./schema.js"

/**
 * The one Drizzle client, for every business-logic read and write. Auth (sign-in, sessions, the
 * auth admin API) stays on the Supabase SDK in `supabaseClient.ts`.
 *
 * Module-level so a warm function instance reuses its connections. `prepare: false` because the
 * Supavisor transaction-mode pooler does not support prepared statements.
 */
export const db = drizzle(postgres(requireEnv("DATABASE_URL"), { prepare: false }), { schema })

/**
 * Why a query failed, as Postgres put it: `SQLSTATE message`. A constraint violation's message
 * already names the constraint.
 *
 * Drizzle wraps every driver failure in a `DrizzleQueryError` whose own message is the SQL plus its
 * parameter VALUES — user ids, answer payloads, search text — and not the reason. The reason is the
 * `PostgresError` in `cause`, so that is what gets described. Neither the parameters nor `detail`
 * (which echoes the offending key values) are read.
 */
function describeFailure(error: unknown): string {
  const cause = error instanceof DrizzleQueryError ? error.cause : error

  if (cause instanceof postgres.PostgresError) {
    return `${cause.code} ${cause.message}`
  }

  return cause instanceof Error ? cause.message : String(cause)
}

/**
 * The 500 a failed query becomes. The driver's reason goes into the log line (never the response
 * body — see `errorResponse`), after `context` naming what was being read or written.
 */
export function queryFailed(context: string, error: unknown, code: AppErrorCode = "INTERNAL_ERROR"): AppError {
  return new AppError({ statusCode: 500, code, message: `${context} (${describeFailure(error)})` })
}

/** Awaits a query, turning any driver failure into `queryFailed(context, …, code)`. */
export async function runQuery<T>(
  context: string,
  query: PromiseLike<T>,
  code: AppErrorCode = "INTERNAL_ERROR",
): Promise<T> {
  try {
    return await query
  } catch (error) {
    throw queryFailed(context, error, code)
  }
}

/**
 * Narrows the rows a raw Postgres function call returned — `unknown` to its declared shape.
 *
 * A row that does not match means the function and `schema.ts` disagree, which is a deployment
 * error rather than bad input, so it surfaces as a 500 carrying the function's name.
 */
export function parseRows<T extends z.ZodType>(fn: string, schema: T, rows: readonly unknown[]): z.infer<T>[] {
  const parsed = schema.array().safeParse(rows)

  if (!parsed.success) {
    throw new AppError({
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: `${fn} returned an unexpected row shape (${parsed.error.message})`,
    })
  }

  return parsed.data
}

/** A function that returns exactly one row: `parseRows`, then fail loudly on anything else. */
export function parseSingleRow<T extends z.ZodType>(fn: string, schema: T, rows: readonly unknown[]): z.infer<T> {
  const [row, ...rest] = parseRows(fn, schema, rows)

  if (row === undefined || rest.length > 0) {
    throw new AppError({
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: `${fn} returned ${rows.length} rows, expected exactly one`,
    })
  }

  return row
}
