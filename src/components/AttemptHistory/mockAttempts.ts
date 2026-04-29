export type AttemptSummary = {
  id: string
  exam_type: string
  exam_id: number | null
  category_id: number | null
  exam_state: string
  score: number
  status: string | null
  created_at: string
}

const mockAttempts: AttemptSummary[] = [
  {
    id: "a1b2c3d4-0001",
    exam_type: "full",
    exam_id: 10,
    category_id: null,
    exam_state: "in-progress",
    score: 0,
    status: null,
    created_at: "2026-04-29T10:30:00.000Z",
  },
  {
    id: "a1b2c3d4-0002",
    exam_type: "domain",
    category_id: 8,
    exam_id: null,
    exam_state: "completed",
    score: 82,
    status: "pass",
    created_at: "2026-04-27T14:15:00.000Z",
  },
  {
    id: "a1b2c3d4-0003",
    exam_type: "full",
    exam_id: 14,
    category_id: null,
    exam_state: "completed",
    score: 58,
    status: "fail",
    created_at: "2026-04-25T09:00:00.000Z",
  },
  {
    id: "a1b2c3d4-0004",
    exam_type: "domain",
    category_id: 3,
    exam_id: null,
    exam_state: "completed",
    score: 91,
    status: "pass",
    created_at: "2026-04-22T16:45:00.000Z",
  },
  {
    id: "a1b2c3d4-0005",
    exam_type: "full",
    exam_id: 1,
    category_id: null,
    exam_state: "completed",
    score: 74,
    status: "pass",
    created_at: "2026-04-20T11:00:00.000Z",
  },
  {
    id: "a1b2c3d4-0006",
    exam_type: "domain",
    category_id: 24,
    exam_id: null,
    exam_state: "in-progress",
    score: 0,
    status: null,
    created_at: "2026-04-18T08:30:00.000Z",
  }
]

export default mockAttempts
