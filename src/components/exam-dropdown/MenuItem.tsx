import React from "react";

type MenuItemProps = {
    label: string
    onSelect: () => void
}

const MenuItem: React.FC<MenuItemProps> = ({ label, onSelect }) => {
    return (
        <li
            onClick={onSelect}
            className="exam-dropdown-menu-item box-border py-3.75 px-2.5 text-lg font-medium rounded-md cursor-pointer border border-grey-100 shadow-none transition-all duration-150 bg-grey-50 hover:bg-grey-100"
        >
            {label}
        </li>
    )
}

export default MenuItem;
