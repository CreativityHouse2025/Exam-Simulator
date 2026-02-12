import React from "react";
import type { DropdownItem, LangCode } from "../../types";
import Dropdown from "./Dropdown";
import rawFullExams from '../../data/exam-data/fullExams.json'
import useSettings from "../../hooks/useSettings";

type FullExamDropdownProps = {
  title: string
  open: boolean
  setOpen: (open: boolean) => void
  onSelect: (value: DropdownItem['id']) => void
  buttonRef?: React.RefObject<HTMLButtonElement | null>
};

const FullExamDropdown: React.FC<FullExamDropdownProps> = ({
  buttonRef,
  open,
  setOpen,
  title,
  onSelect
}) => {
  const { settings } = useSettings();
  const langCode: LangCode = settings.language;

  const randomExam: DropdownItem = {
    id: 0,
    label: "Random"
  }

  const exams: DropdownItem[] = [randomExam, ...rawFullExams.map(e => ({
    id: e.id,
    label: e['name'][langCode]
  }))]

  return (
    <Dropdown
      buttonRef={buttonRef}
      open={open}
      setOpen={setOpen}
      title={title}
      onSelect={onSelect}
      items={exams}
      emptyMessage="There are no exams at the moment."
    />
  );
};

export default FullExamDropdown;
