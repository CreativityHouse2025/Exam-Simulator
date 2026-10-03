import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/utils";

type ActionCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
  /** Gold reads as "act on the library", plum as "look someone up" — the two halves of the role. */
  accent: "primary" | "secondary";
};

const ACCENTS = {
  primary: {
    rail: "bg-primary",
    icon: "text-primary",
    border: "hover:border-primary",
  },
  secondary: {
    rail: "bg-secondary",
    icon: "text-secondary",
    border: "hover:border-secondary",
  },
} as const;

/** One destination on the supervisor dashboard, sized as a comfortable tap target on mobile. */
const ActionCard: React.FC<ActionCardProps> = ({
  icon: Icon,
  title,
  description,
  to,
  accent,
}) => {
  const tone = ACCENTS[accent];

  return (
    <Link to={to} className="no-select h-full">
      <Card
        className={cn(
          "group h-full gap-0 overflow-hidden border-grey-200 pt-0 transition-colors duration-200 hover:bg-grey-50",
          tone.border,
        )}
      >
        <div className={cn("h-1.5 w-full", tone.rail)} />

        <div className="flex items-start gap-4 p-5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-grey-100">
            <Icon className={cn("size-5", tone.icon)} strokeWidth={1.8} />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block font-bold text-tertiary">{title}</span>
            <span className="mt-1 block text-sm leading-relaxed text-grey-800">
              {description}
            </span>
          </span>

          <ArrowRight
            className={cn(
              "mt-3 size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180",
              tone.icon,
            )}
          />
        </div>
      </Card>
    </Link>
  );
};

export default ActionCard;
