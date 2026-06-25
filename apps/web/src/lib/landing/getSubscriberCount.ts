import { getLaunchProgress } from "./getLaunchProgress";

/** Compteur abonnés premium actifs — source unique RPC get_launch_progress. */
export async function getSubscriberCount(): Promise<number> {
  const progress = await getLaunchProgress();
  return progress.current;
}
