import React from "react";
import { ExamContext } from "../contexts";
import type { ExamContextType } from "../types";

/**
 * Sets ExamContext from already-resolved data. Never fetches — SessionProvider builds its props
 * from an attempt/revision response, and a supervisor-side fetch wrapper (question viewer,
 * preview) builds them from GET /api/exams/:examId/questions. Both render this the same way.
 */
export default function ExamProvider({
  examDetails,
  questions,
  children,
}: ExamContextType & { children: React.ReactNode }) {
  return (
    <ExamContext.Provider value={{ examDetails, questions }}>
      {children}
    </ExamContext.Provider>
  );
}
