/**
 * API smoke snapshot — calls every database-backed endpoint in-process against the LOCAL stack and
 * records status + body, so a refactor can be proven output-identical.
 *
 * Usage:
 *   npx tsx scripts/api-smoke.ts capture <out.json>     run every call, write the snapshot
 *   npx tsx scripts/api-smoke.ts compare <a.json> <b.json>   exit 1 on any difference
 *
 * Requires `npm run db:start` and a `.env` pointing at the local stack (seeded accounts, see
 * local-supabase-guide). Refuses to run against a non-local DATABASE_URL: it writes an attempt and
 * deletes it again.
 *
 * Masked as time-sensitive: the id and created_at of the attempt this run creates. Everything else
 * must match exactly. Keys are sorted before writing, so column order never shows up as a diff.
 */
import "dotenv/config"
import { readFileSync, writeFileSync } from "node:fs"
import postgres from "postgres"

type Handler = (request: Request) => Promise<Response>
type Snapshot = { name: string; status: number; body: unknown }[]

const BASE = "http://localhost"
const NEW_ATTEMPT = "<new-attempt>"
const UNKNOWN_UUID = "00000000-0000-4000-8000-000000000000"

function assertLocalDatabase(): string {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set")
  if (!["127.0.0.1", "localhost"].includes(new URL(url).hostname)) {
    throw new Error("DATABASE_URL is not local — refusing to write test attempts")
  }
  return url
}

async function load(path: string, method: string): Promise<Handler> {
  const module: Record<string, unknown> = await import(path)
  const handler = module[method]
  if (typeof handler !== "function") throw new Error(`${path} exports no ${method}`)
  return handler as Handler
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** Reads `data` off a success envelope, failing loudly when the call did not succeed. */
function dataOf(entry: { status: number; body: unknown }): Record<string, unknown> {
  if (!isRecord(entry.body) || entry.body.success !== true || !isRecord(entry.body.data)) {
    throw new Error(`Expected a success envelope, got ${entry.status}: ${JSON.stringify(entry.body)}`)
  }
  return entry.body.data
}

function stringAt(record: Record<string, unknown>, key: string): string {
  const value = record[key]
  if (typeof value !== "string") throw new Error(`Expected string at ${key}`)
  return value
}

function arrayAt(record: Record<string, unknown>, key: string): Record<string, unknown>[] {
  const value = record[key]
  if (!Array.isArray(value) || !value.every(isRecord)) throw new Error(`Expected object array at ${key}`)
  return value
}

/** Sorted keys, the created attempt's id and created_at masked. */
function canonical(value: unknown, newAttemptId: string | undefined): unknown {
  if (Array.isArray(value)) return value.map((item) => canonical(item, newAttemptId))
  if (typeof value === "string") return value === newAttemptId ? NEW_ATTEMPT : value
  if (!isRecord(value)) return value

  const isNewAttempt = newAttemptId !== undefined && value.id === newAttemptId
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, isNewAttempt && key === "created_at" ? "<masked>" : canonical(value[key], newAttemptId)]),
  )
}

async function capture(outPath: string): Promise<void> {
  const sql = postgres(assertLocalDatabase(), { prepare: false, max: 1 })
  const snapshot: Snapshot = []
  let newAttemptId: string | undefined

  const handlers = {
    signin: await load("../api/auth/signin.ts", "POST"),
    signout: await load("../api/auth/signout.ts", "POST"),
    tokenExchange: await load("../api/auth/token-exchange.ts", "POST"),
    me: await load("../api/auth/me.ts", "GET"),
    tracks: await load("../api/tracks/index.ts", "GET"),
    trackExams: await load("../api/tracks/[trackId]/exams.ts", "GET"),
    examQuestions: await load("../api/exams/[examId]/questions.ts", "GET"),
    attemptsList: await load("../api/attempts/index.ts", "GET"),
    attemptsStart: await load("../api/attempts/index.ts", "POST"),
    attemptGet: await load("../api/attempts/[id].ts", "GET"),
    attemptSave: await load("../api/attempts/[id].ts", "PATCH"),
    attemptSubmit: await load("../api/attempts/[id]/submit.ts", "POST"),
    attemptRevision: await load("../api/attempts/[id]/revision.ts", "GET"),
    studentSearch: await load("../api/students/index.ts", "GET"),
    studentGet: await load("../api/students/[id].ts", "GET"),
    studentAttempts: await load("../api/students/[id]/attempts.ts", "GET"),
  }

  async function call(
    name: string,
    handler: Handler,
    method: string,
    path: string,
    options: { cookie?: string; body?: unknown } = {},
  ) {
    const headers = new Headers()
    if (options.cookie) headers.set("Cookie", options.cookie)
    if (options.body !== undefined) headers.set("Content-Type", "application/json")

    const response = await handler(
      new Request(`${BASE}${path}`, {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      }),
    )
    const entry = { name, status: response.status, body: await response.json(), cookies: response.headers.getSetCookie() }
    snapshot.push({ name, status: entry.status, body: entry.body })
    return entry
  }

  async function signIn(label: string, email: string) {
    const entry = await call(`signin ${label}`, handlers.signin, "POST", "/api/auth/signin", {
      body: { email, password: "password123" },
    })
    dataOf(entry)
    const tokens = Object.fromEntries(
      entry.cookies.map((cookie) => {
        const [key = "", value = ""] = cookie.split(";")[0].split("=")
        return [key, value]
      }),
    )
    return { cookie: `access_token=${tokens.access_token}; refresh_token=${tokens.refresh_token}`, tokens }
  }

  try {
    const student = await signIn("student", "student@local.test")
    const supervisor = await signIn("supervisor", "supervisor@local.test")

    // --- student ---------------------------------------------------------------------------------
    const me = dataOf(await call("me student", handlers.me, "GET", "/api/auth/me", { cookie: student.cookie }))
    const trackId = stringAt(arrayAt(me, "tracks")[0], "id")

    await call("tracks", handlers.tracks, "GET", "/api/tracks", { cookie: student.cookie })
    const trackExams = dataOf(
      await call("track exams", handlers.trackExams, "GET", `/api/tracks/${trackId}/exams`, { cookie: student.cookie }),
    )
    await call("track exams (not enrolled)", handlers.trackExams, "GET", `/api/tracks/${UNKNOWN_UUID}/exams`, {
      cookie: student.cookie,
    })

    const attempts = arrayAt(
      dataOf(
        await call("attempts list", handlers.attemptsList, "GET", `/api/attempts?trackId=${trackId}`, {
          cookie: student.cookie,
        }),
      ),
      "attempts",
    )

    for (const attempt of attempts) {
      const id = stringAt(attempt, "id")
      const state = stringAt(attempt, "exam_state")
      await call(`attempt ${state} ${id}`, handlers.attemptGet, "GET", `/api/attempts/${id}?lang=en`, {
        cookie: student.cookie,
      })
      await call(`revision ${state} ${id}`, handlers.attemptRevision, "GET", `/api/attempts/${id}/revision?lang=ar`, {
        cookie: student.cookie,
      })
    }
    await call("attempt (unknown)", handlers.attemptGet, "GET", `/api/attempts/${UNKNOWN_UUID}?lang=en`, {
      cookie: student.cookie,
    })

    // Start -> save -> invalid save -> submit -> read -> revision -> save after submit.
    const examId = arrayAt(trackExams, "exams")[0].id
    const started = dataOf(
      await call("attempt start", handlers.attemptsStart, "POST", "/api/attempts", {
        cookie: student.cookie,
        body: { exam_id: examId, lang: "en" },
      }),
    )
    const startedAttempt = started.attempt
    if (!isRecord(startedAttempt)) throw new Error("start returned no attempt")
    newAttemptId = stringAt(startedAttempt, "id")
    const timeRemaining = startedAttempt.time_remaining
    const [first, second] = arrayAt(started, "questions")
    const firstChoice = arrayAt(first, "choices")[0].position

    const attemptPath = `/api/attempts/${newAttemptId}`
    await call("attempt save", handlers.attemptSave, "PATCH", attemptPath, {
      cookie: student.cookie,
      body: {
        current_index: 1,
        time_remaining: timeRemaining,
        answers: [
          { question_id: first.id, selected_choices: [firstChoice], is_bookmarked: false },
          { question_id: second.id, selected_choices: [], is_bookmarked: true },
        ],
        offered_breaks: [],
      },
    })
    await call("attempt save (invalid question)", handlers.attemptSave, "PATCH", attemptPath, {
      cookie: student.cookie,
      body: {
        current_index: 1,
        time_remaining: timeRemaining,
        answers: [{ question_id: 999999, selected_choices: [0], is_bookmarked: false }],
      },
    })
    await call("attempt get (in progress)", handlers.attemptGet, "GET", `${attemptPath}?lang=ar`, {
      cookie: student.cookie,
    })
    await call("attempt submit", handlers.attemptSubmit, "POST", `${attemptPath}/submit`, {
      cookie: student.cookie,
      body: { current_index: 2, time_remaining: timeRemaining, answers: [] },
    })
    await call("attempt get (submitted)", handlers.attemptGet, "GET", `${attemptPath}?lang=en`, {
      cookie: student.cookie,
    })
    await call("attempt revision (submitted)", handlers.attemptRevision, "GET", `${attemptPath}/revision?lang=en`, {
      cookie: student.cookie,
    })
    await call("attempt save (after submit)", handlers.attemptSave, "PATCH", attemptPath, {
      cookie: student.cookie,
      body: { current_index: 0, time_remaining: timeRemaining, answers: [] },
    })

    await call("student search (as student)", handlers.studentSearch, "GET", "/api/students?q=am", {
      cookie: student.cookie,
    })
    await call("exam questions (as student)", handlers.examQuestions, "GET", `/api/exams/${examId}/questions?lang=en`, {
      cookie: student.cookie,
    })

    // --- supervisor ------------------------------------------------------------------------------
    const supervisorMe = dataOf(
      await call("me supervisor", handlers.me, "GET", "/api/auth/me", { cookie: supervisor.cookie }),
    )
    const search = dataOf(
      await call("student search", handlers.studentSearch, "GET", "/api/students?q=am", { cookie: supervisor.cookie }),
    )
    await call("student search (short)", handlers.studentSearch, "GET", "/api/students?q=a", { cookie: supervisor.cookie })
    await call("student search (wildcard)", handlers.studentSearch, "GET", "/api/students?q=%25_", {
      cookie: supervisor.cookie,
    })
    const otherStudentId = stringAt(arrayAt(search, "students")[0], "id")

    await call("student get", handlers.studentGet, "GET", `/api/students/${otherStudentId}`, { cookie: supervisor.cookie })
    const supervisorUser = supervisorMe.user
    if (!isRecord(supervisorUser)) throw new Error("me returned no user")
    await call("student get (supervisor id)", handlers.studentGet, "GET", `/api/students/${stringAt(supervisorUser, "id")}`, {
      cookie: supervisor.cookie,
    })
    await call("student get (unknown)", handlers.studentGet, "GET", `/api/students/${UNKNOWN_UUID}`, {
      cookie: supervisor.cookie,
    })
    const otherAttempts = dataOf(
      await call(
        "student attempts",
        handlers.studentAttempts,
        "GET",
        `/api/students/${otherStudentId}/attempts?trackId=${trackId}`,
        { cookie: supervisor.cookie },
      ),
    )
    await call("exam questions", handlers.examQuestions, "GET", `/api/exams/${examId}/questions?lang=ar`, {
      cookie: supervisor.cookie,
    })
    await call("exam questions (unknown)", handlers.examQuestions, "GET", "/api/exams/32000/questions?lang=en", {
      cookie: supervisor.cookie,
    })

    // Another student's attempt, read by the student: ownership refusal.
    const foreignAttempts = arrayAt(otherAttempts, "attempts")
    if (foreignAttempts.length > 0) {
      await call("attempt get (foreign)", handlers.attemptGet, "GET", `/api/attempts/${stringAt(foreignAttempts[0], "id")}?lang=en`, {
        cookie: student.cookie,
      })
    }

    // Last: token-exchange signs the supervisor out of every OTHER session, and signout ends the student's.
    const exchanger = await signIn("supervisor (exchange)", "supervisor@local.test")
    await call("token exchange", handlers.tokenExchange, "POST", "/api/auth/token-exchange", {
      body: { access_token: exchanger.tokens.access_token, refresh_token: exchanger.tokens.refresh_token },
    })
    await call("signout", handlers.signout, "POST", "/api/auth/signout", { cookie: student.cookie })
  } finally {
    if (newAttemptId) await sql`delete from public.exam_attempts where id = ${newAttemptId}`
    await sql.end()
  }

  writeFileSync(outPath, JSON.stringify(canonical(snapshot, newAttemptId), null, 2))
  console.log(`Captured ${snapshot.length} calls -> ${outPath}`)
}

function compare(aPath: string, bPath: string): void {
  const a: Snapshot = JSON.parse(readFileSync(aPath, "utf8"))
  const b: Snapshot = JSON.parse(readFileSync(bPath, "utf8"))
  let differences = 0

  if (a.length !== b.length) {
    console.log(`Call count differs: ${a.length} vs ${b.length}`)
    differences++
  }

  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const left = JSON.stringify(a[i])
    const right = JSON.stringify(b[i])
    if (left !== right) {
      differences++
      console.log(`\n✗ ${a[i]?.name ?? b[i]?.name}`)
      console.log(`  before: ${left?.slice(0, 600)}`)
      console.log(`  after:  ${right?.slice(0, 600)}`)
    }
  }

  console.log(differences === 0 ? `✓ ${a.length} calls identical` : `\n${differences} call(s) differ`)
  if (differences > 0) process.exit(1)
}

const [mode, first, second] = process.argv.slice(2)
if (mode === "capture" && first) {
  await capture(first)
  // The API's own connection pool is module-level and never idles out, so the process would not
  // end on its own.
  process.exit(0)
} else if (mode === "compare" && first && second) compare(first, second)
else {
  console.error("Usage: tsx scripts/api-smoke.ts capture <out.json> | compare <a.json> <b.json>")
  process.exit(2)
}
