import type React from "react";

// Every class reads the colour from --tag-accent, which `style` sets on the card root.
const ACCENT = {
  rail: "bg-(--tag-accent)",
  chip: "bg-(--tag-accent) text-white",
  icon: "text-(--tag-accent)",
  button: "bg-(--tag-accent) text-white hover:bg-(--tag-accent)/90",
  hoverBorder: "hover:border-(--tag-accent)",
} as const;

const NEUTRAL = {
  rail: "bg-grey-300",
  chip: "bg-grey-200 text-grey-950",
  icon: "text-grey-800",
  button: "bg-grey-950 text-white hover:bg-grey-1000",
  hoverBorder: "hover:border-grey-500",
} as const;

export type TagAccent = (typeof ACCENT | typeof NEUTRAL) & {
  style: React.CSSProperties | undefined;
};

/** Accent classes for a tag's hex colour; a null colour falls back to neutral. */
export function tagAccent(colorHexCode: string | null): TagAccent {
  if (colorHexCode === null) return { ...NEUTRAL, style: undefined };
  return {
    ...ACCENT,
    style: { "--tag-accent": colorHexCode } as React.CSSProperties,
  };
}
