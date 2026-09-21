import type { QuestionFilter } from "../../types";

import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ListOrdered,
  Bookmark,
  Square,
  SquareCheck,
  CheckCheck,
  XCircle,
  ClipboardCheck,
  FileCheckCorner,
  LogOut,
} from "lucide-react";
import MenuItem from "./Drawer/MenuItem";
import Legends from "./Drawer/Legends";
import Grid from "./Drawer/Grid";
import SubmitConfirmModal from "./Drawer/SubmitConfirmModal";
import PauseMenuItem from "./PauseMenuItem";
import { translate } from "../../utils/translation";
import { useExamSession } from "../../hooks/examSession/useExamSession";
import useAuth from "../../hooks/useAuth";
import { roleOf } from "../../config/roles";
import { ROUTES } from "../../config/routes";

interface ExamMenuProps {
  open: boolean;
}

const ExamMenu: React.FC<ExamMenuProps> = ({ open }) => {
  const {
    examState,
    canPause,
    submitExam,
    saveProgress,
    persists,
    examDetails,
  } = useExamSession();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const [isLeaving, setIsLeaving] = React.useState(false);
  const [filter, setFilter] = React.useState<QuestionFilter>("all");
  const [showSubmitConfirm, setShowSubmitConfirm] = React.useState(false);

  const backToSummary = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("view", "summary");
        return next;
      },
      { replace: true },
    );
  };

  /** Flushes unsaved answers before leaving; a session that never persists has nothing to write. */
  const saveAndLeave = async () => {
    if (isLeaving) return;
    setIsLeaving(true);

    // saveProgress reports failure rather than throwing — stay put rather than navigate away
    // from answers that were never written.
    if (persists && !(await saveProgress())) {
      setIsLeaving(false);
      return;
    }

    // A supervisor only ever reaches an exam through a preview, and /tracks/:id is student-only —
    // sending them there would bounce off RouteGuard straight to the dashboard.
    navigate(
      roleOf(user) === "supervisor"
        ? ROUTES.examLibrary.to(examDetails.trackId)
        : ROUTES.track.to(examDetails.trackId),
    );
  };

  const inProgressFilters: { filter: QuestionFilter; icon: React.ReactNode }[] =
    [
      { filter: "all", icon: <ListOrdered size={20} /> },
      { filter: "marked", icon: <Bookmark size={20} /> },
      { filter: "incomplete", icon: <Square size={20} /> },
      { filter: "complete", icon: <SquareCheck size={20} /> },
    ];

  const completedFilters: { filter: QuestionFilter; icon: React.ReactNode }[] =
    [
      { filter: "all", icon: <ListOrdered size={20} /> },
      { filter: "marked", icon: <Bookmark size={20} /> },
      { filter: "incomplete", icon: <Square size={20} /> },
      { filter: "incorrect", icon: <XCircle size={20} /> },
      { filter: "correct", icon: <CheckCheck size={20} /> },
    ];

  const currentFilters =
    examState === "in-progress" ? inProgressFilters : completedFilters;

  return (
    <div className="flex-1 flex flex-col border-r border-grey-100">
      {currentFilters.map(({ filter: f, icon }) => (
        <MenuItem
          key={f}
          icon={icon}
          label={translate(`nav.drawer.${f}`)}
          selected={filter === f}
          onClick={() => setFilter(f)}
        />
      ))}

      {open && (
        <>
          <Legends />
          <Grid filter={filter} />
        </>
      )}

      {examState === "in-progress" && (
        <>
          {canPause && <PauseMenuItem />}
          <MenuItem
            icon={<LogOut size={20} />}
            label={translate(
              `nav.drawer.${persists ? "save-and-leave" : "leave"}`,
            )}
            onClick={saveAndLeave}
          />
          <MenuItem
            icon={<ClipboardCheck size={20} />}
            label={translate("nav.drawer.stop")}
            onClick={() => setShowSubmitConfirm(true)}
          />
        </>
      )}

      {examState === "completed" && (
        <MenuItem
          icon={<FileCheckCorner size={20} />}
          label={translate("nav.drawer.summary")}
          onClick={backToSummary}
        />
      )}

      {showSubmitConfirm && (
        <SubmitConfirmModal
          onConfirm={() => {
            setShowSubmitConfirm(false);
            submitExam();
          }}
          onClose={() => setShowSubmitConfirm(false)}
        />
      )}
    </div>
  );
};

export default ExamMenu;
