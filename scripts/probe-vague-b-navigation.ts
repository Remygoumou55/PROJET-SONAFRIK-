/**
 * Vague B — Navigation + Rendering (audit 360° juillet 2026)
 * Usage: pnpm probe:vague-b-navigation
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const WEB_SRC = resolve(ROOT, "apps/web/src");

type Check = { name: string; ok: boolean; detail: string };
const checks: Check[] = [];

function log(name: string, ok: boolean, detail: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name} — ${detail}`);
}

function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

function countFiles(dir: string, name: string): number {
  let count = 0;
  if (!existsSync(dir)) return 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) count += countFiles(p, name);
    else if (entry.name === name) count += 1;
  }
  return count;
}

function countRouterRefresh(): number {
  let total = 0;
  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (/\.(tsx|ts)$/.test(entry.name)) {
        const raw = readFileSync(p, "utf8");
        const code = raw
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/\/\/.*$/gm, "");
        const matches = code.match(/router\.refresh\(\)/g) ?? [];
        total += matches.length;
      }
    }
  }
  walk(WEB_SRC);
  return total;
}

function main() {
  console.log("=== Vague B — Navigation + Rendering ===\n");

  const refreshCount = countRouterRefresh();
  log("B-NAV1 zero router.refresh()", refreshCount === 0, `${refreshCount} appels restants`);

  const loadingCount = countFiles(resolve(WEB_SRC, "app"), "loading.tsx");
  log("B-NAV2 loading.tsx coverage", loadingCount >= 49, `${loadingCount} segments (cible ≥49)`);

  const middleware = read("apps/web/src/middleware.ts");
  log(
    "B-NAV3 CSP nonce middleware",
    middleware.includes("x-nonce") && middleware.includes("next-router-prefetch"),
    "request headers + prefetch exclusion",
  );

  const rootLayout = read("apps/web/src/app/layout.tsx");
  log(
    "B-NAV4 root layout nonce",
    rootLayout.includes("connection()") && rootLayout.includes("x-nonce"),
    "connection + headers",
  );

  for (const [label, rel] of [
    ["listener", "apps/web/src/app/(listener)/layout.tsx"],
    ["creator", "apps/web/src/app/(creator)/layout.tsx"],
    ["admin", "apps/web/src/app/(admin)/layout.tsx"],
    ["wallet", "apps/web/src/app/(wallet)/layout.tsx"],
    ["identity", "apps/web/src/app/(identity)/layout.tsx"],
  ] as const) {
    const src = read(rel);
    log(`B-NAV5 RealtimeShell ${label}`, src.includes("RealtimeShell"), rel);
  }

  log(
    "B-NAV6 SkeletonRow partagé",
    existsSync(resolve(WEB_SRC, "components/ui/SkeletonRow.tsx")),
    "components/ui/SkeletonRow.tsx",
  );

  log(
    "B-NAV7 NotificationsLiveList unifié",
    read("apps/web/src/app/(listener)/notifications/page.tsx").includes("NotificationsLiveList") &&
      read("apps/web/src/app/(identity)/settings/notifications/page.tsx").includes("NotificationsLiveList"),
    "settings + /notifications",
  );

  const streamStart = read("supabase/functions/stream-start/index.ts");
  log(
    "B-NAV8 signed URL TTL ≤ 900s",
    streamStart.includes("SIGNED_URL_EXPIRY = 900"),
    "stream-start edge function",
  );

  const passed = checks.filter((c) => c.ok).length;
  console.log(`\n${passed}/${checks.length} checks Vague B Navigation`);
  process.exitCode = passed === checks.length ? 0 : 1;
}

main();
