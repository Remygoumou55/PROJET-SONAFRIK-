import { isDevBypassActive } from "@/lib/auth/guards";
import { ArtistOnboardingClient } from "./ArtistOnboardingClient";

export default function ArtistOnboardingPage() {
  const bypassAuth = isDevBypassActive();
  return <ArtistOnboardingClient bypassAuth={bypassAuth} />;
}
