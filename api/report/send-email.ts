import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import { SendEmailRequest } from "../_lib/types.js";
import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js";
import { AppError } from "../_lib/errors/AppError.js";
import { requireEnv } from "../_lib/utils/env.js";

const SENDER_EMAIL = requireEnv("SENDER")
const APP_PASSWORD = requireEnv("APP_PASSWORD")

// Create transporter once
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: { user: SENDER_EMAIL, pass: APP_PASSWORD },
});

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    throw new AppError({ statusCode: 405, code: "METHOD_NOT_ALLOWED", message: "Method not allowed" })
  }

  const { to, subject, text, html } = req.body as SendEmailRequest

  if (!to || !subject || !text) {
    throw new AppError({ statusCode: 400, code: "MISSING_FIELDS", message: "Missing required fields: to, subject, text" })
  }

  const info = await transporter.sendMail({
    from: SENDER_EMAIL,
    to,
    subject,
    text,
    html,
  })

  return res.status(200).json({ message: "Email sent successfully", id: info.messageId })
}

export default withErrorHandler(handler);