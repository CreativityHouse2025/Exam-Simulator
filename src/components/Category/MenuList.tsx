import React from "react";
import styled from "styled-components";
import { MENU_PADDING } from "../../constants";
import { Category } from "../../types";
import MenuItem from "./MenuItem";

const MenuListStyles = styled.ul`
  list-style: none;
  margin: 0;
  margin-top: -1rem;
  padding: ${MENU_PADDING};
`;

type MenuListProps = {
    categories: Category[]
    onSelect: (value: Category['id']) => void
}

const MenuList: React.FC<MenuListProps> = ({ categories, onSelect }) => {
    return (
        <MenuListStyles>
            {
                categories.length > 0 ? categories.map((c) => (
                    <MenuItem key={c.id} label={`${c.id + ". " + c.label}`} onSelect={() => onSelect(c.id)}/>
                )) : "There are no categories at the moment."
            }
        </MenuListStyles>
    )
}

export default MenuList