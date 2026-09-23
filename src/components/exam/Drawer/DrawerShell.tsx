import React from "react";
import Control from "./Control";
import { cn } from "../../ui/utils";

interface DrawerShellProps {
  open: boolean;
  toggleOpen: () => void;
  menu: React.ReactNode;
}

/** Drawer container with animated width — renders Control (toggle) and the menu content. */
const DrawerShell: React.FC<DrawerShellProps> = ({
  open,
  toggleOpen,
  menu,
}) => {
  return (
    <div
      id="drawer"
      className={cn(
        "h-auto overflow-hidden overflow-y-auto bg-grey-50 transition-all duration-300",
        open ? "w-75" : "w-12.5",
      )}
    >
      <Control open={open} toggleOpen={toggleOpen} />
      {menu}
    </div>
  );
};

export default DrawerShell;
