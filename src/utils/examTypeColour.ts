// Tailwind cannot build class names at runtime, so every supported colour key is spelled out here.
const ACCENTS = {
  primary: {
    rail: "bg-primary",
    chip: "bg-primary text-white",
    icon: "text-primary",
    button: "bg-primary text-white hover:bg-primary/90",
    hoverBorder: "hover:border-primary",
  },
  secondary: {
    rail: "bg-secondary",
    chip: "bg-secondary text-white",
    icon: "text-secondary",
    button: "bg-secondary text-white hover:bg-secondary-hover",
    hoverBorder: "hover:border-secondary",
  },
  tertiary: {
    rail: "bg-tertiary",
    chip: "bg-tertiary text-white",
    icon: "text-tertiary",
    button: "bg-tertiary text-white hover:bg-tertiary/90",
    hoverBorder: "hover:border-tertiary",
  },
} as const;

const NEUTRAL = {
  rail: "bg-grey-300",
  chip: "bg-grey-200 text-grey-950",
  icon: "text-grey-800",
  button: "bg-grey-950 text-white hover:bg-grey-1000",
  hoverBorder: "hover:border-grey-500",
} as const;

export type ExamTypeAccent =
  | (typeof ACCENTS)[keyof typeof ACCENTS]
  | typeof NEUTRAL;

/** Maps exam_type.colour to accent classes; an unknown or null key falls back to neutral. */
export function examTypeAccent(colour: string | null): ExamTypeAccent {
  if (colour && colour in ACCENTS)
    return ACCENTS[colour as keyof typeof ACCENTS];
  return NEUTRAL;
}
