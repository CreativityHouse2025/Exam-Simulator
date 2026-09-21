import { Loader2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import useExamPreview from "@/hooks/useExamPreview";
import { translate } from "@/utils/translation";

type PreviewExamButtonProps = {
  trackId: string;
  examId: number;
  className?: string;
};

/** Shared "Preview Exam" action — used on both the exam-library cards and the exam-detail header. Icon-only below md. */
const PreviewExamButton = ({
  trackId,
  examId,
  className = "",
}: PreviewExamButtonProps) => {
  const { isPreviewing, handlePreview } = useExamPreview(trackId, examId);

  return (
    <Button
      variant="outline"
      size="sm"
      className={`gap-1.5 md:min-w-36 ${className}`}
      disabled={isPreviewing}
      onClick={handlePreview}
      aria-label={translate("exam.library.preview")}
    >
      {isPreviewing ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <PlayCircle className="size-4" />
      )}
      <span className="hidden md:inline">
        {translate("exam.library.preview")}
      </span>
    </Button>
  );
};

export default PreviewExamButton;
