import type { CreatorDashboardData } from "@sonafrik/types";
import { CreatorDashboardView } from "./CreatorDashboardView";

interface CreatorDashboardProps {
  data: CreatorDashboardData;
  careerOsEnabled?: boolean;
  greeting: string;
  hideHero?: boolean;
}

export function CreatorDashboard({
  data,
  careerOsEnabled = false,
  greeting,
  hideHero = false,
}: CreatorDashboardProps) {
  return (
    <CreatorDashboardView
      data={data}
      careerOsEnabled={careerOsEnabled}
      greeting={greeting}
      hideHero={hideHero}
    />
  );
}
