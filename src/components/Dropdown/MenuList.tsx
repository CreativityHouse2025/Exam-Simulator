import styled from "styled-components";
import { MENU_PADDING } from "../../constants";
import type { DropdownItem } from "../../types";
import MenuItem from "./MenuItem";

const MenuListStyles = styled.ul`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.7rem;
  list-style: none;
  margin: 0;
  margin-top: -0.5rem;
  padding: ${MENU_PADDING};
`;

type MenuListProps<TId = number, TLabel = string> = {
    items: DropdownItem<TId, TLabel>[]
    onSelect: (value: TId) => void
    emptyMessage?: string
}

const MenuList = <TId, TLabel>({ items, onSelect, emptyMessage }: MenuListProps<TId, TLabel>) => {
    return (
        <MenuListStyles>
            {items.length > 0
                ? items.map((item) => (
                    <MenuItem key={`${item.id}`} label={`${item.label}`} onSelect={() => onSelect(item.id)} />
                ))
                : (emptyMessage ?? "There are no items at the moment.")}
        </MenuListStyles>
    )
}

export default MenuList