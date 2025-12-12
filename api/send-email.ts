import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

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
    const { to, subject, text, filename, reportBase64 } = req.body as {
      to: string;
      subject: string;
      text: string;
      filename: string;
      reportBase64: string; // encoded pdf exam report
    };

    // if (!reportBase64) {
    //   return res.status(400).json({ error: "Missing reportBase64" });
    // }

    // const reportBuffer = Buffer.from(reportBase64, "base64");

    const info = await transporter.sendMail({
      from: SENDER_EMAIL,
      to,
      subject,
      text,
      // attachments: [{ filename, content: reportBuffer, contentType: "application/pdf" }],
    });

    return res.status(200).json({ message: "Email sent successfully", id: info.messageId });
  } catch (error: any) {
    console.error("Email send error:", error);
    return res.status(500).json({ error: error.message });
  }
}
