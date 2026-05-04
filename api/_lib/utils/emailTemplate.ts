import type { LangCode } from "../types.js"

export type EmailSummaryRow = { type: string; value: string }

export type EmailTemplateTranslations = {
  /** about.title */
  companyName: string
  /** report.email.subject — use $1 for company name */
  subject: string
  /** report.email.body — use $1 for full name, $2 for company name */
  body: string
  /** content.summary.title */
  summaryTitle: string
  /** Maps each row.type → its translated label (e.g. "score" → "Score") */
  rowLabels: Record<string, string>
}

export type EmailTemplateInput = {
  fullName: string
  langCode: LangCode
  /** Pre-computed result rows; the caller builds these from exam results */
  rows: EmailSummaryRow[]
  translations: EmailTemplateTranslations
}

export type EmailTemplateOutput = {
  subject: string
  textBody: string
  htmlBody: string
}

function replacePlaceholders(text: string, ...values: string[]): string {
  return values.reduce((str, val, i) => str.replace(`$${i + 1}`, val), text)
}

export function buildSummaryEmail({ fullName, langCode, rows, translations }: EmailTemplateInput): EmailTemplateOutput {
  const { companyName, subject: rawSubject, body: rawBody, summaryTitle, rowLabels } = translations
  const isRTL = langCode === "ar"

  const subject = replacePlaceholders(rawSubject, companyName)
  const introText = replacePlaceholders(rawBody, fullName, companyName)

  const summaryRows = rows
    .map(
      ({ type, value }) => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #f8e3e0; font-size: 1.15rem; font-weight: 600; color: #593752; text-align: ${isRTL ? "right" : "left"};">
          ${rowLabels[type] ?? type}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #f8e3e0; font-size: 1.15rem; color: #301e2c; text-align: ${isRTL ? "left" : "right"};">
          ${value}
        </td>
      </tr>
    `
    )
    .join("")

  const htmlBody = `
    <!DOCTYPE html>
    <html dir="${isRTL ? "rtl" : "ltr"}" lang="${langCode}">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: ${isRTL ? "Arial, sans-serif" : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"}; background-color: #f5f5f5; direction: ${isRTL ? "rtl" : "ltr"};">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                <tr>
                  <td style="background: linear-gradient(135deg, #593752 0%, #301e2c 100%); padding: 32px 24px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                      ${companyName}
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 32px 24px;">
                    ${introText
                      .split("\n\n")
                      .map(
                        (paragraph: string) =>
                          `<p style="margin: 0 0 16px; color: #301e2c; font-size: 16px; line-height: 1.6; text-align: ${isRTL ? "right" : "left"};">${paragraph}</p>`
                      )
                      .join("")}

                    <h2 style="margin: 0 0 16px; color: #593752; font-size: 20px; font-weight: 600; text-align: ${isRTL ? "right" : "left"};">
                      ${summaryTitle}
                    </h2>

                    <table width="100%" cellpadding="0" cellspacing="0" style="border: 2px solid #b5965d; border-radius: 6px; overflow: hidden;" dir="${isRTL ? "rtl" : "ltr"}">
                      ${summaryRows}
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="background-color: #593752; padding: 24px; text-align: center;">
                    <p style="margin: 0; color: #ffffff; font-size: 14px;">
                      © ${new Date().getFullYear()} ${companyName}.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `

  const textSummary = rows.map(({ type, value }) => `${rowLabels[type] ?? type}: ${value}`).join("\n")
  const textBody = `${introText}\n\n${textSummary}`

  return { subject, textBody, htmlBody }
}
