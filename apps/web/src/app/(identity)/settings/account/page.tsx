import type { Metadata } from "next";
import { AccountSettingsView } from "@/features/identity/components/AccountSettingsView";
import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";

export const metadata: Metadata = { title: "Mon compte — SONAFRIK" };

export default async function AccountSettingsPage() {
  const context = await requireIdentityContext();
  return <AccountSettingsView context={context} />;
}
