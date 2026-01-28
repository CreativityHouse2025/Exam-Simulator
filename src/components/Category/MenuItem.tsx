import React from "react";
import styled from "styled-components";
import type { ThemedStyles } from "../../types";

type MenuItemProps = {
    label: string
    onSelect: () => void
}

const MenuItemStyles = styled.li<ThemedStyles>`
  box-sizing: border-box;
  padding: 1.5rem 1rem;
  font-size: calc(${({ theme }) => theme.fontSize} + 0.7rem);
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.grey[1]};
  box-shadow: none;
  transition: all 0.15s ease;
  background-color: ${({ theme }) => theme.grey[0]};
  &:hover {
    background: ${({ theme }) => theme.grey[1]};
    box-shadow: 0 3px 3px rgba(0, 0, 0, 0.1);
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
