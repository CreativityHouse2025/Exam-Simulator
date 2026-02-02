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

  const { error: reportError, loading: reportLoading, generateReport } = useReport();
  const { sendEmail, loading: emailLoading, error: emailError } = useEmail();
  const { showToast } = useToast();

  const feedback = React.useMemo(() => ({
    "sending": translate("report.sending"),
    "sent": translate("report.sent"),
    "error": translate("report.error")
  }), [langCode])

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
    
    async function generateAndSend() {
      if (emailInitiatedRef.current) return;
      emailInitiatedRef.current = true;

      try {
        const userFullName = emailDataRef.current?.fullName as string;
        
        const userEmail = emailDataRef.current?.email as string;
        
        const pdf = await generateReport({ // @ts-ignore
          exam: emailDataRef.current?.exam, // @ts-ignore
          userAnswers: emailDataRef.current?.answers, // @ts-ignore
          langCode: emailDataRef.current?.langCode,
          userFullName,
        });
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
        emailInitiatedRef.current = false; // reset on failure to allow retry
      }
    }

    generateAndSend();
  }, [finished, emailSent, writeEmail, generateReport, sendEmail, update]);

  return (
    <MainStyles id="main" $open={open}>
      <ContentStyles id="content">{finished && summary ? <Summary onRevision={onRevision} examType={examType as ExamType}/> : <ExamComponent isReview={finished} />}</ContentStyles>
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