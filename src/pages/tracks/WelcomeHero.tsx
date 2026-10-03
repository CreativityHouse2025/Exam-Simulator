import React from "react";
import { useNavigate } from "react-router-dom";
import { CirclePlay } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { translate } from "@/utils/translation";
import type { EnrolledTrack } from "@/apiTypes";
import type { LangCode } from "@/types";

type WelcomeHeroProps = {
  firstName: string;
  latestTrack: EnrolledTrack | null;
  langCode: LangCode;
};

/** Dashboard opener — names the student and offers one way straight back into their current track. */
const WelcomeHero: React.FC<WelcomeHeroProps> = ({
  firstName,
  latestTrack,
  langCode,
}) => {
  const navigate = useNavigate();

  return (
    <section className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <h1 className="text-2xl font-bold tracking-tight text-tertiary md:text-4xl">
        {translate("tracks.welcome", [firstName])}
      </h1>

      {latestTrack && (
        <Button
          onClick={() => navigate(ROUTES.track.to(latestTrack.id))}
          className="shrink-0 gap-2 rounded-full bg-primary px-5 py-5 text-sm font-semibold text-white hover:bg-primary/90"
        >
          <CirclePlay className="size-4" />
          {translate("tracks.continue", [latestTrack.name[langCode]])}
        </Button>
      )}
    </section>
  );
};

export default WelcomeHero;
