import React from "react"
import { Navigate } from "react-router-dom"
import { useExam } from "../contexts"

/** Redirects an authenticated user to the cover page if there is no exam loaded. */
const ExamGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { exam } = useExam()

  if (!exam) return <Navigate to="/app" />;

  return <>{children}</>
}

export default ExamGuard
