import type { GridTagTypes } from "../../../types";

import React from "react";
import { translate } from "../../../utils/translation";

// The pre-migration CSS also had a `.bookmarked` selector alongside `.marked`, but
// `type` is typed as GridTagTypes, which has no "bookmarked" member — that rule was unreachable
// dead code even before this migration. Not ported; see PRE-EXISTING DEFECTS FOUND.
const SWATCH_COLOR: Record<GridTagTypes, string> = {
  complete: "bg-primary-light",
  correct: "bg-primary-light",
  marked: "bg-quatro",
  incorrect: "bg-secondary-light",
  incomplete: "bg-grey-200",
};

const LegendComponent: React.FC<LegendItemProps> = ({ type }) => {
  const legendName = translate(`nav.grid.${type}`);

  return (
    <div className="no-select flex items-center mr-2.5">
      <div
        className={`w-2.5 h-2.5 mr-0.75 ml-0.75 border border-grey-200 ${SWATCH_COLOR[type]}`}
      />
      <div className="text-xs font-semibold">{legendName}</div>
    </div>
  );
};

export default LegendComponent;

export interface LegendItemProps {
  type: GridTagTypes;
}
