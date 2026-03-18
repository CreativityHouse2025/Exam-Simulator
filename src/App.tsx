import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import Toast from "./components/Toast"
import Header from "./components/Header"
import Loading from "./components/Loading"
import ProtectedRoute from "./guards/ProtectedRoute"
import GuestRoute from "./guards/GuestRoute"
import ExamPage from "./pages/ExamPage"
import SignInPage from "./pages/SignInPage"
import SignUpPage from "./pages/SignUpPage"
import ProfilePage from "./pages/ProfilePage"
import AuthCallbackPage from "./pages/AuthCallbackPage"
import { hasTranslation, setTranslation } from "./utils/translation"
import { LANGUAGES } from "./constants"
import useSettings from "./hooks/useSettings"
import type { LangCode } from "./types"

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
      <Header />
      <Routes>
        <Route path="/signin" element={<GuestRoute><SignInPage /></GuestRoute>} />
        <Route path="/signup" element={<GuestRoute><SignUpPage /></GuestRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/app" element={<ProtectedRoute><ExamPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
      <Toast />
    </>
  )
}

export default App
