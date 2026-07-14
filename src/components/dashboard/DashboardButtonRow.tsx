import type { ReactNode } from "react"

type DashboardButtonRowProps = {
  children: ReactNode
}

/** Shared dashboard button row — stacks its buttons on mobile, lays them side by side from md up. */
const DashboardButtonRow = ({ children }: DashboardButtonRowProps) => {
  return (
    <div className="flex flex-col items-stretch gap-1.5 md:flex-row md:items-center md:gap-2.5">{children}</div>
  )
}

export default DashboardButtonRow
