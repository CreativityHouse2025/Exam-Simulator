import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { DropdownItem, LangCode } from "../../types";
import Dropdown from "./Dropdown";
import { createTrackExamsQueryOptions } from "../../utils/queryOptions";
import useSettings from "../../hooks/useSettings";

type CategoryDropdownProps = {
  title: string
  trackId: string
  open: boolean
  setOpen: (open: boolean) => void
  onSelect: (value: DropdownItem['id']) => void
  buttonRef?: React.RefObject<HTMLButtonElement | null>
};

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({ buttonRef, open, setOpen, title, trackId, onSelect }) => {
  const { settings } = useSettings();
  const langCode: LangCode = settings.language;
  const { data } = useQuery({ ...createTrackExamsQueryOptions(trackId), enabled: trackId !== "" });

  // categories.json is gone — exams come from the track's own list now, filtered to the type
  // whose name contains "domain", the same distinction the old JSON split full/ vs domain/ files on.
  const domainTypeId = data?.types.find((type) => type.name.en.toLowerCase().includes("domain"))?.id;
  const categories: DropdownItem[] = (data?.exams ?? [])
    .filter((exam) => exam.typeId === domainTypeId)
    .map((exam) => ({ id: exam.id, label: exam.name[langCode] }));

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
