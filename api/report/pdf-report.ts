import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { withAuth } from "../_lib/middleware/withAuth.js"
import { parseJsonBody } from "../_lib/utils/parseBody.js"
import { successResponse } from "../_lib/utils/response.js"
import { validateReportBody } from "../_lib/validators/reportValidator.js"
import { generatePdf } from "../_lib/services/reportService.js"
import { GenerateReportRequestBody } from "../_lib/types.js"

const MAX_REPORT_BODY_BYTES = 2 * 1024 * 1024 // 2 MB — full exam data can be large

export const POST = withErrorHandler(
  withAuth(async (req, _authUser, cookieHeaders) => {
    const raw = await parseJsonBody(req, MAX_REPORT_BODY_BYTES)
    const input: GenerateReportRequestBody = validateReportBody(raw)
    const pdfBase64 = generatePdf(input)
    return successResponse({ pdfBase64 }, 200, cookieHeaders)
  }),
)
