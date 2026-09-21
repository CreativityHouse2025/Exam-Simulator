import React from "react";
import { cn } from "../../ui/utils";

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  selected?: boolean;
  onClick: () => void;
}

const MenuItemComponent: React.FC<MenuItemProps> = ({
  icon,
  label,
  selected = false,
  onClick,
}) => {
  return (
    <div
      className={cn(
        "no-select menu-item-grid h-12.5 grid items-center justify-items-center text-black cursor-pointer hover:bg-primary-light",
        selected ? "bg-grey-200" : "bg-transparent",
      )}
      onClick={onClick}
      data-test={label}
    >
      {icon}
      {/* Original CSS had invalid `justify-self: flex-start` (not a valid grid value) — silent
          no-op, so the label centered instead of start-aligning. Fixed here: `justify-self-start`. */}
      <div className="text-base font-semibold justify-self-start">{label}</div>
    </div>
  );
};

export default MenuItemComponent;
