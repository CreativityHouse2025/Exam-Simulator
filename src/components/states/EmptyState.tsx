import React from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/components/ui/utils";

type EmptyStateProps = {
  message: string;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
};

/** Shared "nothing here" block — also the no-search-results state, with a different message. */
const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  hint,
  icon: Icon = Inbox,
  className,
}) => (
  <div
    className={cn(
      "flex flex-col items-center gap-3 rounded-xl border border-dashed border-grey-300 px-4 py-14 text-center",
      className,
    )}
  >
    <Icon className="size-9 text-grey-500" strokeWidth={1.4} />
    <p className="text-sm font-semibold text-grey-900">{message}</p>
    {hint && <p className="max-w-80 text-xs text-grey-700">{hint}</p>}
  </div>
);

export default EmptyState;
