import { MENU_PADDING } from "../../constants";
import type { DropdownItem } from "../../types";
import MenuItem from "./MenuItem";

type MenuListProps<TId = number, TLabel = string> = {
    items: DropdownItem<TId, TLabel>[]
    onSelect: (value: TId) => void
    emptyMessage?: string
}

const MenuList = <TId, TLabel>({ items, onSelect, emptyMessage }: MenuListProps<TId, TLabel>) => {
    return (
        <ul
            className="grid grid-cols-2 min-[480px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.75 list-none m-0 -mt-1.25"
            style={{ padding: MENU_PADDING }}
        >
            {items.length > 0
                ? items.map((item) => (
                    <MenuItem key={`${item.id}`} label={`${item.label}`} onSelect={() => onSelect(item.id)} />
                ))
                : (emptyMessage ?? "There are no items at the moment.")}
        </ul>
    )
}

export default MenuList
