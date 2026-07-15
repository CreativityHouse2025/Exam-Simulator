import { Link } from "react-router-dom"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import useSettings from "@/hooks/useSettings"

type BackButtonProps = {
  /** Destination route. */
  to: string
  /** Link label. */
  text: string
  className?: string
}

/** Ghost "back" navigation link with an RTL-aware arrow. Shared across the Tailwind pages. */
const BackButton = ({ to, text, className }: BackButtonProps) => {
  const { settings } = useSettings()
  const Icon = settings.language === "ar" ? ArrowRight : ArrowLeft

  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className={`-ms-2 mb-4 gap-1.5 text-grey-900 hover:text-tertiary ${className ?? ""}`}
    >
      <Link to={to}>
        <Icon className="size-4" />
        {text}
      </Link>
    </Button>
  )
}

export default BackButton
