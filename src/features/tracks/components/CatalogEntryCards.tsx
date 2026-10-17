import React from "react";
import { ClipboardList, LayoutGrid } from "lucide-react";
import ActionCard from "@/components/ActionCard";
import { TRACK_GRID_CLASSES } from "./TrackLinkCard";
import { translate } from "@/core/utils/translation";

type CatalogEntryCardsProps = {
  fullExamsTo: string;
  categoriesTo: string;
};

/** A track's two ways in: its full exams, or its categories. Static — fetches nothing. */
const CatalogEntryCards: React.FC<CatalogEntryCardsProps> = ({
  fullExamsTo,
  categoriesTo,
}) => (
  <div className={TRACK_GRID_CLASSES}>
    <ActionCard
      icon={ClipboardList}
      title={translate("catalog.full.title")}
      description={translate("catalog.full.description")}
      to={fullExamsTo}
      accent="primary"
    />
    <ActionCard
      icon={LayoutGrid}
      title={translate("catalog.categories.title")}
      description={translate("catalog.categories.description")}
      to={categoriesTo}
      accent="secondary"
    />
  </div>
);

export default CatalogEntryCards;
