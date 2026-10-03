import type { AttemptSummary } from "../apiTypes";

// What an exam card shows about this student's own history with that exam.
export type ExamAttemptStats = {
  count: number;
  inProgressCount: number;
};

const EMPTY_STATS: ExamAttemptStats = { count: 0, inProgressCount: 0 };

/**
 * Groups a track's attempts by exam id.
 *
 * The API caps this list at the 25 most recent attempts per track, so a count here is "recent",
 * never a lifetime total — label it accordingly.
 */
export function statsByExamId(
  attempts: AttemptSummary[],
): Map<number, ExamAttemptStats> {
  const statsByExam = new Map<number, ExamAttemptStats>();

  for (const attempt of attempts) {
    const current = statsByExam.get(attempt.examId) ?? EMPTY_STATS;
    statsByExam.set(attempt.examId, {
      count: current.count + 1,
      inProgressCount:
        current.inProgressCount + (attempt.examState === "in-progress" ? 1 : 0),
    });
  }

  return statsByExam;
}

export function statsForExam(
  statsByExam: Map<number, ExamAttemptStats>,
  examId: number,
): ExamAttemptStats {
  return statsByExam.get(examId) ?? EMPTY_STATS;
}
