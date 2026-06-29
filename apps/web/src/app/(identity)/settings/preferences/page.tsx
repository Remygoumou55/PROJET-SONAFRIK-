import { PreferencesForm } from "@/features/identity/components/PreferencesForm";
import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";

export default async function PreferencesPage() {
  const context = await requireIdentityContext();
  return <PreferencesForm preferences={context.preferences} userId={context.profile.id} />;
}
