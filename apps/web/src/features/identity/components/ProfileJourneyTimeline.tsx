import type { JourneyProgressViewModel } from "../lib/profileJourney";
import { ProfileJourneyStepItem } from "./ProfileJourneyStepItem";

interface ProfileJourneyTimelineProps {
  journey: JourneyProgressViewModel;
}

export function ProfileJourneyTimeline({ journey }: ProfileJourneyTimelineProps) {
  return (
    <div className="identity-journey-timeline">
      <h3 className="identity-journey-timeline__title">Vos étapes</h3>
      <ol className="identity-journey-timeline__list" aria-label="Étapes du parcours SONAFRIK">
        {journey.steps.map((step, index) => (
          <ProfileJourneyStepItem
            key={step.id}
            step={step}
            index={index}
            isLast={index === journey.steps.length - 1}
          />
        ))}
      </ol>
    </div>
  );
}
