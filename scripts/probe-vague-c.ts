/**
 * Certification Vague C++ — admin service layer, notifications, architecture.
 * Usage: npx tsx scripts/probe-vague-c.ts
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, join } from "path";
import { createClient } from "@supabase/supabase-js";

const ROOT = resolve(__dirname, "..");
const ADMIN_PAGES_DIR = resolve(ROOT, "apps/web/src/app/(admin)/admin");

type Check = { name: string; ok: boolean; detail: string };
const checks: Check[] = [];
const log = (name: string, ok: boolean, detail: string) => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name} — ${detail}`);
};

function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

function loadEnv() {
  const envPath = resolve(ROOT, "apps/web/.env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1]!.trim()] = m[2]!.trim().replace(/^["']|["']$/g, "");
  }
}

function listAdminPageFiles(): string[] {
  const files: string[] = [];
  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name === "page.tsx") files.push(p);
    }
  }
  if (existsSync(ADMIN_PAGES_DIR)) walk(ADMIN_PAGES_DIR);
  return files;
}

function staticChecks() {
  const adminRepo = read("packages/api/src/admin/admin.repository.ts");
  log(
    "C1 admin repository SSR",
    adminRepo.includes("listPendingCatalogItems") &&
      adminRepo.includes("getHealthSnapshot") &&
      !adminRepo.includes("as never"),
    "méthodes + sans as never",
  );

  const helper = read("apps/web/src/features/admin/lib/getAdminService.ts");
  log(
    "C2 getAdminService helpers",
    helper.includes("getAdminServiceForSession") &&
      helper.includes("getAdminServiceWithServiceRole") &&
      helper.includes("adminVerified: true"),
    "session vs service role",
  );

  const adminPages = listAdminPageFiles();
  const directFromViolations: string[] = [];
  for (const file of adminPages) {
    const src = readFileSync(file, "utf8");
    if (src.includes(".from(") || src.includes('supabase.rpc(')) {
      directFromViolations.push(file.replace(ROOT + "\\", "").replace(ROOT + "/", ""));
    }
  }
  log(
    "C3 admin pages sans Supabase direct",
    directFromViolations.length === 0,
    directFromViolations.length ? directFromViolations.join(", ") : `${adminPages.length} pages OK`,
  );

  for (const [label, rel, needle] of [
    ["catalog", "apps/web/src/app/(admin)/admin/catalog/page.tsx", "getAdminServiceForSession"],
    ["flags", "apps/web/src/app/(admin)/admin/flags/page.tsx", "getAdminServiceWithServiceRole"],
    ["settings", "apps/web/src/app/(admin)/admin/settings/page.tsx", "getAdminServiceWithServiceRole"],
    ["finance", "apps/web/src/app/(admin)/admin/finance/page.tsx", "createPayoutService"],
  ] as const) {
    log(`C4 ${label} page pattern`, read(rel).includes(needle), needle);
  }

  const actions = read("apps/web/src/features/admin/actions/admin.actions.ts");
  log(
    "C5 admin actions sécurisées",
    actions.includes("verifyAdminForAction()") && actions.includes("adminVerified: true"),
    "guard + service role",
  );

  for (const [label, rel] of [
    ["catalog", "apps/web/src/features/admin/components/AdminCatalogCenter.tsx"],
    ["rights", "apps/web/src/features/admin/components/AdminRightsCenter.tsx"],
    ["finance", "apps/web/src/features/admin/components/AdminFinanceCenter.tsx"],
    ["flags", "apps/web/src/features/admin/components/AdminFlagsCenter.tsx"],
  ] as const) {
    const src = read(rel);
    const usesHook =
      src.includes("useAdminService") ||
      src.includes("usePayoutService") ||
      src.includes("toggleFeatureFlagAction");
    log(`C6 ${label} center couche API`, usesHook, rel.split("/").pop());
  }

  log(
    "C7 NotificationList absent",
    !existsSync(resolve(ROOT, "apps/web/src/features/identity/components/NotificationList.tsx")),
    "pas de doublon identity",
  );

  const settingsNotif = read("apps/web/src/app/(identity)/settings/notifications/page.tsx");
  const streamNotif = read("apps/web/src/app/(listener)/notifications/page.tsx");
  log(
    "C8 notifications unifiées",
    settingsNotif.includes("NotificationsList") &&
      streamNotif.includes("NotificationsList") &&
      settingsNotif.includes("createNotificationsService"),
    "settings + /notifications",
  );

  const bell = read("apps/web/src/features/notifications/components/NotificationBell.tsx");
  log("C8 NotificationBell", bell.includes("useNotificationsService"), "hook dédié");

  const auth = read("packages/api/src/auth/auth.service.ts");
  log(
    "C9 auth service",
    auth.includes("signOutEverywhere") && auth.includes("signInWithGoogle"),
    "méthodes présentes",
  );

  log(
    "C10 régression A/B probes",
    existsSync(resolve(ROOT, "scripts/probe-vague-a.ts")) &&
      existsSync(resolve(ROOT, "scripts/probe-vague-b.ts")),
    "certifications précédentes",
  );
}

async function liveChecks() {
  loadEnv();
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!URL || !ANON) {
    log("live env", false, ".env.local manquant");
    return;
  }

  const client = createClient(URL, ANON, { auth: { persistSession: false } });
  await client.auth.signInWithPassword({
    email: "s13b-playwright-listener@sonafrik.test",
    password: "S13BCert2026!",
  });

  const { data: launch, error: launchErr } = await client.rpc("get_launch_progress");
  log(
    "C11 live get_launch_progress",
    !launchErr && launch !== null,
    launchErr?.message ?? `target=${(launch as { target?: number })?.target ?? "?"}`,
  );

  const { error: payoutErr } = await client.rpc("get_admin_payout_queue", {
    p_status: "pending",
    p_limit: 1,
  });
  log(
    "C11 live payout queue listener",
    !!payoutErr,
    payoutErr ? "refusé (non-admin attendu)" : "FAIL: accès non-admin",
  );
}

async function main() {
  console.log("=== Vague C++ — checks statiques ===\n");
  staticChecks();
  console.log("\n=== Vague C++ — checks live Supabase ===\n");
  await liveChecks();

  const passed = checks.filter((c) => c.ok).length;
  console.log(`\n${passed}/${checks.length} checks Vague C++`);
  process.exitCode = passed === checks.length ? 0 : 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
