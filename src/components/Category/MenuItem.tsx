import React from "react";
import styled from "styled-components";
import { Category } from "../../types"
import type { ThemedStyles } from "../../types";

type MenuItemProps = {
    label: string
    onSelect: () => void
}

const MenuItemStyles = styled.li<ThemedStyles>`
  padding: 0.9rem 1rem;
  font-size: calc(${({ theme }) => theme.fontSize} + 0.7rem);
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(0,0,0,0.06);
  }
`;

const MenuItem: React.FC<MenuItemProps> = ({ label, onSelect }) => {
    return (
        <MenuItemStyles onClick={onSelect}>
            {label}
        </MenuItemStyles>
    )
}

export default MenuItem;
