/**
 * Certification Vague F — Architecture & isolation domaines.
 * Usage: pnpm probe:vague-f
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, join } from "path";
import { execSync } from "child_process";

const ROOT = resolve(__dirname, "..");
const FEATURES = resolve(ROOT, "apps/web/src/features");
const APP = resolve(ROOT, "apps/web/src/app");
const LISTENER_PAGES = resolve(APP, "(listener)");

type Check = { name: string; ok: boolean; detail: string };
const checks: Check[] = [];
const log = (name: string, ok: boolean, detail: string) => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name} — ${detail}`);
};

function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

function lineCount(rel: string): number {
  return read(rel).split("\n").length;
}

function walkTs(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walkTs(p, acc);
    else if (/\.(ts|tsx)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

function listListenerPageFiles(): string[] {
  const files: string[] = [];
  function walk(dir: string) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name === "page.tsx") files.push(p);
    }
  }
  walk(LISTENER_PAGES);
  return files;
}

function grepWebImports(pattern: RegExp): number {
  const webSrc = resolve(ROOT, "apps/web/src");
  let n = 0;
  for (const f of walkTs(webSrc)) {
    if (pattern.test(readFileSync(f, "utf8"))) n++;
  }
  return n;
}

function runSubProbe(script: string): { ok: boolean; detail: string } {
  try {
    const out = execSync(`npx tsx scripts/${script}`, { cwd: ROOT, stdio: "pipe", encoding: "utf8" });
    const m = out.match(/(\d+)\/(\d+) checks/);
    if (m) return { ok: m[1] === m[2], detail: `${m[1]}/${m[2]}` };
    return { ok: true, detail: "OK" };
  } catch {
    return { ok: false, detail: "échec" };
  }
}

function main() {
  console.log("=== Vague F — Architecture & isolation domaines ===\n");

  // --- F4 structure ---
  log("F1 listener/ existe", existsSync(join(FEATURES, "listener")), "features/listener");
  log("F2 streaming/ supprimé", !existsSync(join(FEATURES, "streaming")), "plus de features/streaming");
  log("F3 creator/catalog/", existsSync(join(FEATURES, "creator/catalog")), "catalog sous creator");
  log("F4 creator/rights/", existsSync(join(FEATURES, "creator/rights")), "rights sous creator");
  log("F5 creator/analytics/", existsSync(join(FEATURES, "creator/analytics")), "analytics sous creator");
  log("F6 catalog/ racine supprimé", !existsSync(join(FEATURES, "catalog")), "plus de features/catalog");
  log("F7 route group (listener)", existsSync(join(APP, "(listener)")), "app/(listener)");
  log("F8 route group (streaming) supprimé", !existsSync(join(APP, "(streaming)")), "plus de app/(streaming)");

  log("F9 zero import @/features/streaming", grepWebImports(/@\/features\/streaming\//) === 0, `${grepWebImports(/@\/features\/streaming\//)} fichiers`);
  log("F10 zero import @/features/catalog", grepWebImports(/@\/features\/catalog\//) === 0, `${grepWebImports(/@\/features\/catalog\//)} fichiers`);
  log("F11 zero import @/features/rights", grepWebImports(/@\/features\/rights\//) === 0, `${grepWebImports(/@\/features\/rights\//)} fichiers`);
  log("F12 zero import @/features/analytics", grepWebImports(/@\/features\/analytics\//) === 0, `${grepWebImports(/@\/features\/analytics\//)} fichiers`);

  const eslint = read("apps/web/eslint.config.mjs");
  log("F13 ESLint boundaries", eslint.includes("no-restricted-imports") && eslint.includes("features/creator"), "no-restricted-imports configuré");
  log("F14 MVP_SCOPE_LOCK présent", existsSync(resolve(ROOT, "docs/MVP_SCOPE_LOCK.md")), "docs/MVP_SCOPE_LOCK.md");

  // --- F3 découpage fichiers ---
  const playerLines = lineCount("apps/web/src/features/listener/lib/playerContext.tsx");
  const searchLines = lineCount("apps/web/src/features/listener/components/SearchResults.tsx");
  const adminRepoLines = lineCount("packages/api/src/admin/admin.repository.ts");
  log("F15 playerContext < 400L", playerLines < 400, `${playerLines} lignes`);
  log("F16 SearchResults < 400L", searchLines < 400, `${searchLines} lignes`);
  log("F17 admin.repository facade < 150L", adminRepoLines < 150, `${adminRepoLines} lignes`);
  log(
    "F18 admin repo split",
    existsSync(resolve(ROOT, "packages/api/src/admin/admin.config.repository.ts")) &&
      existsSync(resolve(ROOT, "packages/api/src/admin/admin.moderation.repository.ts")) &&
      existsSync(resolve(ROOT, "packages/api/src/admin/admin.dashboard.repository.ts")),
    "config + moderation + dashboard",
  );
  log(
    "F19 playerQueueUtils extrait",
    existsSync(resolve(ROOT, "apps/web/src/features/listener/lib/playerQueueUtils.ts")),
    "listener/lib/playerQueueUtils.ts",
  );

  // --- F5 Global SCS ---
  const hexProbe = runSubProbe("probe-hex-colors.ts");
  log("F20 probe hex colors", hexProbe.ok, hexProbe.detail);

  // --- F6 dépendances croisées ---
  const listenerPages = listListenerPageFiles();
  const fromViolations = listenerPages
    .filter((file) => readFileSync(file, "utf8").includes(".from("))
    .map((f) => f.replace(ROOT + "\\", "").replace(ROOT + "/", ""));

  log(
    "F21 listener SSR sans .from() direct",
    fromViolations.length === 0,
    fromViolations.length ? fromViolations.join(", ") : `${listenerPages.length} pages OK`,
  );

  log(
    "F22 listener API module",
    existsSync(resolve(ROOT, "packages/api/src/listener/listener.service.ts")) &&
      read("packages/api/package.json").includes('"./listener"'),
    "packages/api/listener exporté",
  );

  const becomeBtn = read("apps/web/src/features/identity/components/BecomeArtistButton.tsx");
  log(
    "F23 identity→creator pont API",
    becomeBtn.includes("useIdentityService") &&
      !becomeBtn.includes("useCreatorService") &&
      read("packages/api/src/identity/identity.service.ts").includes("becomeArtist()"),
    "BecomeArtistButton → identity.becomeArtist()",
  );

  // --- F7 isolation complète ---
  console.log("\n=== Régression probes A–E ===\n");
  const regA = runSubProbe("probe-vague-a.ts");
  log("F24 régression vague A", regA.ok, regA.detail);

  log(
    "F25 identity n'importe pas creator hooks",
    grepWebImports(/features\/identity\/.*useCreatorService/) === 0 &&
      !read("apps/web/src/features/identity/components/BecomeArtistButton.tsx").includes("useCreatorService"),
    "pont identity uniquement",
  );

  log(
    "F26 listener pages utilisent listener service",
    listenerPages.filter((f) => readFileSync(f, "utf8").includes("createListenerService")).length >= 4,
    "≥4 pages SSR listener",
  );

  const passed = checks.filter((c) => c.ok).length;
  console.log(`\n${passed}/${checks.length} checks Vague F`);
  process.exitCode = passed === checks.length ? 0 : 1;
}

main();
