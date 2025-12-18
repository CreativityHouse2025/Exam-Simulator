import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import { SendEmailRequest } from '../src/types'
import { Attachment } from 'nodemailer/lib/mailer';

const SENDER_EMAIL = process.env.SENDER;
const APP_PASSWORD = process.env.APP_PASSWORD;

if (!SENDER_EMAIL || !APP_PASSWORD) {
  throw new Error("Missing EMAIL_USER or APP_PASSWORD environment variables");
}

// Create transporter once
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: { user: SENDER_EMAIL, pass: APP_PASSWORD },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const emailRequest = req.body as SendEmailRequest;

    const { to, subject, text, attachments } = emailRequest;
    if (!attachments) {
      throw new Error("Error: no report was attached")
    }
    const bufferedAttachments: Attachment[] = attachments.map((a) => (
      { 
        filename: a.filename,
        content: Buffer.from(a.content, 'base64')
      }
    ))

    if (!to || !subject || !text) {
      return res.status(400).json({ error: "Missing request information" });
    }

    const info = await transporter.sendMail({
      from: SENDER_EMAIL,
      to,
      subject,
      text,
      attachments: bufferedAttachments,
    });

    return res.status(200).json({ message: "Email sent successfully", id: info.messageId });
  } catch (error: any) {
    console.error("Email send error:", error);
    return res.status(500).json({ error: error.message });
  }
}
