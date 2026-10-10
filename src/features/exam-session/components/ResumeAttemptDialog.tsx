import { Hourglass } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/core/utils/format";
import { translate } from "@/core/utils/translation";
import type { Attempt } from "@/core/api/apiTypes";

type ResumeAttemptDialogProps = {
  /** The caller only mounts this while an offer exists — Dialog stays `open` for its whole lifetime. */
  attempt: Attempt;
  examName: string;
  onResume: () => void;
  onOpenChange: (open: boolean) => void;
};

/**
 * Offers to resume the student's open attempt after Start found one. Declining just closes it:
 * nothing is created, and the attempt stays in history.
 */
const ResumeAttemptDialog = ({
  attempt,
  examName,
  onResume,
  onOpenChange,
}: ResumeAttemptDialogProps) => (
  <Dialog open={true} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader className="items-center text-center sm:items-start sm:text-start">
        <div className="flex size-12 items-center justify-center rounded-full bg-grey-100">
          <Hourglass className="size-6 text-grey-800" strokeWidth={1.6} />
        </div>
        <DialogTitle className="text-tertiary">
          {translate("attempts.resume.title")}
        </DialogTitle>
        <DialogDescription>
          {translate("attempts.resume.description", [
            examName,
            formatDate(attempt.createdAt),
            attempt.currentIndex + 1,
            attempt.totalQuestions,
          ])}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {translate("attempts.resume.cancel")}
        </Button>
        <Button onClick={onResume}>
          {translate("attempts.resume.resume")}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default ResumeAttemptDialog;
