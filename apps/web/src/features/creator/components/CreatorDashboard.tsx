import type { CreatorDashboardData } from "@sonafrik/types";
import { CreatorDashboardView } from "./CreatorDashboardView";

export function CreatorDashboard({ data }: { data: CreatorDashboardData }) {
  return <CreatorDashboardView data={data} />;
}
