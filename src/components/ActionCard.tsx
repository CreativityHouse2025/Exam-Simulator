import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Card } from "./ui/card";
import { cn } from "./ui/utils";

/** Classes for the rail, icon and hover border; `style` sets any CSS variable they read. */
export type ActionCardTone = {
  rail: string;
  icon: string;
  hoverBorder: string;
  style?: React.CSSProperties;
};

type ActionCardProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  to: string;
  /** Gold reads as "act on the library", plum as "look someone up" — the two halves of the role. */
  accent: keyof typeof ACCENTS | ActionCardTone;
};

const ACCENTS = {
  primary: {
    rail: "bg-primary",
    icon: "text-primary",
    hoverBorder: "hover:border-primary",
  },
  secondary: {
    rail: "bg-secondary",
    icon: "text-secondary",
    hoverBorder: "hover:border-secondary",
  },
} as const satisfies Record<string, ActionCardTone>;

/** One destination card, sized as a comfortable tap target on mobile. */
const ActionCard: React.FC<ActionCardProps> = ({
  icon: Icon,
  title,
  description,
  to,
  accent,
}) => {
  const tone: ActionCardTone =
    typeof accent === "string" ? ACCENTS[accent] : accent;

  return (
    <Link to={to} className="no-select h-full">
      <Card
        style={tone.style}
        className={cn(
          "group h-full gap-0 overflow-hidden border-grey-200 pt-0 transition-colors duration-200 hover:bg-grey-50",
          tone.hoverBorder,
        )}
      >
        <div className={cn("h-1.5 w-full", tone.rail)} />

        <div className="flex items-start gap-4 p-5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-grey-100">
            <Icon className={cn("size-5", tone.icon)} strokeWidth={1.8} />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block font-bold text-tertiary">{title}</span>
            {description && (
              <span className="mt-1 block text-sm leading-relaxed text-grey-800">
                {description}
              </span>
            )}
          </span>

          <ArrowRight
            className={cn(
              "mt-3 size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5",
              tone.icon,
            )}
          />
        </div>
      </Card>
    </Link>
  );
};

export default ActionCard;
