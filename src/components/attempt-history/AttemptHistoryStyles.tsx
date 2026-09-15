import React from "react"
import { cn } from "../ui/utils"

// Shared row/cell components used by both AttemptHistoryRow and AttemptHistorySkeleton so the
// skeleton matches the real row's layout exactly without duplicating styles. See the
// `.attempt-tr`/`.attempt-td` plain CSS in index.css for why these stay plain CSS rather than
// Tailwind utilities.

interface TrProps extends React.ComponentProps<"tr"> {
  index: number
}

export const Tr: React.FC<TrProps> = ({ index, className, style, ...rest }) => (
  <tr
    className={cn("attempt-tr", className)}
    style={{ animationDelay: `${index * 0.06}s`, ...style }}
    {...rest}
  />
)

export const Td: React.FC<React.ComponentProps<"td">> = ({ className, ...rest }) => (
  <td className={cn("attempt-td", className)} {...rest} />
)
