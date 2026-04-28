import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { successResponse } from "../_lib/utils/response.js"
/**
 * Using static import for read-only files is generally better for vercel serverless functions (reads from memory)
 * Using fs will add I/O and parsing overhead (reads from disk)
 */
import questions from '../../src/data/exam-data/categories.json' with { type: 'json' }

export const GET = withErrorHandler(async (request: Request) => {
  return successResponse(questions[0].id, 201)
})
