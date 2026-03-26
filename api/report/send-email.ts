import nodemailer from "nodemailer"
import DOMPurify from "isomorphic-dompurify"
import type { SendEmailRequest } from "../_lib/types.js"
import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { withAuth } from "../_lib/middleware/withAuth.js"
import { AppError } from "../_lib/errors/AppError.js"
import { requireEnv } from "../_lib/utils/env.js"
import { successResponse } from "../_lib/utils/response.js"
import { assertJsonObject, parseJsonBody } from "../_lib/utils/parseBody.js"

const SENDER_EMAIL = requireEnv("SENDER")
const APP_PASSWORD = requireEnv("APP_PASSWORD")

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: { user: SENDER_EMAIL, pass: APP_PASSWORD },
})

export const POST = withErrorHandler(
  withAuth(async (req, authUser, cookieHeaders) => {
    // use 100KB for email requests paylaods
    const body = assertJsonObject(await parseJsonBody(req, 100 * 1024))
    const { subject, text, html } = body as SendEmailRequest

    if (!subject || !text) {
      throw new AppError({ statusCode: 400, code: "MISSING_FIELDS", message: "Missing required fields: subject, text" })
    }

    // Sanitize input to prevent XSS on client's side
    const sanitizedSubject = DOMPurify.sanitize(subject, { ALLOWED_TAGS: [] }).slice(0, 200)
    const sanitizedHtml = html ? DOMPurify.sanitize(html, { WHOLE_DOCUMENT: true }) : undefined

    const info = await transporter.sendMail({
      from: SENDER_EMAIL,
      to: authUser.email,
      subject: sanitizedSubject,
      text,
      html: sanitizedHtml,
    })

    return successResponse({ message: "Email sent successfully", id: info.messageId }, 200, cookieHeaders)
  }),
)
