import { redirect } from "next/navigation";
import { getAdminServiceForSession } from "./getAdminService";

/** Redirige vers /admin si le flag post-MVP est désactivé. */
export async function requireAdminFeatureFlag(flagName: string, redirectTo = "/admin"): Promise<void> {
  const admin = await getAdminServiceForSession();
  const enabled = await admin.isFeatureEnabled(flagName);
  if (!enabled) redirect(redirectTo);
}
