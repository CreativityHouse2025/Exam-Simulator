import React from "react";
import type { DropdownItem, LangCode } from "../../types";
import Dropdown from "./Dropdown";
import rawCategories from '../../data/exam-data/categories.json'
import useSettings from "../../hooks/useSettings";

type CategoryDropdownProps = {
  title: string
  open: boolean
  setOpen: (open: boolean) => void
  onSelect: (value: DropdownItem['id']) => void
  buttonRef?: React.RefObject<HTMLButtonElement | null>
};
const CategoryDropdown: React.FC<CategoryDropdownProps> = ({ buttonRef, open, setOpen, title, onSelect }) => {
  const { settings } = useSettings();
  const langCode: LangCode = settings.language;

  const categories: DropdownItem[] = rawCategories.map(c => ({
    id: c.id,
    label: c['name'][langCode]
  }))

  return (
    <Dropdown
      buttonRef={buttonRef}
      open={open}
      setOpen={setOpen}
      title={title}
      onSelect={onSelect}
      items={categories}
      emptyMessage="There are no categories at the moment."
    />
  );
};

export default CategoryDropdown;
