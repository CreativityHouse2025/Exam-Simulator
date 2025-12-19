import type { ThemedStyles } from '../../types'

import React from 'react'
import styled from 'styled-components'
import Exam from './Exam'
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

const ContentComponent: React.FC<ContentProps> = ({ open }) => {
  const { examState, reviewState } = React.useContext(SessionExamContext)
  const { emailSent, answers, update } = React.useContext(SessionDataContext)
  const exam = React.useContext(ExamContext)

  const { settings } = useSettings();
  const langCode = settings.language;

  const finished = examState === 'completed'
  const summary = reviewState === 'summary'

  const { error: reportError, loading: reportLoading, generateReport } = useReport();
  const { sendEmail, loading: emailLoading, error: emailError } = useEmail();
  const { showToast } = useToast();

  const feedback = React.useMemo(() => ({
    "sending": translate("report.sending"),
    "sent": translate("report.sent"),
    "error": translate("report.error")
  }), [langCode, translate])

  const results = useResults(finished);  

  const writeEmail = React.useCallback(
    (fullName: string, results: Results) => {
      const timestamp = new Date().toISOString().replace(/[:.-]/g, "")
      const company = translate('about.title')

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
          ? [{ type: 'passing', value: `${results.passPercent} %` }]
          : []),

        { type: 'score', value: `${results.score} %` },
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

      const summary = rows
        .map(
          ({ type, value }) =>
            `${translate(`content.summary.${type}`)}: ${value}`
        )
        .join('\n')

      const body = replacePlaceholders(
        rawBody,
        fullName,
        company,
        summary
      )

      const filename = `Report_${fullName.replace(/\s+/g, '_')}_${timestamp}.pdf`

      return { subject, body, filename }
    },
    [langCode]
  )


  React.useEffect(() => {
    if (emailLoading || reportLoading) {
      showToast(feedback.sending, 5000)
    }
  }, [emailLoading, reportLoading, showToast])

  React.useEffect(() => {
    if (emailError || reportError) {
      showToast(feedback.error, 5000)
    }
  }, [emailError, reportError, showToast])

  React.useEffect(() => {
    if (!finished) return;
    if (emailSent) return;

    async function generateAndSend() {
      try {
        const userFullName = settings.fullName;
        
        if (!userFullName) {
          console.warn("User fullname is missing")
          return;
        };
        const pdf = await generateReport({
          exam,
          userAnswers: answers,
          langCode,
          userFullName,
        });
        const userEmail = settings.email;
        if (!userEmail) {
          console.warn("User email is missing")
          return;
        }
        // use as results because writeEmail is only called if exam is finished
        
        const email = writeEmail(userFullName, results as Results) 
        
        await sendEmail({
          to: userEmail,
          subject: email.subject,
          text: email.body,
          attachments: [{ filename: email.filename, content: pdf }],
        });
        update!([SESSION_ACTION_TYPES.SET_EMAIL_SENT, true]);
        showToast(feedback.sent, 5000)
      } catch (error) {
        console.error("Error sending email: ", error);
      }
    }

    generateAndSend();
  }, [finished, emailSent, writeEmail, generateReport, sendEmail, exam, answers, langCode, settings.fullName, update]);



  return (
    <MainStyles id="main" $open={open}>
      <ContentStyles id="content">{finished && summary ? <Summary /> : <Exam isReview={finished} />}</ContentStyles>
    </MainStyles>
  )
}

export default ContentComponent

export interface ContentProps {
  open: boolean
}

export interface MainStylesProps {
  $open: boolean
}
