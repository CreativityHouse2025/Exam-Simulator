import nodemailer from "nodemailer"
import sanitizeHtml from "sanitize-html"
import type { SendEmailRequestBody } from "../_lib/types.js"
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

const MAX_EMAIL_BODY_BYTES = 2.5 * 1024 * 1024 // 2.5 MB — accommodates base64-encoded PDF attachments

export const POST = withErrorHandler(
  withAuth(async (req, authUser, cookieHeaders) => {
    const body = assertJsonObject(await parseJsonBody(req, MAX_EMAIL_BODY_BYTES))
    const { subject, text, html, attachments } = body as SendEmailRequestBody

    if (!subject || !text) {
      throw new AppError({ statusCode: 400, code: "MISSING_FIELDS", message: "Missing required fields: subject, text" })
    }

    if (attachments !== undefined) {
      if (!Array.isArray(attachments)) {
        throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "attachments must be an array" })
      }

      for (let i = 0; i < attachments.length; i++) {
        const a = attachments[i]
        if (typeof a?.filename !== "string" || a.filename.trim().length === 0) {
          throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `attachments[${i}].filename must be a non-empty string` })
        }
        if (typeof a?.content !== "string" || a.content.trim().length === 0) {
          throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: `attachments[${i}].content must be a non-empty base64 string` })
        }
      }
    }

    // Sanitize input to prevent XSS on client's side
    const sanitizedSubject = sanitizeHtml(subject, { allowedTags: [] }).slice(0, 200)
    const sanitizedHtml = html
      ? sanitizeHtml(html, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat([
            "html", "head", "meta", "body",
            "h1", "h2",
            "table", "thead", "tbody", "tr", "th", "td",
            "div", "span", "br", "hr", "img",
          ]),
          allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            "*": ["style", "class", "dir", "lang"],
            meta: ["charset", "name", "content"],
            table: ["width", "cellpadding", "cellspacing", "border"],
            td: ["align", "valign", "colspan", "rowspan", "width"],
            th: ["align", "valign", "colspan", "rowspan"],
            img: ["src", "alt", "width", "height"],
          },
          allowedStyles: {
            "*": {
              color: [/.*/],
              "background-color": [/.*/],
              background: [/.*/],
              "text-align": [/.*/],
              "font-size": [/.*/],
              "font-weight": [/.*/],
              "font-family": [/.*/],
              margin: [/.*/],
              "margin-top": [/.*/],
              "margin-bottom": [/.*/],
              padding: [/.*/],
              "padding-top": [/.*/],
              "padding-bottom": [/.*/],
              "padding-left": [/.*/],
              "padding-right": [/.*/],
              border: [/.*/],
              "border-bottom": [/.*/],
              "border-radius": [/.*/],
              "border-collapse": [/.*/],
              width: [/.*/],
              height: [/.*/],
              "line-height": [/.*/],
              "text-decoration": [/.*/],
              direction: [/.*/],
              overflow: [/.*/],
              "box-shadow": [/.*/],
            },
          },
        })
      : undefined

    const info = await transporter.sendMail({
      from: SENDER_EMAIL,
      to: authUser.email,
      subject: sanitizedSubject,
      text,
      html: sanitizedHtml,
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content, "base64"),
      })),
    })

    return successResponse({ message: "Email sent successfully", id: info.messageId }, 200, cookieHeaders)
  }),
)
