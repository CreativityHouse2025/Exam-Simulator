import React from 'react'

interface FooterShellProps {
  open: boolean
  children: React.ReactNode
}

/** Footer shell with grid layout. Renders child nodes (arrows + optional timer). */
// `open` is accepted but unused — pre-existing (the original CSS rule never
// referenced it either). See docs/refactor/phase-1-report.md PRE-EXISTING DEFECTS FOUND.
const FooterShell: React.FC<FooterShellProps> = ({ children }) => (
  <div id="footer" className="w-full bg-grey-50 border-t border-grey-100 max-h-12.5 grid grid-cols-2 transition-all duration-300">
    {children}
  </div>
)

export default FooterShell
