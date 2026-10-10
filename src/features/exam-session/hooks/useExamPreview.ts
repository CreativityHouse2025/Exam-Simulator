import React from "react";
import { useNavigate } from "react-router-dom";
import { useSessionControl } from "../contexts";
import { ROUTES } from "@/routes/routes";

/** Starts a supervisor preview session for one exam of a track and navigates to it on success. */
export default function useExamPreview(trackId: string, examId: number) {
  const navigate = useNavigate();
  const { startNewExam } = useSessionControl();
  const [isPreviewing, setIsPreviewing] = React.useState(false);

  const handlePreview = async () => {
    setIsPreviewing(true);
    const started = await startNewExam(examId, { preview: true });
    if (started?.result === "started") {
      navigate(ROUTES.examPreview.to(trackId, examId, started.attemptId));
    } else setIsPreviewing(false);
  };

  return { isPreviewing, handlePreview };
}
