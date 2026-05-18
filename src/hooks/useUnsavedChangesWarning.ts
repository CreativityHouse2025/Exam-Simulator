import React from 'react'

/**
 * Triggers the browser's native "unsaved changes" confirmation dialog when the
 * user attempts to close or refresh the tab while `hasUnsavedChanges` is true.
 * Modern browsers ignore custom returnValue text and display a generic message.
 */
export default function useUnsavedChangesWarning(hasUnsavedChanges: boolean) {
  React.useEffect(() => {
    if (!hasUnsavedChanges) return

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsavedChanges])
}
