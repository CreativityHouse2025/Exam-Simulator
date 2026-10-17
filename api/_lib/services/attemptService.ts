import { supabaseAdmin } from "../supabaseClient.js";
import { AppError, type AppErrorParams } from "../errors/AppError.js";
import type {
  DisclosedQuestion,
  Exam,
  ExamConfig,
  Question,
} from "../../../shared/schemas/exam.schema.js";
import type {
  Attempt,
  AttemptPage,
  AttemptStatus,
  AttemptWithQuestions,
  ExamState,
  SaveAttemptAnswers,
} from "../../../shared/schemas/attempt.schema.js";
import type { ExamWithQuestions } from "../../../shared/schemas/exam.schema.js";
import { getExam, toExam, type ExamRow } from "./examService.js";
import { assertTrackAccess } from "./trackService.js";
import { getQuestionsById } from "./questionService.js";

/** What save hands the service once the handler has validated it. Submit is the same minus breaks. */
type SaveAttemptInput = {
  current_index: number;
  /** Null when the attempt is untimed. */
  time_remaining: number | null;
  answers: SaveAttemptAnswers;
  offered_breaks: number[];
};

/**
 * The attempt columns every read selects, with the exam it belongs to. The exam carries its current
 * config only because `Exam` always does, and its breaks are unordered; the attempt's own snapshot
 * governs. The inner join also lets the list filter by the exam's track.
 *
 * `total_questions` is the generated column from 018 rather than the snapshot's length, so the
 * list does not ship 25 × 180 int4 to read one number off.
 */
const ATTEMPT_COLUMNS =
  "id, exam_state, created_at, time_remaining, config_snapshot, total_questions, current_index, results(status, score, wrong_questions, time_taken), offered_breaks(show_at_index), exams!inner(id, display_order, name_ar, name_en, description_ar, description_en, question_count, archived_at, tags(id, code, name_ar, name_en, color_hex_code, display_order, archived_at), allowed_config(tracks(id, name_ar, name_en, description_ar, description_en), exam_config(exam_duration_minutes, passing_rate, can_reveal_answers, allow_retry_wrong, breaks(show_at_index, duration_minutes))))";
/** What a read that also serves question CONTENT needs on top: the frozen set, in its frozen order. */
const ATTEMPT_DETAIL_COLUMNS = `${ATTEMPT_COLUMNS}, question_ids_snapshot`;

/**
 * How the attempt RPCs' sentinels answer over HTTP. None raises; anything but `ok` means nothing
 * was written.
 *
 * `invalid_question` is a 400, not a 404: the payload named a question or choice position outside
 * the attempt's frozen set. Zod cannot catch that — it depends on the snapshot — but it is still a
 * malformed request.
 */
const RPC_FAILURES = {
  not_found: { statusCode: 404, code: "NOT_FOUND", message: "Attempt not found" },
  forbidden: { statusCode: 403, code: "FORBIDDEN", message: "Access denied" },
  conflict: { statusCode: 409, code: "CONFLICT", message: "Attempt is already completed" },
  invalid_question: {
    statusCode: 400,
    code: "VALIDATION_ERROR",
    message: "An answer names a question or choice this attempt does not have",
  },
  invalid_time: {
    statusCode: 400,
    code: "VALIDATION_ERROR",
    message: "time_remaining disagrees with the attempt's config snapshot: null is untimed, a number is a running clock",
  },
} as const satisfies Record<string, AppErrorParams>;

/** What `toAttempt` reads. Every attempt read selects at least these; the exam is mapped apart. */
type AttemptRow = {
  id: string;
  exam_state: string;
  created_at: string;
  /** NULL when the attempt is untimed. */
  time_remaining: number | null;
  config_snapshot: unknown;
  total_questions: number;
  /** One-to-one embed: null while the attempt is in progress. */
  results: {
    status: string;
    score: number;
    wrong_questions: number;
    time_taken: number | null;
  } | null;
  current_index: number;
  offered_breaks: { show_at_index: number }[];
};

/**
 * The one place an attempt row becomes an `Attempt` — start, resume and list share it.
 *
 * `exam_state` and `status` are text with a CHECK rather than enums, and `config_snapshot` is
 * jsonb, so those three are asserted. The exam is passed in: start already holds it, reads map
 * their embedded `exams` row with `toExam`.
 */
function toAttempt({ results, offered_breaks, ...row }: AttemptRow, exam: Exam): Attempt {
  return {
    id: row.id,
    exam,
    exam_state: row.exam_state as ExamState,
    created_at: row.created_at,
    time_remaining: row.time_remaining,
    config_snapshot: row.config_snapshot as ExamConfig,
    total_questions: row.total_questions,
    result: results && { ...results, status: results.status as AttemptStatus },
    current_index: row.current_index,
    offered_breaks: offered_breaks.map((offered) => offered.show_at_index),
  };
}


/**
 * Starts an exam. The server decides the question set, the order, the config and the clock; the
 * client sends only which exam.
 *
 * A student has at most one unfinished attempt per exam. If one exists, nothing is created; the
 * RPC's partial unique index settles concurrent starts.
 *
 * Starting an exam is track access, unlike reading an attempt already owned. The track is reachable
 * only through the exam, so it is checked before anything is written.
 *
 * @throws {AppError} 404 `NOT_FOUND` — no such exam, or an exam with no questions.
 * @throws {AppError} 403 `FORBIDDEN` — no active enrollment in the exam's track.
 * @throws {AppError} 409 `ATTEMPT_IN_PROGRESS` — the student already has an open attempt on this exam.
 * @throws {AppError} 410 `EXAM_ARCHIVED` — the exam is archived.
 * @throws {AppError} 500 `ATTEMPT_CREATE_FAILED` — the call failed.
 */
export async function startAttempt(
  userId: string,
  exam_id: number,
): Promise<AttemptWithQuestions> {
  const exam = await getExam(exam_id);
  await assertTrackAccess(userId, exam.track.id);

  const { data, error } = await supabaseAdmin
    .rpc("start_attempt", { p_user_id: userId, p_exam_id: exam_id })
    .single();

  if (error || !data) {
    throw new AppError({
      statusCode: 500,
      code: "ATTEMPT_CREATE_FAILED",
      message: `Failed to start exam ${exam_id} (${error?.message ?? "no row returned"})`,
    });
  }

  if (data.result === "not_found") {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: `Exam ${exam_id} does not exist, or has no questions`,
    });
  }

  if (data.result === "archived") {
    throw new AppError({
      statusCode: 410,
      code: "EXAM_ARCHIVED",
      message: `Exam ${exam_id} is archived and cannot be started`,
    });
  }

  if (data.result === "in_progress") {
    throw new AppError({
      statusCode: 409,
      code: "ATTEMPT_IN_PROGRESS",
      message: `User ${userId} already has open attempt ${data.id} on exam ${exam_id}`,
    });
  }

  // The RPC returns the snapshot, not the generated column, so the count comes off the array.
  // A just-started attempt has no result and has been offered no break, so neither needs a query.
  const attempt = toAttempt(
    {
      ...data,
      total_questions: data.question_ids_snapshot.length,
      results: null,
      offered_breaks: [],
    },
    exam,
  );

  const content = (await getQuestionsById(
    data.question_ids_snapshot,
    attempt.config_snapshot.can_reveal_answers,
  )) as Question[];

  const questions = content.map((question) => ({
    ...question,
    selected_choices: [],
    is_bookmarked: false,
  })) as AttemptWithQuestions["questions"];

  return { attempt, questions };
}

/** Turns an attempt RPC's sentinel into the error it stands for. `ok` passes through. */
function throwOnRpcFailure(result: string): void {
  const failure = RPC_FAILURES[result as keyof typeof RPC_FAILURES];

  if (failure) {
    throw new AppError(failure);
  }
}

/**
 * Saves in-progress state: the position, the clock, an answer DIFF, and any breaks just offered.
 *
 * The answers array holds dirty questions only. An entry with no selection and no bookmark is a
 * delete instruction, not invalid input. This can never complete an attempt or write a score —
 * grading lives behind submit alone.
 *
 * @throws {AppError} 400 `VALIDATION_ERROR` — an answer names a question or choice outside the attempt.
 * @throws {AppError} 404 `NOT_FOUND` — no attempt with this id.
 * @throws {AppError} 403 `FORBIDDEN` — the attempt belongs to someone else.
 * @throws {AppError} 409 `CONFLICT` — the attempt is already completed.
 * @throws {AppError} 500 `ATTEMPT_SAVE_FAILED` — the call failed.
 */
export async function saveAttempt(
  userId: string,
  attemptId: string,
  { current_index, time_remaining, answers, offered_breaks }: SaveAttemptInput,
): Promise<void> {
  const { data: result, error } = await supabaseAdmin.rpc("save_attempt", {
    p_user_id: userId,
    p_attempt_id: attemptId,
    p_current_index: current_index,
    // Untimed attempts have no clock to report, so the argument is left off entirely.
    p_time_remaining: time_remaining ?? undefined,
    p_answers: answers,
    p_offered_breaks: offered_breaks,
  });

  if (error) {
    throw new AppError({
      statusCode: 500,
      code: "ATTEMPT_SAVE_FAILED",
      message: `Failed to save attempt ${attemptId} (${error.message})`,
    });
  }

  throwOnRpcFailure(result);
}

/**
 * Applies the final answer diff and grades it, in one transaction.
 *
 * The diff travels with the submission on purpose: split into a save and then a submit, a request
 * lost between the two would grade an attempt missing its last answers. Grading reads the stored
 * rows, never the request — an unanswered question is wrong by absence — and the pass mark comes
 * from the attempt's own `config_snapshot`, not the exam's current config.
 *
 * Writes the grade to `results` rather than returning it — the
 * caller reads it back with `getAttempt`, the same call a resume already makes, which is also
 * what discloses the questions. Question content is deliberately absent from this call: a student
 * who wants a question-by-question review reads the completed attempt, not this response.
 *
 * @throws {AppError} 400 `VALIDATION_ERROR` — an answer names a question or choice outside the attempt.
 * @throws {AppError} 404 `NOT_FOUND` — no attempt with this id.
 * @throws {AppError} 403 `FORBIDDEN` — the attempt belongs to someone else.
 * @throws {AppError} 409 `CONFLICT` — the attempt is already completed.
 * @throws {AppError} 500 `ATTEMPT_SUBMIT_FAILED` — the call failed.
 */
export async function submitAttempt(
  userId: string,
  attemptId: string,
  { current_index, time_remaining, answers }: Omit<SaveAttemptInput, "offered_breaks">,
): Promise<void> {
  const { data: result, error } = await supabaseAdmin.rpc("submit_attempt", {
    p_user_id: userId,
    p_attempt_id: attemptId,
    p_current_index: current_index,
    // Untimed attempts have no clock to report — see saveAttempt.
    p_time_remaining: time_remaining ?? undefined,
    p_answers: answers,
  });

  if (error) {
    throw new AppError({
      statusCode: 500,
      code: "ATTEMPT_SUBMIT_FAILED",
      message: `Failed to submit attempt ${attemptId} (${error.message})`,
    });
  }

  throwOnRpcFailure(result);
}

/** PostgREST's answer to an offset past the last row when an exact count was asked for (416). */
const RANGE_PAST_END = "PGRST103";

/**
 * One page of a user's attempts within one track, newest first, plus how many there are in all.
 *
 * The track filter is an inner join on `exams`, so both the page and the count cover this track
 * only. A page past the end is an empty page, not an error.
 *
 * @throws {AppError} 500 `INTERNAL_ERROR` — the query failed.
 */
export async function listAttempts(
  userId: string,
  trackId: string,
  { page, per_page }: AttemptPage,
): Promise<{ attempts: Attempt[]; total: number }> {
  const from = (page - 1) * per_page;

  const { data, count, error } = await supabaseAdmin
    .from("exam_attempts")
    .select(ATTEMPT_COLUMNS, { count: "exact" })
    .eq("user_id", userId)
    .eq("exams.track_id", trackId)
    .order("created_at", { ascending: false })
    // Ties on created_at would otherwise let a row move between pages.
    .order("id", { ascending: false })
    .range(from, from + per_page - 1);

  if (error?.code === RANGE_PAST_END) {
    return { attempts: [], total: await countAttempts(userId, trackId) };
  }

  if (error || !data || count === null) {
    throw new AppError({
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: `Failed to fetch attempts for track ${trackId} (${error?.message ?? "no rows or count returned"})`,
    });
  }

  return { attempts: data.map((row) => toAttempt(row, toExam(row.exams))), total: count };
}

/**
 * How many attempts a user has within one track. Only for a page past the end, where the page
 * query fails before it reports its count.
 *
 * @throws {AppError} 500 `INTERNAL_ERROR` — the query failed.
 */
async function countAttempts(userId: string, trackId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("exam_attempts")
    .select("id, exams!inner(track_id)", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("exams.track_id", trackId);

  if (error || count === null) {
    throw new AppError({
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: `Failed to count attempts for track ${trackId} (${error?.message ?? "no count returned"})`,
    });
  }

  return count;
}

/**
 * One attempt, its stored answers, and its question content in every language.
 *
 * Ownership is the only gate. An attempt outlives the enrollment it was earned under, so nothing
 * here consults a track. Questions come back in the attempt's own frozen order, and the answer key
 * is selected only when the exam allows revealing it or the attempt is already completed.
 *
 * @throws {AppError} 404 `NOT_FOUND` — no attempt with this id.
 * @throws {AppError} 403 `FORBIDDEN` — the attempt belongs to someone else.
 * @throws {AppError} 500 `INTERNAL_ERROR` — the query failed.
 */
export async function getAttempt(
  userId: string,
  attemptId: string,
): Promise<AttemptWithQuestions> {
  const { data, error } = await supabaseAdmin
    .from("exam_attempts")
    .select(
      `${ATTEMPT_DETAIL_COLUMNS}, user_id, attempt_answers(question_id, selected_choices, is_bookmarked)`,
    )
    .eq("id", attemptId)
    .maybeSingle();

  if (error) {
    throw new AppError({
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: `Failed to fetch attempt ${attemptId} (${error.message})`,
    });
  }

  if (!data) {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: `Attempt ${attemptId} does not exist`,
    });
  }

  if (data.user_id !== userId) {
    throw new AppError({
      statusCode: 403,
      code: "FORBIDDEN",
      message: "Access denied",
    });
  }

  const attempt = toAttempt(data, toExam(data.exams as ExamRow));

  const content = (await getQuestionsById(
    data.question_ids_snapshot,
    attempt.config_snapshot.can_reveal_answers || attempt.exam_state === "completed",
  )) as Question[];

  const answers = new Map(data.attempt_answers.map((answer) => [answer.question_id, answer]));

  // A question with no stored row was never answered or bookmarked. The disclosed shape is decided
  // by the flag above, which the return union cannot express.
  const questions = content.map((question) => ({
    ...question,
    selected_choices: answers.get(question.id)?.selected_choices ?? [],
    is_bookmarked: answers.get(question.id)?.is_bookmarked ?? false,
  })) as AttemptWithQuestions["questions"];

  return { attempt, questions };
}

/**
 * The "wrong or unanswered" set of a completed attempt, as a fresh revision session.
 *
 * Membership comes from `revision_question_ids` (018) — the complement of the predicate
 * `submit_attempt` grades with, so the rule lives in one place rather than being recomputed here.
 * Ids arrive in the attempt's frozen order; an unopened question falls in by absence.
 *
 * Nothing is persisted, and an empty set is a normal outcome. The parent exam's config is not the
 * session's: a revision session's rules are a frontend constant.
 *
 * @throws {AppError} 404 `NOT_FOUND` — no attempt with this id.
 * @throws {AppError} 403 `FORBIDDEN` — not the owner, not completed, or retry is disabled.
 * @throws {AppError} 500 `INTERNAL_ERROR` — the call failed.
 */
export async function getRevision(userId: string, attemptId: string): Promise<ExamWithQuestions> {
  const { data, error } = await supabaseAdmin
    .rpc("revision_question_ids", { p_user_id: userId, p_attempt_id: attemptId })
    .single();

  if (error || !data) {
    throw new AppError({
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: `Failed to build the revision set of attempt ${attemptId} (${error?.message ?? "no row returned"})`,
    });
  }

  // Not the owner, not completed and retry-disabled all answer alike: a flat refusal.
  throwOnRpcFailure(data.result);

  const [exam, questions] = await Promise.all([
    getExam(data.exam_id),
    getQuestionsById(data.question_ids, true) as Promise<DisclosedQuestion[]>,
  ]);

  return { exam, questions };
}
