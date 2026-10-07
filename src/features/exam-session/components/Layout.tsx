import React from "react";

interface LayoutProps {
  drawer: React.ReactNode;
  content: React.ReactNode;
  footer: React.ReactNode;
}

/** Shell layout for the exam UI: drawer on the left, content in the middle, footer at the bottom. */
const Layout: React.FC<LayoutProps> = ({ drawer, content, footer }) => (
  <div className="flex flex-col flex-1 overflow-hidden">
    <div id="middle-container" className="flex flex-1 overflow-hidden">
      {drawer}
      {content}
    </div>
    {footer}
  </div>
);

export default Layout;
