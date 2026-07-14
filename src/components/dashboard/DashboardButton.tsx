import type { ComponentProps, ReactNode, Ref } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/components/ui/utils"

type DashboardButtonProps = {
  icon: ReactNode
  label: string
  variant?: "primary" | "secondary"
  ref?: Ref<HTMLButtonElement>
} & Omit<ComponentProps<typeof Button>, "variant">

/** Shared dashboard action button — icon + label, reused by both StudentDashboard and SupervisorDashboard. */
const DashboardButton = ({ icon, label, variant = "primary", className, ref, ...props }: DashboardButtonProps) => {
  return (
    <Button
      ref={ref}
      variant={variant === "primary" ? "default" : "secondary"}
      className={cn(
        "h-auto w-full gap-2 rounded-lg p-3 text-sm font-semibold whitespace-nowrap md:w-auto md:min-w-56 md:p-5 md:text-lg",
        // let the icons' own size prop win over the base [&_svg]:size-4 clamp
        "[&_svg:not([class*='size-'])]:size-auto",
        "duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-none",
        className
      )}
      {...props}
    >
      {icon}
      {label}
    </Button>
  )
}

export default DashboardButton
