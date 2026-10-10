import React from "react";
import { Lock } from "lucide-react";
import EmptyState from "@/components/states/EmptyState";
import BackButton from "@/components/BackButton";
import { translate } from "@/core/utils/translation";

type TrackLockedStateProps = {
  backTo: string;
  backText: string;
};

/** Full-page state for a track the viewer holds no active enrollment in. */
const TrackLockedState: React.FC<TrackLockedStateProps> = ({
  backTo,
  backText,
}) => (
  <div className="mx-auto w-full max-w-4xl px-4 py-8">
    <BackButton to={backTo} text={backText} />
    <EmptyState
      icon={Lock}
      message={translate("tracks.locked")}
      hint={translate("tracks.locked-hint")}
      className="mt-6"
    />
  </div>
);

export default TrackLockedState;
