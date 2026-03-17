import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import Toast from "./components/Toast"
import ProtectedRoute from "./guards/ProtectedRoute"
import GuestRoute from "./guards/GuestRoute"
import ExamPage from "./pages/ExamPage"
import SignInPage from "./pages/SignInPage"
import SignUpPage from "./pages/SignUpPage"
import ProfilePage from "./pages/ProfilePage"
import AuthCallbackPage from "./pages/AuthCallbackPage"

const App: React.FC = () => {
  return (
    <>
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
