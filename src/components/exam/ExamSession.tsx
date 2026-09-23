import React from "react";
import { useExamSession } from "../../hooks/examSession/useExamSession";
import useMediaQuery from "../../hooks/useMediaQuery";
import Layout from "./Layout";
import DrawerShell from "./Drawer/DrawerShell";
import ExamMenu from "./ExamMenu";
import ExamMain from "./ExamMain";
import ExamFooter from "./ExamFooter";

/** The exam session tree — one config-driven shell for every exam type (full, domain, revision). */
const ExamSession: React.FC = () => {
  const { questions } = useExamSession();
  const isMobile = useMediaQuery("(max-width: 48rem)");
  const [open, setOpen] = React.useState(() => !isMobile);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pre-existing, unrelated to this change
    setOpen(!isMobile);
  }, [isMobile]);

  const toggleOpen = React.useCallback(() => setOpen((prev) => !prev), []);

  return (
    <Layout
      drawer={
        <DrawerShell
          open={open}
          toggleOpen={toggleOpen}
          menu={<ExamMenu open={open} />}
        />
      }
      content={<ExamMain open={open} />}
      footer={<ExamFooter open={open} questionCount={questions.length} />}
    />
  );
};

export default ExamSession;
