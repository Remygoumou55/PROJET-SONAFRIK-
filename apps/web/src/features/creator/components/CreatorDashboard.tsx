import type { CreatorDashboardData } from "@sonafrik/types";
import { CreatorDashboardView } from "./CreatorDashboardView";

interface CreatorDashboardProps {
  data: CreatorDashboardData;
  careerOsEnabled?: boolean;
}

export function CreatorDashboard({ data, careerOsEnabled = false }: CreatorDashboardProps) {
  return <CreatorDashboardView data={data} careerOsEnabled={careerOsEnabled} />;
}
