import nodemailer from "nodemailer"
import type { SendEmailRequest } from "../_lib/types.js"
import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { withAuth } from "../_lib/middleware/withAuth.js"
import { AppError } from "../_lib/errors/AppError.js"
import { requireEnv } from "../_lib/utils/env.js"
import { successResponse } from "../_lib/utils/response.js"
import { assertJsonObject } from "../_lib/utils/parseBody.js"

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
    const body = assertJsonObject(await req.json())
    const { subject, text, html } = body as SendEmailRequest

    if (!subject || !text) {
      throw new AppError({ statusCode: 400, code: "MISSING_FIELDS", message: "Missing required fields: subject, text" })
    }

    const info = await transporter.sendMail({
      from: SENDER_EMAIL,
      to: authUser.email,
      subject,
      text,
      html,
    })

    return successResponse({ message: "Email sent successfully", id: info.messageId }, 200, cookieHeaders)
  }),
)
