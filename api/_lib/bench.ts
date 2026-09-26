/**
 * TEMPORARY — database latency benchmark: Supabase SDK (HTTP via PostgREST) vs Drizzle (TCP via
 * Supavisor). Delete this file, `api/bench/`, and the `functions` block in `vercel.json` once the
 * numbers are in.
 *
 * Usage (preview deployment, signed in as a supervisor):
 *   GET /api/bench/<fra1|iad1|sin1>?scenario=<single|waterfall|collapsed|cold>&n=50&c=20
 *
 *   single     one role lookup (what withRole runs)
 *   waterfall  role -> exam -> track access -> questions, each awaited in turn (today's start path)
 *   collapsed  the same four reads in two levels. SDK: Promise.all only. Drizzle: Promise.all + a join
 *   cold       one query on a brand-new Postgres connection (TCP + TLS + auth). The SDK has no
 *              equivalent inside a warm instance — undici pools connections process-wide — so its
 *              cold cost is the first request an instance serves; see `invocation` in the output
 *
 * Every read is read-only. Timings are taken inside the function, so the caller's own distance to
 * the region does not appear in them.
 */
import { drizzle } from "drizzle-orm/postgres-js"
import { sql } from "drizzle-orm"
import postgres from "postgres"
import { z } from "zod"
import { supabaseAdmin } from "./supabaseClient.js"
import { requireEnv } from "./utils/env.js"
import { parseOrThrow } from "./utils/parse.js"
import { AppError } from "./errors/AppError.js"
import { successResponse } from "./utils/response.js"
import { withErrorHandler } from "./middleware/withErrorHandler.js"
import { withAuth } from "./middleware/withAuth.js"
import { withRole } from "./middleware/withRole.js"
import { getExam } from "./services/examService.js"
import { assertTrackAccess } from "./services/trackService.js"
import { getQuestions } from "./services/questionService.js"

const databaseUrl = requireEnv("DATABASE_URL")

// prepare: false — the transaction-mode pooler does not support prepared statements.
const db = drizzle(postgres(databaseUrl, { prepare: false }))

/** Requests this instance has served. 1 means the SDK numbers include its connection setup. */
let invocation = 0

const BenchQuerySchema = z.object({
  scenario: z.enum(["single", "waterfall", "collapsed", "cold"]),
  n: z.coerce.number().int().min(1).max(200).default(50),
  c: z.coerce.number().int().min(1).max(50).default(20),
})

type Fixture = { userId: string; examId: number; trackId: string; questionIds: number[] }

let fixture: Fixture | undefined

/** A real student with an active enrollment, and one exam of that track. Untimed, once per instance. */
async function loadFixture(): Promise<Fixture> {
  if (fixture) return fixture

  const [row] = await db.execute<{ user_id: string; exam_id: number; track_id: string }>(sql`
    select e.user_id, x.id as exam_id, x.track_id
      from public.enrollments e
      join public.users u on u.id = e.user_id
      join public.exams x on x.track_id = e.track_id
     where u.role = 'student' and e.created_at <= now() and e.expires_at > now()
     limit 1`)

  if (!row) {
    throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "No student with an active enrollment" })
  }

  const [ids] = await db.execute<{ question_ids: number[] }>(sql`
    select array_agg(question_id order by question_index) as question_ids
      from public.exam_questions where exam_id = ${row.exam_id}`)

  fixture = { userId: row.user_id, examId: row.exam_id, trackId: row.track_id, questionIds: ids.question_ids }
  return fixture
}

// --- SDK side: the production code paths, unchanged ---------------------------------------------

async function sdkRole({ userId }: Fixture) {
  const { error } = await supabaseAdmin.from("users").select("role").eq("id", userId).single()
  if (error) throw new AppError({ statusCode: 500, code: "INTERNAL_ERROR", message: error.message })
}

async function sdkWaterfall(f: Fixture) {
  await sdkRole(f)
  const exam = await getExam(f.examId)
  await assertTrackAccess(f.userId, exam.track_id)
  await getQuestions(f.questionIds, "en", false)
}

async function sdkCollapsed(f: Fixture) {
  const [, exam] = await Promise.all([sdkRole(f), getExam(f.examId)])
  await Promise.all([assertTrackAccess(f.userId, exam.track_id), getQuestions(f.questionIds, "en", false)])
}

// --- Drizzle side: the same reads, as SQL the SDK queries resolve to -----------------------------

const drizzleRole = ({ userId }: Fixture) => db.execute(sql`select role from public.users where id = ${userId}`)

/** getExam's select: the exam plus its config and ordered breaks. */
const drizzleExam = ({ examId }: Fixture) =>
  db.execute<{ track_id: string }>(sql`
    select x.id, x.track_id, x.type_id, x.display_order, x.name_ar, x.name_en, x.description_ar,
           x.description_en, x.question_count,
           json_build_object(
             'exam_duration_minutes', c.exam_duration_minutes, 'passing_rate', c.passing_rate,
             'can_reveal_answers', c.can_reveal_answers, 'allow_retry_wrong', c.allow_retry_wrong,
             'breaks', coalesce((select json_agg(json_build_object('show_at_index', b.show_at_index,
                                                                   'duration_minutes', b.duration_minutes)
                                                 order by b.show_at_index)
                                   from public.breaks b where b.config_id = c.id), '[]'::json)
           ) as config
      from public.exams x
      join public.exam_config c on c.id = x.config_id
     where x.id = ${examId}`)

const drizzleAccess = ({ userId }: Fixture, trackId: string) =>
  db.execute(sql`
    select id from public.enrollments
     where user_id = ${userId} and track_id = ${trackId} and created_at <= now() and expires_at > now()`)

/** getQuestions' select, undisclosed, in English. */
const drizzleQuestions = ({ questionIds }: Fixture) =>
  db.execute(sql`
    select q.id, q.type, q.answer_count, q.text_en as text,
           (select json_agg(json_build_object('position', c.position, 'text', c.text_en) order by c.position)
              from public.choices c where c.question_id = q.id) as choices
      from public.questions q
     where q.id in ${questionIds}`)

async function drizzleWaterfall(f: Fixture) {
  await drizzleRole(f)
  const [exam] = await drizzleExam(f)
  await drizzleAccess(f, exam.track_id)
  await drizzleQuestions(f)
}

/** Exam and access in ONE query — the join the SDK cannot express without an RPC. */
async function drizzleCollapsed(f: Fixture) {
  await Promise.all([
    drizzleRole(f),
    db.execute(sql`
      select x.id, x.track_id, exists (
               select 1 from public.enrollments e
                where e.user_id = ${f.userId} and e.track_id = x.track_id
                  and e.created_at <= now() and e.expires_at > now()) as has_access
        from public.exams x where x.id = ${f.examId}`),
  ])
  await drizzleQuestions(f)
}

async function drizzleCold(f: Fixture) {
  const client = postgres(databaseUrl, { prepare: false, max: 1 })
  try {
    await drizzle(client).execute(sql`select role from public.users where id = ${f.userId}`)
  } finally {
    await client.end()
  }
}

// --- Measurement --------------------------------------------------------------------------------

type Stats = { samples: number; min: number; p50: number; p95: number; p99: number; max: number }

function summarise(durations: number[]): Stats {
  const sorted = [...durations].sort((a, b) => a - b)
  const at = (p: number) => Math.round(sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] * 10) / 10
  return { samples: sorted.length, min: at(0), p50: at(0.5), p95: at(0.95), p99: at(0.99), max: at(1) }
}

async function timed(run: () => Promise<unknown>): Promise<number> {
  const start = performance.now()
  await run()
  return performance.now() - start
}

async function sequentially(run: () => Promise<unknown>, n: number): Promise<number[]> {
  const durations: number[] = []
  for (let i = 0; i < n; i++) durations.push(await timed(run))
  return durations
}

/** n runs one after another, then c runs at once. One warm-up run first, discarded. */
async function measure(run: () => Promise<unknown>, n: number, c: number) {
  await run()

  const sequential = await sequentially(run, n)

  const concurrent = await Promise.all(Array.from({ length: c }, () => timed(run)))

  return { sequential: summarise(sequential), concurrent: summarise(concurrent) }
}

async function handle(request: Request, _authUser: unknown, cookieHeaders?: [string, string][]) {
  invocation++
  const { scenario, n, c } = parseOrThrow(BenchQuerySchema, Object.fromEntries(new URL(request.url).searchParams))
  const f = await loadFixture()

  const runners = {
    single: { sdk: () => sdkRole(f), drizzle: () => drizzleRole(f) },
    waterfall: { sdk: () => sdkWaterfall(f), drizzle: () => drizzleWaterfall(f) },
    collapsed: { sdk: () => sdkCollapsed(f), drizzle: () => drizzleCollapsed(f) },
  }

  const results =
    scenario === "cold"
      ? // No warm-up: the connection setup IS the measurement, so every run opens a fresh one.
        { drizzle: summarise(await sequentially(() => drizzleCold(f), Math.min(n, 20))) }
      : {
          sdk: await measure(runners[scenario].sdk, n, c),
          drizzle: await measure(runners[scenario].drizzle, n, c),
        }

  return successResponse(
    { region: process.env.VERCEL_REGION ?? "local", invocation, scenario, n, c, questions: f.questionIds.length, results },
    200,
    cookieHeaders,
  )
}

export const GET = withErrorHandler(withAuth(withRole(["supervisor"], handle)))
