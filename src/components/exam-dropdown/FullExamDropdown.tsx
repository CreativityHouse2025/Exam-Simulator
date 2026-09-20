import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { DropdownItem, LangCode } from "../../types";
import Dropdown from "./Dropdown";
import { createTrackExamsQueryOptions } from "../../utils/queryOptions";
import useSettings from "../../hooks/useSettings";

type FullExamDropdownProps = {
  title: string
  trackId: string
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
  trackId,
  onSelect
}) => {
  const { settings } = useSettings();
  const langCode: LangCode = settings.language;
  const { data } = useQuery({ ...createTrackExamsQueryOptions(trackId), enabled: trackId !== "" });

  // full-exams.json is gone — exams come from the track's own list now, filtered to the type
  // whose name contains "full", the same distinction the old JSON split full/ vs domain/ files on.
  const fullTypeId = data?.types.find((type) => type.name.en.toLowerCase().includes("full"))?.id;
  const exams: DropdownItem[] = (data?.exams ?? [])
    .filter((exam) => exam.typeId === fullTypeId)
    .map((exam) => ({ id: exam.id, label: exam.name[langCode] }));

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
