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

  const { error: reportError, loading: reportLoading, generateReport, downloadReport } = useReport();
  const { sendEmail, loading: emailLoading, error: emailError } = useEmail();
  const { showToast } = useToast();

  const feedback = React.useMemo(() => ({
    "sending": translate("report.sending"),
    "sent": translate("report.sent"),
    "error": translate("report.error")
  }), [langCode, translate])

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
        const pdf = await generateReport({
          exam,
          userAnswers: answers,
          langCode,
          userFullName: settings.fullName as string,
        });
        // TODO: 1. Generate dynamic subject, text, and filename
        // TODO: 2. Prompt user for email & full name
        await sendEmail({
          to: "sadawe147@gmail.com",
          subject: "Software design report",
          text: "Your report is ready to download.",
          attachments: [{ filename: "report.pdf", content: pdf }],
        });
        update!([SESSION_ACTION_TYPES.SET_EMAIL_SENT, true]);
        showToast(feedback.sent, 5000)
      } catch (error) {
        console.error("Error sending email: ", error);
      }
    }

    generateAndSend();
  }, [finished, emailSent, generateReport, sendEmail, exam, answers, langCode, settings.fullName, update]);



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
