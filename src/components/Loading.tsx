import React from 'react'
import { Repeat } from 'lucide-react'

const LoadingComponent: React.FC<LoadingProps> = ({ size }) => (
  <div
    id="loading"
    className="w-screen h-screen flex flex-col justify-center items-center bg-grey-50 text-secondary"
  >
    <Repeat size={size} className="animate-rotate" />
  </div>
)

export default LoadingComponent

export interface LoadingProps {
  size: number
}
