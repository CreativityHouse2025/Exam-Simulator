/**
 * Integration tests for the attempt service layer against a real Supabase DB.
 *
 * Requires env vars from .env (loaded via setupFiles in jest.config.integration.cjs):
 *   SB_URL, SB_SECRET_KEY, SB_PUBLISHABLE_KEY
 *
 * Run with: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals"
import { insertAttempt, getAttempt, saveAttempt, listAttempts } from "../../api/_lib/services/attemptService.js"
import { supabaseAdmin } from "../../api/_lib/supabaseClient.js"

// ---------------------------------------------------------------------------
// Fixtures — question_id and exam_id have no FK constraints, any ints work
// ---------------------------------------------------------------------------
const QUESTION_IDS = [10, 20, 30, 40, 50]
const CHOICES_ORDERS = [
  [0, 1, 2, 3],
  [1, 0, 3, 2],
  [2, 3, 0, 1],
  [3, 2, 1, 0],
  [0, 2, 1, 3],
]
const FULL_EXAM_INPUT = {
  exam_type: "full" as const,
  exam_id: 1,
  category_id: null,
  question_ids: QUESTION_IDS,
  choices_orders: CHOICES_ORDERS,
  duration_minutes: 230,
}

// ---------------------------------------------------------------------------
// Test user — created before all tests, deleted after (cascades everything)
// ---------------------------------------------------------------------------
let testUserId: string
// Pre-created in-progress attempt reused across the 403/404 error tests
let sharedAttemptId: string

beforeAll(async () => {
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: `test+integration+${Date.now()}@local.dev`,
    password: "integration-test-pw-123!",
    email_confirm: true,
    user_metadata: {
      first_name: 'Integration',
      last_name: 'Testing',
      highlevel_id: 'testing'
    }
  })
  if (authError || !authData.user) {
    throw new Error(`Could not create test auth user: ${authError?.message}`)
  }
  testUserId = authData.user.id

  const { attempt_id } = await insertAttempt(testUserId, FULL_EXAM_INPUT)
  sharedAttemptId = attempt_id
})

afterAll(async () => {
  if (testUserId) {
    await supabaseAdmin.auth.admin.deleteUser(testUserId)
  }
})

// ---------------------------------------------------------------------------
// Happy path — one sequential test covering the complete exam lifecycle
// ---------------------------------------------------------------------------
describe("full exam lifecycle", () => {
  it("creates an attempt, saves progress, submits, and appears in the list", async () => {
    // 1. Insert
    const { attempt_id } = await insertAttempt(testUserId, FULL_EXAM_INPUT)
    expect(attempt_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)

    // 2. Get — initial state
    const initial = await getAttempt(testUserId, attempt_id)
    expect(initial.attempt.exam_state).toBe("in-progress")
    expect(initial.attempt.exam_type).toBe("full")
    expect(initial.attempt.exam_id).toBe(FULL_EXAM_INPUT.exam_id)
    expect(initial.attempt.time_remaining).toBe(FULL_EXAM_INPUT.duration_minutes * 60)
    expect(initial.questions).toHaveLength(QUESTION_IDS.length)
    // All questions start with empty selections and no bookmark
    for (const q of initial.questions) {
      expect(q.selected_choices).toEqual([])
      expect(q.is_bookmarked).toBe(false)
    }

    // 3. Save in-progress with partial answers
    await saveAttempt(testUserId, attempt_id, {
      exam_state: "in-progress",
      current_index: 2,
      time_remaining: 12000,
      review_state: "question",
      answers: [
        { question_index: 0, selected_choices: [2], is_bookmarked: true },
        { question_index: 1, selected_choices: [0, 1], is_bookmarked: false },
      ],
    })

    // 4. Get — verify saved state
    const afterSave = await getAttempt(testUserId, attempt_id)
    expect(afterSave.attempt.current_index).toBe(2)
    expect(afterSave.attempt.time_remaining).toBe(12000)
    expect(afterSave.questions[0].selected_choices).toEqual([2])
    expect(afterSave.questions[0].is_bookmarked).toBe(true)
    expect(afterSave.questions[1].selected_choices).toEqual([0, 1])
    // Questions not included in the save payload stay untouched
    expect(afterSave.questions[2].selected_choices).toEqual([])

    // 5. Submit (complete)
    await saveAttempt(testUserId, attempt_id, {
      exam_state: "completed",
      current_index: 4,
      time_remaining: 500,
      review_state: "summary",
      answers: QUESTION_IDS.map((_, i) => ({ question_index: i, selected_choices: [0], is_bookmarked: false })),
      score: 80,
      status: "pass",
    })

    // 6. Get — verify completed state
    const completed = await getAttempt(testUserId, attempt_id)
    expect(completed.attempt.exam_state).toBe("completed")
    expect(Number(completed.attempt.score)).toBe(80)
    expect(completed.attempt.status).toBe("pass")
    expect(completed.attempt.email_report_state).toBe("pending")

    // 7. List — attempt appears with correct metadata
    const { attempts } = await listAttempts(testUserId)
    const found = attempts.find((a) => a.id === attempt_id)
    expect(found).toBeDefined()
    expect(found!.exam_state).toBe("completed")
    expect(Number(found!.score)).toBe(80)
    expect(found!.status).toBe("pass")
  })
})

// ---------------------------------------------------------------------------
// Error cases — each test is independent
// ---------------------------------------------------------------------------
describe("error cases", () => {
  it("throws 403 FORBIDDEN when getting an attempt with the wrong user id", async () => {
    const wrongUserId = "00000000-0000-0000-0000-000000000001"
    await expect(getAttempt(wrongUserId, sharedAttemptId)).rejects.toMatchObject({
      code: "FORBIDDEN",
      statusCode: 403,
    })
  })

  it("throws 403 FORBIDDEN when saving an attempt with the wrong user id", async () => {
    const wrongUserId = "00000000-0000-0000-0000-000000000001"
    await expect(
      saveAttempt(wrongUserId, sharedAttemptId, {
        exam_state: "in-progress",
        current_index: 0,
        time_remaining: 1000,
        review_state: "question",
        answers: [],
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN", statusCode: 403 })
  })

  it("throws 409 CONFLICT when saving an already-completed attempt", async () => {
    // Create and immediately complete a dedicated attempt for this case
    const { attempt_id } = await insertAttempt(testUserId, FULL_EXAM_INPUT)
    await saveAttempt(testUserId, attempt_id, {
      exam_state: "completed",
      current_index: 4,
      time_remaining: 0,
      review_state: "summary",
      answers: QUESTION_IDS.map((_, i) => ({ question_index: i, selected_choices: [1], is_bookmarked: false })),
      score: 40,
      status: "fail",
    })

    await expect(
      saveAttempt(testUserId, attempt_id, {
        exam_state: "in-progress",
        current_index: 0,
        time_remaining: 1000,
        review_state: "question",
        answers: [],
      })
    ).rejects.toMatchObject({ code: "CONFLICT", statusCode: 409 })
  })

  it("throws 404 NOT_FOUND when getting a nonexistent attempt id", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000"
    await expect(getAttempt(testUserId, fakeId)).rejects.toMatchObject({
      code: "NOT_FOUND",
      statusCode: 404,
    })
  })

  it("throws 404 NOT_FOUND when saving to a nonexistent attempt id", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000"
    await expect(
      saveAttempt(testUserId, fakeId, {
        exam_state: "in-progress",
        current_index: 0,
        time_remaining: 1000,
        review_state: "question",
        answers: [],
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND", statusCode: 404 })
  })
})
