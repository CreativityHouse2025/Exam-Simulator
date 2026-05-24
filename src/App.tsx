import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import styled from "styled-components"
import Toast from "./components/Toast"
import Header from "./components/Header"
import Loading from "./components/Loading"
import ProtectedRoute from "./guards/ProtectedRoute"
import GuestRoute from "./guards/GuestRoute"
import SignInPage from "./pages/SignInPage"
import SignUpPage from "./pages/SignUpPage"
import ProfilePage from "./pages/ProfilePage"
import AuthCallbackPage from "./pages/AuthCallbackPage"
import ForgotPasswordPage from "./pages/ForgotPasswordPage"
import ResetPasswordPage from "./pages/ResetPasswordPage"
import { hasTranslation, setTranslation } from "./utils/translation"
import { LANGUAGES } from "./constants"
import useSettings from "./hooks/useSettings"
import type { LangCode } from "./types"
import ExamRoot from "./components/exam/ExamRoot"

const AppBackground = styled.div`
  position: fixed;
  inset: 0;
  z-index: -1;
  background: radial-gradient(ellipse 80% 65% at 50% 115%, rgba(255, 220, 154, 0.87) 0%, transparent 55%),
    radial-gradient(ellipse 55% 45% at 90% 75%, rgba(181, 150, 93, 0.2) 0%, transparent 50%),
    radial-gradient(ellipse 50% 40% at 10% 85%, rgba(181, 150, 93, 0.14) 0%, transparent 45%),
    radial-gradient(ellipse 90% 80% at 50% 50%, #fafaf8 0%, #f2f0ec 45%, #e9e7e3 100%);
`

const AppLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh;
`

const RoutesArea = styled.div`
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
`

const App: React.FC = () => {
  const { settings } = useSettings()
  const langCode = settings.language
  const [translationVersion, setTranslationVersion] = React.useState<number>(hasTranslation() ? 1 : 0)

  const loadTranslation = React.useCallback(async (code: LangCode) => {
    const translations = (await import(`./data/langs/${code}.json`)).default
    const newLang = LANGUAGES[code]

    setTranslation(newLang, translations)
    document.documentElement.lang = newLang.code
    document.documentElement.dir = newLang.dir
  }, [])

  React.useEffect(() => {
    let cancelled = false
    async function initTranslation() {
      // Do NOT set loading state, keeps Routes mounted during language switch (UX during examination)
      try {
        await loadTranslation(langCode)
      } catch (error) {
        console.error("Failed to load translation: ", error)
      } finally {
        if (!cancelled) setTranslationVersion(v => v + 1)
      }
    }
    initTranslation()
    return () => {
      cancelled = true
    }
  }, [langCode, loadTranslation])

  // if it is loading for the first time
  if (translationVersion === 0) {
    return <Loading size={200} />
  }

  return (
    <>
      <AppBackground />
      <AppLayout>
        <Header />
        <RoutesArea>
          <Routes>
            <Route path="/signin" element={<GuestRoute><SignInPage /></GuestRoute>} />
            <Route path="/signup" element={<GuestRoute><SignUpPage /></GuestRoute>} />
            <Route path="/profile" element={<ProtectedRoute redirectTo="/signin"><ProfilePage /></ProtectedRoute>} />
            <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/reset-password" element={<ProtectedRoute redirectTo="/signin"><ResetPasswordPage /></ProtectedRoute>} />
            {/* SessionProvider wraps both /history and /app/* so AttemptHistoryPage
                can call resumeAttempt, and CoverPage can call startNewExam / resumeAttempt. */}
            <Route path="/*" element={<ProtectedRoute redirectTo="/signin"><ExamRoot /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </RoutesArea>
      </AppLayout>
      <Toast />
    </>
  )
}

export default App
