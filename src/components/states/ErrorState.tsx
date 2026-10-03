import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { translate } from "@/utils/translation";
import { cn } from "@/components/ui/utils";

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
};

/** Inline failure block, scoped to the section that failed so the rest of the page still renders. */
const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
  isRetrying = false,
  className,
}) => (
  <div
    role="alert"
    className={cn(
      "flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive-bg px-4 py-10 text-center",
      className,
    )}
  >
    <AlertTriangle className="size-8 text-destructive" strokeWidth={1.6} />
    <p className="max-w-80 text-sm text-grey-900">{message}</p>

    {onRetry && (
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        disabled={isRetrying}
        className="gap-2 text-grey-900"
      >
        <RefreshCw
          className={cn(
            "size-4 text-primary",
            isRetrying && "animate-spin-fast",
          )}
        />
        {translate("common.retry")}
      </Button>
    )}
  </div>
);

export default ErrorState;
