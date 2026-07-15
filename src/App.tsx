import React from "react"
import { Routes, Route, Navigate, Outlet } from "react-router-dom"
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
import AttemptHistoryPage from "./pages/AttemptHistoryPage"
import StudentDashboardPage from "./pages/StudentDashboardPage"
import SupervisorDashboardPage from "./pages/SupervisorDashboardPage"
import ExamLibraryPage from "./pages/exam-library"
import ExamDetailPage from "./pages/exam-detail"
import { hasTranslation, setTranslation } from "./utils/translation"
import { LANGUAGES } from "./constants"
import useSettings from "./hooks/useSettings"
import useAuth from "./hooks/useAuth"
import type { LangCode } from "./types"
import SessionProvider from "./providers/SessionProvider"
import RoleGuard from "./guards/RoleGuard"
import ExamPage from "./pages/ExamPage"

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
  const { user } = useAuth()

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
            {/* Public */}
            <Route path="/signin" element={<GuestRoute><SignInPage /></GuestRoute>} />
            <Route path="/signup" element={<GuestRoute><SignUpPage /></GuestRoute>} />
            <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            {/* Protected */}
            <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
              <Route path="profile" element={<ProfilePage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />

              {user?.role === "supervisor" ? (
                <>
                  <Route index element={<SupervisorDashboardPage />} />
                  <Route
                    path="exams"
                    element={
                      <RoleGuard allowedRoles={["supervisor"]}>
                        <ExamLibraryPage />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="exams/:type/:id"
                    element={
                      <RoleGuard allowedRoles={["supervisor"]}>
                        <ExamDetailPage />
                      </RoleGuard>
                    }
                  />
                </>
              ) : (
                // SessionProvider is student-only, and must stay a single stable instance across
                // "/", "/history", and "/exam" so a started session survives navigating to "/exam".
                <Route element={<SessionProvider><Outlet /></SessionProvider>}>
                  <Route index element={<StudentDashboardPage />} />
                  <Route path="history" element={<AttemptHistoryPage />} />
                  <Route path="exam" element={<ExamPage />} />
                </Route>
              )}

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </RoutesArea>
      </AppLayout>
      <Toast />
    </>
  )
}

export default App
