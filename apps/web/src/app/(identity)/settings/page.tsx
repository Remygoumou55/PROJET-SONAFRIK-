import { SettingsOverview } from "@/features/identity/components/SettingsOverview";
import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";

export default async function SettingsPage() {
  const context = await requireIdentityContext();
  return <SettingsOverview context={context} />;
}
