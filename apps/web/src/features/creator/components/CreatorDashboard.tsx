import type { CreatorDashboardData } from "@sonafrik/types";
import { CreatorDashboardView } from "./CreatorDashboardView";

interface CreatorDashboardProps {
  data: CreatorDashboardData;
  careerOsEnabled?: boolean;
  greeting: string;
}

export function CreatorDashboard({ data, careerOsEnabled = false, greeting }: CreatorDashboardProps) {
  return <CreatorDashboardView data={data} careerOsEnabled={careerOsEnabled} greeting={greeting} />;
}
