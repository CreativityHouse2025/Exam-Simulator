import React from 'react'
import { translate } from '../../../utils/translation'

const SummaryRowComponent: React.FC<SummaryRowProps> = ({ type, value, status, isStatus }) => {
  const typeLabel = translate(`content.summary.${type}`)
  const statusColor = isStatus ? (status === false ? "text-destructive" : "text-correct") : "text-black"

  return (
    <div data-test={`summary-row-${type}`} className="grid grid-cols-2 gap-x-12.5 justify-items-center items-start">
      <div className="text-xl text-center font-bold text-grey-950">{typeLabel}</div>
      <div className={`text-xl text-center font-bold ${statusColor}`}>
        {value}
      </div>
    </div>
  )
}

export default SummaryRowComponent

export interface SummaryRowProps {
  type: string
  value: string
  status?: boolean
  isStatus?: boolean
}
