/**
 * Vague C — Architecture + dette silos (audit 360° juillet 2026)
 * Usage: pnpm probe:vague-c-cleanup
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const WEB_FEATURES = resolve(ROOT, "apps/web/src/features");
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

function countLines(rel: string): number {
  return read(rel).split("\n").length;
}

function walkTsFiles(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walkTsFiles(p, acc);
    else if (/\.(tsx|ts)$/.test(entry.name)) acc.push(p);
  }
  return acc;
}

function countUseRealtimeChannelOutsideHook(): string[] {
  const violations: string[] = [];
  const hookPath = resolve(WEB_SRC, "hooks/useRealtimeChannel.ts").replace(/\\/g, "/");
  for (const abs of walkTsFiles(WEB_SRC)) {
    const norm = abs.replace(/\\/g, "/");
    if (norm === hookPath) continue;
    const raw = readFileSync(abs, "utf8");
    const code = raw
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    if (code.includes("useRealtimeChannel")) {
      violations.push(norm.replace(ROOT.replace(/\\/g, "/") + "/", ""));
    }
  }
  return violations;
}

function main() {
  console.log("=== Vague C — Architecture + dette silos ===\n");

  const wizardLines = countLines("apps/web/src/features/creator/catalog/components/PublicationWizard.tsx");
  log(
    "C-ARCH1 PublicationWizard decoupage",
    wizardLines <= 450,
    `${wizardLines} lignes (cible ≤450, objectif ≤400)`,
  );

  for (const [label, rel] of [
    ["WizardProgress", "apps/web/src/features/creator/catalog/components/WizardProgress.tsx"],
    ["WizardStep1Panel", "apps/web/src/features/creator/catalog/components/WizardStep1Panel.tsx"],
    ["WizardStep2Panel", "apps/web/src/features/creator/catalog/components/WizardStep2Panel.tsx"],
    ["WizardStep3Panel", "apps/web/src/features/creator/catalog/components/WizardStep3Panel.tsx"],
    ["WizardStep4Panel", "apps/web/src/features/creator/catalog/components/WizardStep4Panel.tsx"],
    ["WizardPublishedSuccess", "apps/web/src/features/creator/catalog/components/WizardPublishedSuccess.tsx"],
  ] as const) {
    log(`C-ARCH1 module ${label}`, existsSync(resolve(ROOT, rel)), rel.split("/").pop() ?? rel);
  }

  log(
    "C-ARCH5 useLibrary shim supprimé",
    !existsSync(resolve(ROOT, "apps/web/src/features/listener/hooks/useLibrary.ts")),
    "pas de shim deprecated listener",
  );

  const streamingSchemas = read("packages/api/src/streaming/schemas.ts");
  log(
    "C-ARCH4 toggleFavoriteSchema unique",
    streamingSchemas.includes('export { toggleFavoriteSchema } from "../social/schemas"'),
    "réexport social (pas de doublon)",
  );

  const adminLayout = read("apps/web/src/app/(admin)/layout.tsx");
  const adminSidebar = read("apps/web/src/features/admin/components/AdminSidebar.tsx");
  log(
    "C-ARCH6 admin nav filtrée par flags",
    adminLayout.includes("navFeatureFlags") &&
      adminLayout.includes("beat_store_admin") &&
      adminSidebar.includes("buildAdminNavSections(featureFlags)"),
    "layout → shell → sidebar",
  );

  const beatsPage = read("apps/web/src/app/(listener)/listen/beats/page.tsx");
  const awardsPage = read("apps/web/src/app/(admin)/admin/awards/page.tsx");
  log(
    "C-ARCH6 routes post-MVP gated",
    beatsPage.includes('isFeatureEnabled("beat_store")') &&
      (awardsPage.includes("awards_admin") || awardsPage.includes("ComingSoon")),
    "beats listener + awards admin",
  );

  const rtViolations = countUseRealtimeChannelOutsideHook();
  log(
    "C-ARCH10 zero useRealtimeChannel legacy",
    rtViolations.length === 0,
    rtViolations.length ? rtViolations.join(", ") : "features migrées SRTSP/LDSE/poll",
  );

  const notifCount = read("apps/web/src/features/shared/ldse/notifications/useNotificationsLdseCount.ts");
  const notifCode = notifCount
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  log(
    "C-ARCH10 notifications LDSE hub",
    notifCode.includes("useEventSubscription") && !notifCode.includes("useRealtimeChannel("),
    "SRTSP hub + LDSE event bus",
  );

  const globalsCss = read("apps/web/src/app/globals.css");
  log(
    "C-ARCH8 CSS post-MVP dormants",
    !globalsCss.includes('@import "./styles/listen-future.css"') &&
      !globalsCss.includes('@import "./styles/identity-post-mvp-bundle.css"'),
    "commentaires OK, pas d'import actif",
  );

  log(
    "C-ARCH12 tables orphelines doc",
    existsSync(resolve(ROOT, "docs/VAGUE_C_ORPHAN_TABLES.md")),
    "VAGUE_C_ORPHAN_TABLES.md",
  );

  const catalogServiceLines = countLines("packages/api/src/catalog/catalog.service.ts");
  const catalogRepoLines = countLines("packages/api/src/catalog/catalog.repository.ts");
  log(
    "C-ARCH2 catalog.service taille (Vague H)",
    catalogServiceLines <= 750,
    `${catalogServiceLines} lignes — découpage planifié Vague H`,
  );
  log(
    "C-ARCH2 catalog.repository taille (Vague H)",
    catalogRepoLines <= 700,
    `${catalogRepoLines} lignes — découpage planifié Vague H`,
  );

  const adminCssLines = countLines("apps/web/src/app/styles/admin.css");
  log(
    "C-ARCH7 admin.css taille (Vague H)",
    adminCssLines <= 1600,
    `${adminCssLines} lignes — découpage planifié Vague H1`,
  );

  const passed = checks.filter((c) => c.ok).length;
  console.log(`\n${passed}/${checks.length} checks Vague C Architecture`);
  process.exitCode = passed === checks.length ? 0 : 1;
}

main();
