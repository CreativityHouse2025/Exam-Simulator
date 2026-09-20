import React from 'react'
import { Circle, Square } from 'lucide-react'
import { cn } from '../ui/utils'

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number | string }

/** Filled radio-checked icon - lucide's doesn't provide checked radio */
const RadioChecked: React.FC<IconProps> = ({ size = 24, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...rest}>
    <path
      fillRule="evenodd"
      d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"
    />
  </svg>
)

/** Filled checkbox-checked icon - lucide's doesn't provide visually-clear checked square */
const SquareChecked: React.FC<IconProps> = ({ size = 24, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...rest}>
    <path
      fillRule="evenodd"
      d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
    />
  </svg>
)

const ChoiceComponent: React.FC<ChoiceProps> = ({
  singleAnswer,
  selected,
  review,
  correct,
  disabled,
  label,
  text,
  onClick
}) => {
  const iconComponents = React.useMemo(
    () => ({
      selected: singleAnswer ? RadioChecked : SquareChecked,
      unselected: singleAnswer ? Circle : Square
    }),
    [singleAnswer]
  )

  const IconComponent = selected ? iconComponents.selected : iconComponents.unselected

  // Base color applies whether or not this choice is selected; selectedColor overrides it for
  // the icon/label/text specifically when `selected` is true — mirrors the original's `.selected`
  // descendant-class override.
  const baseColor = review ? (correct ? "text-correct" : "text-grey-500") : "text-grey-950"
  const selectedColor = review ? (correct ? "text-correct" : "text-destructive") : "text-black"
  const colorClass = selected ? selectedColor : undefined

  return (
    <div
      className={cn(
        "choice-grid grid items-center mb-1.25 text-xl",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        baseColor,
        "no-select",
      )}
      onClick={disabled ? undefined : onClick}
    >
      <IconComponent className={cn("no-select mr-1.25", colorClass)} size={selected ? 22 : 20} />

      {/* margin to align with radio buttons (Open Sans issue) */}
      <div className={cn("-mt-0.5 justify-self-center font-semibold", colorClass)}>{label}</div>

      <div className={colorClass}>{text}</div>
    </div>
  )
}

export default ChoiceComponent

export interface ChoiceProps {
  singleAnswer: boolean
  selected: boolean
  review: boolean
  correct: boolean
  disabled: boolean
  label: string
  text: string
  onClick: React.MouseEventHandler<HTMLDivElement>
}
