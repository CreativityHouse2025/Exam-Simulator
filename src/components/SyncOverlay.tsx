import React from 'react'
import { translate } from '../utils/translation'
import { cn } from './ui/utils'

/**
 * Full-screen overlay that blocks all interaction while a sync is in flight.
 * Always mounted while a session is active so the opacity transition plays
 * smoothly in both directions — no flash on first render.
 */
const SyncOverlay: React.FC<SyncOverlayProps> = ({ visible }) => {
  return (
    <div
      className={cn(
        "fixed inset-0 z-20 bg-black/55 flex flex-col items-center justify-center gap-4",
        visible ? "opacity-100 pointer-events-auto transition-opacity duration-100 ease-in" : "opacity-0 pointer-events-none transition-none",
      )}
    >
      <span className="block w-13.75 h-13.75 border-4 border-white/25 border-t-white rounded-full animate-spin-fast" />
      <span className="text-white font-sans text-lg font-semibold tracking-wide">{translate('content.syncing')}</span>
    </div>
  )
}

export default SyncOverlay

interface SyncOverlayProps {
  visible: boolean
}
