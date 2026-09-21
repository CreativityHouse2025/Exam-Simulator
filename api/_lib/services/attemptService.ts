import { supabaseAdmin } from "../supabaseClient.js";
import { AppError, type AppErrorParams } from "../errors/AppError.js";
import type {
  DisclosedQuestion,
  ExamConfig,
  LangCode,
  Question,
} from "../../../shared/schemas/exam.schema.js";
import type {
  AttemptDetail,
  AttemptList,
  AttemptStatus,
  AttemptSummary,
  AttemptWithQuestions,
  ExamState,
  Revision,
  SaveAttemptRequestBody,
  StartAttemptRequestBody,
  SubmitAttemptRequestBody,
} from "../../../shared/schemas/attempt.schema.js";
import { getExam } from "./examService.js";
import { getQuestions } from "./questionService.js";

/** The per-track attempt cap. A track's list can never legitimately exceed it. */
const TRACK_ATTEMPT_CAP = 25;

/**
 * The attempt columns every read selects. `exams` is joined only to filter by track.
 *
 * `total_questions` is the generated column from 018 rather than the snapshot's length, so the
 * list does not ship 25 × 180 int4 to read one number off.
 */
const ATTEMPT_COLUMNS =
  "id, exam_id, exam_state, score, status, created_at, time_remaining, config_snapshot, total_questions, wrong_questions";

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

/** What `toAttemptSummary` reads. Every attempt read selects at least these. */
type AttemptSummaryRow = {
  id: string;
  exam_id: number;
  exam_state: string;
  score: number;
  status: string | null;
  created_at: string;
  /** NULL when the attempt is untimed. */
  time_remaining: number | null;
  config_snapshot: unknown;
  total_questions: number;
  wrong_questions: number | null;
};

/**
 * The one place an attempt row becomes an `AttemptSummary` — start, resume and list share it.
 *
 * `exam_state` and `status` are text with a CHECK rather than enums, and `config_snapshot` is
 * jsonb, so those three are asserted.
 */
function toAttemptSummary(row: AttemptSummaryRow): AttemptSummary {
  return {
    id: row.id,
    exam_id: row.exam_id,
    exam_state: row.exam_state as ExamState,
    score: row.score,
    status: row.status as AttemptStatus | null,
    created_at: row.created_at,
    time_remaining: row.time_remaining,
    config_snapshot: row.config_snapshot as ExamConfig,
    total_questions: row.total_questions,
    wrong_questions: row.wrong_questions,
  };
}


/**
 * Starts an exam. The server decides the question set, the order, the config and the clock; the
 * client sends only which exam, in which language.
 *
 * Every call creates an attempt. Sending the request once is the frontend's job — several
 * unfinished attempts for one exam are a legitimate state, bounded by the per-track cap.
 *
 * @throws {AppError} 404 `NOT_FOUND` — no such exam, or an exam with no questions.
 * @throws {AppError} 500 `ATTEMPT_CREATE_FAILED` — the call failed.
 */
export async function startAttempt(
  userId: string,
  { exam_id, lang }: StartAttemptRequestBody,
): Promise<AttemptWithQuestions> {
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

  const attempt: AttemptDetail = {
    // The RPC returns the snapshot, not the generated column, so the count comes off the array.
    // It also predates 021's wrong_questions column and never will carry it — a just-started
    // attempt is always in-progress, so it is always null, the same reasoning as offered_breaks.
    ...toAttemptSummary({ ...data, total_questions: data.question_ids_snapshot.length, wrong_questions: null }),
    current_index: data.current_index,
    // A new attempt has answered nothing and been offered no break, so neither needs a query.
    offered_breaks: [],
  };

  const content = (await getQuestions(
    data.question_ids_snapshot,
    lang,
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
  { current_index, time_remaining, answers, offered_breaks }: SaveAttemptRequestBody,
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
 * Writes the grade (score, status, wrong_questions) to the row rather than returning it — the
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
  { current_index, time_remaining, answers }: SubmitAttemptRequestBody,
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

/**
 * One user's attempts within one track, newest first.
 *
 * The track filter is an inner join on `exams`, applied before the limit: limiting first would
 * silently drop a track's older attempts once the account holds enough newer ones elsewhere.
 *
 * @throws {AppError} 500 `INTERNAL_ERROR` — the query failed.
 */
export async function listAttempts(userId: string, trackId: string): Promise<AttemptList> {
  const { data, error } = await supabaseAdmin
    .from("exam_attempts")
    .select(`${ATTEMPT_COLUMNS}, exams!inner(track_id)`)
    .eq("user_id", userId)
    .eq("exams.track_id", trackId)
    .order("created_at", { ascending: false })
    .limit(TRACK_ATTEMPT_CAP);

  if (error || !data) {
    throw new AppError({
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: `Failed to fetch attempts for track ${trackId} (${error?.message ?? "no rows returned"})`,
    });
  }

  return { attempts: data.map(toAttemptSummary) };
}

/**
 * One attempt, its stored answers, and its question content in the requested language.
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
  lang: LangCode,
): Promise<AttemptWithQuestions> {
  const { data, error } = await supabaseAdmin
    .from("exam_attempts")
    .select(
      `${ATTEMPT_DETAIL_COLUMNS}, user_id, current_index, attempt_answers(question_id, selected_choices, is_bookmarked), offered_breaks(show_at_index)`,
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

  const attempt: AttemptDetail = {
    ...toAttemptSummary(data),
    current_index: data.current_index,
    offered_breaks: data.offered_breaks.map((offered) => offered.show_at_index),
  };

  const content = (await getQuestions(
    data.question_ids_snapshot,
    lang,
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
 * Nothing is persisted, and an empty set is a normal outcome. The parent exam travels without its
 * config: a revision session's rules are a frontend constant, not the exam's.
 *
 * @throws {AppError} 404 `NOT_FOUND` — no attempt with this id.
 * @throws {AppError} 403 `FORBIDDEN` — not the owner, not completed, or retry is disabled.
 * @throws {AppError} 500 `INTERNAL_ERROR` — the call failed.
 */
export async function getRevision(userId: string, attemptId: string, lang: LangCode): Promise<Revision> {
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
    getQuestions(data.question_ids, lang, true) as Promise<DisclosedQuestion[]>,
  ]);

  // The parent exam sheds its config on the way out: `Exam`, not `ExamDetails`.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { config: _config, ...parent_exam } = exam;

  return { parent_exam, questions };
}
