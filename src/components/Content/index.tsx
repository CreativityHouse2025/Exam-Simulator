import type { Answers, Exam, ExamType, LangCode, ThemedStyles } from '../../types'

import React from 'react'
import styled from 'styled-components'
import ExamComponent from './Exam'
import Summary from './Summary'
import { ExamContext, SessionDataContext, SessionExamContext } from '../../contexts'
import { useReport } from '../../hooks/useReport'
import { useEmail } from '../../hooks/useEmail'
import useSettings from '../../hooks/useSettings'
import { SESSION_ACTION_TYPES } from '../../constants'
import useToast from '../../hooks/useToast'
import { translate } from '../../utils/translation'
import { formatTimer, formatDate } from '../../utils/format'
import type { Results } from '../../types'
import useResults from '../../hooks/useResults'
import { RevisionExamOptions } from '../../App'

export const MainStyles = styled.main<MainStylesProps>`
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: white;
`

const ContentStyles = styled.div<ThemedStyles>`
  width: 100%;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  display: grid;
  justify-items: center;
  align-items: center;
  padding: 2rem;
  transition: 0.3s;
`

const ContentComponent: React.FC<ContentProps> = ({ open, onRevision }) => {
  const { examState, reviewState } = React.useContext(SessionExamContext)
  const { emailSent, answers, examType, update } = React.useContext(SessionDataContext)
  const exam = React.useContext(ExamContext)

  const { settings } = useSettings();
  const langCode = settings.language;

  const finished = examState === 'completed'
  const summary = reviewState === 'summary'

  const { sendEmail, loading: emailLoading, error: emailError } = useEmail();
  const { showToast } = useToast();

  const feedback = {
    "sending": translate("report.sending"),
    "sent": translate("report.sent"),
    "error": translate("report.error")
  }

  React.useEffect(() => {
    if (emailLoading) {
      showToast(feedback.sending, 5000)
    }
  }, [emailLoading, showToast])

  React.useEffect(() => {
    if (emailError) {
      showToast(feedback.error, 5000)
    }
  }, [emailError, reportError, showToast])

  const results = useResults(finished);

  const writeEmail = React.useCallback(
    (fullName: string, results: Results) => {
      const company = translate('about.title')
      const isRTL = langCode === 'ar'

      const rawSubject = translate('report.email.subject')
      const rawBody = translate('report.email.body')

      const replacePlaceholders = (text: string, ...values: string[]) =>
        values.reduce((str, val, i) => str.replace(`$${i + 1}`, val), text)

      const subject = replacePlaceholders(rawSubject, company)

      const rows: Array<{ type: string; value: string }> = [
        ...(results.pass !== undefined
          ? [{ type: 'status', value: translate(`content.summary.${results.pass ? 'pass' : 'fail'}`) }]
          : []),

        ...(results.passPercent !== undefined
          ? [{ type: 'passing', value: `${results.passPercent}%` }]
          : []),

        { type: 'score', value: `${results.score}%` },
        { type: 'time', value: formatTimer(results.elapsedTime) },
        { type: 'date', value: formatDate(results.date) },
        { type: 'category', value: results.categoryLabel },
        {
          type: 'correct',
          value: `${results.correctCount} / ${results.totalQuestions}`
        },
        {
          type: 'incorrect',
          value: `${results.incorrectCount} / ${results.totalQuestions}`
        },
        {
          type: 'incomplete',
          value: `${results.incompleteCount} / ${results.totalQuestions}`
        }
      ]

      const summaryRows = rows
        .map(
          ({ type, value }) => `
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #f8e3e0; font-size: 1.15rem; font-weight: 600; color: #593752; text-align: ${isRTL ? 'right' : 'left'};">
              ${translate(`content.summary.${type}`)}
            </td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #f8e3e0; font-size: 1.15rem; color: #301e2c; text-align: ${isRTL ? 'left' : 'right'};">
              ${value}
            </td>
          </tr>
        `
        )
        .join('')

      const introText = replacePlaceholders(rawBody, fullName, company, '')
        .split('\n\n')[0]

      const htmlBody = `
      <!DOCTYPE html>
      <html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${langCode}">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: ${isRTL ? 'Arial, sans-serif' : '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif'}; background-color: #f5f5f5; direction: ${isRTL ? 'rtl' : 'ltr'};">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #593752 0%, #301e2c 100%); padding: 32px 24px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                        ${company}
                      </h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 32px 24px;">
                      <p style="margin: 0 0 24px; color: #301e2c; font-size: 16px; line-height: 1.6; text-align: ${isRTL ? 'right' : 'left'};">
                        ${introText}
                      </p>

                      <!-- Results Summary -->
                      <h2 style="margin: 0 0 16px; color: #593752; font-size: 20px; font-weight: 600; text-align: ${isRTL ? 'right' : 'left'};">
                        ${translate('content.summary.title') || 'Results Summary'}
                      </h2>
                      
                      <table width="100%" cellpadding="0" cellspacing="0" style="border: 2px solid #b5965d; border-radius: 6px; overflow: hidden;" dir="${isRTL ? 'rtl' : 'ltr'}">
                        ${summaryRows}
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #593752; padding: 24px; text-align: center;">
                      <p style="margin: 0; color: #ffffff; font-size: 14px;">
                        © ${new Date().getFullYear()} ${company}.
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

      const summary = rows
        .map(
          ({ type, value }) =>
            `${translate(`content.summary.${type}`)}: ${value}`
        )
        .join('\n')

      // text body as a fallback if HTML didn't work in nodemailer
      const textBody = replacePlaceholders(
        rawBody,
        fullName,
        company,
        summary
      )

      return { subject, textBody, htmlBody }
    },
    [langCode]
  )

  const emailInitiatedRef = React.useRef<boolean>(false);
  const emailDataRef = React.useRef<EmailDataRef>(null);

  React.useEffect(() => {
    if (!finished) return;
    if (!settings.email || !settings.fullName) return;

    // Capture values when exam finishes
    if (!emailDataRef.current) {
      emailDataRef.current = {
        exam,
        answers,
        langCode,
        fullName: settings.fullName,
        email: settings.email
      };
    }
  }, [finished, exam, answers, langCode, settings]);

  React.useEffect(() => {
    if (!finished) return;
    if (emailSent) return;
    if (!emailDataRef.current) return;

    async function sendEmailToUser() {
      if (emailInitiatedRef.current) return;
      emailInitiatedRef.current = true;

      try {
        const userFullName = emailDataRef.current?.fullName as string;

        const userEmail = emailDataRef.current?.email as string;

        const email = writeEmail(userFullName, results as Results)

        await sendEmail({
          to: userEmail,
          subject: email.subject,
          text: email.textBody,
          html: email.htmlBody
        });
        update!([SESSION_ACTION_TYPES.SET_EMAIL_SENT, true]);
        showToast(feedback.sent, 5000)
      } catch (error) {
        console.error("Error sending email: ", error);
        emailInitiatedRef.current = false; // reset on failure to allow retry
      }
    }

    sendEmailToUser();
  }, [finished, emailSent, writeEmail, sendEmail, update]);

  return (
    <MainStyles id="main" $open={open}>
      <ContentStyles id="content">{finished && summary ? <Summary onRevision={onRevision} examType={examType as ExamType} /> : <ExamComponent isReview={finished} />}</ContentStyles>
    </MainStyles>
  )
}

export default ContentComponent

export interface ContentProps {
  open: boolean
  onRevision: (options: RevisionExamOptions) => void
}

export interface MainStylesProps {
  $open: boolean
}

type EmailDataRef = {
  exam: Exam;
  answers: Answers;
  langCode: LangCode;
  fullName: string;
  email: string;
} | null