import { isDevBypassActive } from "@/lib/auth/guards";
import { ListenerOnboardingClient } from "./ListenerOnboardingClient";

export default function ListenerOnboardingPage() {
  const bypassAuth = isDevBypassActive();
  return <ListenerOnboardingClient bypassAuth={bypassAuth} />;
}
