import { Routes, Route, Outlet, Navigate } from 'react-router-dom'
import SessionProvider from '../../providers/SessionProvider'
import AttemptHistoryPage from '../../pages/AttemptHistoryPage'
import CoverPage from '../../pages/CoverPage'
import ExamSessionRouter from './ExamSessionRouter'

/**
 * Root component for the session-gated portion of the app.
 * Wraps all routes that require an active session in SessionProvider.
 */
export default function ExamRoot() {
  return (
    <SessionProvider>
      <Routes>
        <Route path="/history" element={<AttemptHistoryPage />} />
        <Route path="/app" element={<Outlet />}>
          <Route index element={<CoverPage />} />
          <Route path="exam" element={<ExamSessionRouter />} />
        </Route>
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </SessionProvider>
  )
}
