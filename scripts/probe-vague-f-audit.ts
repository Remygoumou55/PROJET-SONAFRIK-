/**
 * Audit forensique Vague F — profondeur maximale.
 * Usage: pnpm probe:vague-f-audit
 *
 * Complète probe-vague-f.ts avec :
 * - vérifications disque (pas index git)
 * - SCS Tailwind palette
 * - code mort connu
 * - pages ComingSoon / gates
 * - état git de la migration F
 */
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { resolve, join, relative } from "path";
import { execSync } from "child_process";

const ROOT = resolve(__dirname, "..");
const WEB_SRC = resolve(ROOT, "apps/web/src");
const FEATURES = join(WEB_SRC, "features");
const APP = join(WEB_SRC, "app");

type Check = { name: string; ok: boolean; detail: string; severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" };
const checks: Check[] = [];

function log(name: string, ok: boolean, detail: string, severity: Check["severity"] = "HIGH") {
  checks.push({ name, ok, detail, severity });
  console.log(`${ok ? "✅" : "❌"} [${severity}] ${name} — ${detail}`);
}

function walkFiles(dir: string, extensions: RegExp, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(p, extensions, acc);
    else if (extensions.test(entry.name)) acc.push(p);
  }
  return acc;
}

function lineCount(abs: string): number {
  return readFileSync(abs, "utf8").split("\n").length;
}

function listPageFiles(): string[] {
  const files: string[] = [];
  function walk(dir: string) {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === "page.tsx") files.push(p);
    }
  }
  walk(APP);
  return files;
}

function gitDirtyCount(): number {
  try {
    const out = execSync("git status --short", { cwd: ROOT, encoding: "utf8" });
    return out.trim().split("\n").filter(Boolean).length;
  } catch {
    return -1;
  }
}

const TAILWIND_PALETTE =
  /\b(text|bg|border|ring|fill|stroke|from|to|via)-(red|green|blue|yellow|orange|purple|pink|gray|slate|zinc|neutral|stone|amber|lime|emerald|teal|cyan|sky|indigo|violet|fuchsia|rose)-[0-9]{2,3}\b/g;

function scanTailwindPaletteViolations(): { file: string; samples: string[] }[] {
  const violations: { file: string; samples: string[] }[] = [];
  for (const abs of walkFiles(WEB_SRC, /\.tsx$/)) {
    const rel = relative(ROOT, abs).replace(/\\/g, "/");
    if (rel.includes("/features/streaming/") || rel.includes("/app/(streaming)/")) continue;
    const matches = readFileSync(abs, "utf8").match(TAILWIND_PALETTE) ?? [];
    if (matches.length) {
      violations.push({ file: rel, samples: [...new Set(matches)].slice(0, 5) });
    }
  }
  return violations;
}

function main() {
  console.log("=== AUDIT FORENSIQUE VAGUE F — profondeur maximale ===\n");

  // ── Structure disque ──
  const legacyDirs = ["streaming", "catalog", "rights", "analytics"].map((d) => ({
    name: d,
    path: join(FEATURES, d),
    exists: existsSync(join(FEATURES, d)),
  }));
  const legacyOnDisk = legacyDirs.filter((d) => d.exists);
  log(
    "FA1 legacy features/ supprimés (disque)",
    legacyOnDisk.length === 0,
    legacyOnDisk.length ? legacyOnDisk.map((d) => d.name).join(", ") : "streaming/catalog/rights/analytics absents",
    "CRITICAL",
  );

  log(
    "FA2 app/(streaming) supprimé (disque)",
    !existsSync(join(APP, "(streaming)")),
    existsSync(join(APP, "(streaming)")) ? "dossier encore présent" : "absent",
    "CRITICAL",
  );

  log(
    "FA3 app/(listener) présent (disque)",
    existsSync(join(APP, "(listener)")),
    existsSync(join(APP, "(listener)")) ? "OK" : "manquant",
    "CRITICAL",
  );

  for (const [label, sub] of [
    ["listener", "listener"],
    ["creator/catalog", "creator/catalog"],
    ["creator/rights", "creator/rights"],
    ["creator/analytics", "creator/analytics"],
  ] as const) {
    log(
      `FA4 features/${label}`,
      existsSync(join(FEATURES, sub)),
      join(FEATURES, sub).replace(ROOT, "").replace(/\\/g, "/"),
      "CRITICAL",
    );
  }

  log(
    "FA5 packages/api/listener",
    existsSync(resolve(ROOT, "packages/api/src/listener/listener.service.ts")),
    "listener.service.ts",
    "CRITICAL",
  );

  // ── SSR & boundaries ──
  const listenerPages = listPageFiles().filter((f) => f.includes("(listener)"));
  const fromViolations = listenerPages
    .filter((f) => readFileSync(f, "utf8").includes(".from("))
    .map((f) => relative(ROOT, f).replace(/\\/g, "/"));
  log(
    "FA6 listener SSR sans .from()",
    fromViolations.length === 0,
    fromViolations.length ? fromViolations.join(", ") : `${listenerPages.length} pages`,
    "HIGH",
  );

  let crossImport = 0;
  for (const f of walkFiles(join(FEATURES, "listener"), /\.(ts|tsx)$/)) {
    if (readFileSync(f, "utf8").includes("@/features/creator")) crossImport++;
  }
  log("FA7 zero listener→creator imports", crossImport === 0, `${crossImport} violation(s)`, "HIGH");

  const becomeBtn = readFileSync(
    resolve(WEB_SRC, "features/identity/components/BecomeArtistButton.tsx"),
    "utf8",
  );
  log(
    "FA8 identity pont (pas useCreator)",
    becomeBtn.includes("useIdentityService") && !becomeBtn.includes("useCreatorService"),
    "BecomeArtistButton",
    "HIGH",
  );

  // ── SCS ──
  const twViolations = scanTailwindPaletteViolations();
  log(
    "FA9 zero Tailwind palette (red-500, etc.)",
    twViolations.length === 0,
    twViolations.length
      ? twViolations.map((v) => `${v.file} (${v.samples.join(", ")})`).join(" | ")
      : "0 violation",
    "MEDIUM",
  );

  try {
    const hexOut = execSync("npx tsx scripts/probe-hex-colors.ts", { cwd: ROOT, encoding: "utf8" });
    const hexOk = /(\d+)\/(\d+) checks Global SCS/.test(hexOut) && (() => {
      const m = hexOut.match(/(\d+)\/(\d+) checks Global SCS/);
      return m ? m[1] === m[2] : false;
    })();
    log("FA10 probe hex colors", hexOk, hexOk ? "3/3" : "échec", "MEDIUM");
  } catch {
    log("FA10 probe hex colors", false, "échec", "MEDIUM");
  }

  // ── Taille fichiers F3 ──
  const heavyFiles: string[] = [];
  for (const dir of [
    join(FEATURES, "listener"),
    join(FEATURES, "creator"),
    resolve(ROOT, "packages/api/src/listener"),
    resolve(ROOT, "packages/api/src/admin"),
  ]) {
    if (!existsSync(dir)) continue;
    for (const f of walkFiles(dir, /\.(ts|tsx)$/)) {
      if (lineCount(f) > 400) {
        heavyFiles.push(`${relative(ROOT, f).replace(/\\/g, "/")} (${lineCount(f)}L)`);
      }
    }
  }
  log("FA11 aucun fichier >400L (zones F)", heavyFiles.length === 0, heavyFiles.join(", ") || "OK", "LOW");

  // ── Code mort / pages placeholder ──
  const royaltiesPage = readFileSync(
    resolve(WEB_SRC, "app/(wallet)/wallet/royalties/page.tsx"),
    "utf8",
  );
  log(
    "FA12 RoyaltiesPage branchée",
    royaltiesPage.includes("RoyaltiesPage") && !royaltiesPage.includes("ComingSoon"),
    royaltiesPage.includes("ComingSoon") ? "encore ComingSoon" : "RoyaltiesPage active",
    "HIGH",
  );

  const comingSoonPages = listPageFiles().filter((f) => {
    const src = readFileSync(f, "utf8");
    return src.includes("ComingSoon") && !f.includes("(public)");
  });
  log(
    "FA13 pages ComingSoon (hors landing)",
    true,
    `${comingSoonPages.length} page(s): ${comingSoonPages.map((p) => relative(ROOT, p).replace(/\\/g, "/")).join(", ") || "aucune"}`,
    "LOW",
  );

  // ── Git / déploiement ──
  const dirty = gitDirtyCount();
  log(
    "FA14 migration F commitée (git clean)",
    dirty === 0,
    dirty === 0 ? "working tree clean" : `${dirty} changement(s) non commité(s) — CI/clone main = ancienne archi`,
    "CRITICAL",
  );

  // ── Probe F standard ──
  try {
    const fOut = execSync("npx tsx scripts/probe-vague-f.ts", { cwd: ROOT, encoding: "utf8" });
    const m = fOut.match(/(\d+)\/(\d+) checks Vague F/);
    const ok = m ? m[1] === m[2] : false;
    log("FA15 probe-vague-f", ok, m ? `${m[1]}/${m[2]}` : "échec", "HIGH");
  } catch {
    log("FA15 probe-vague-f", false, "échec", "HIGH");
  }

  const failed = checks.filter((c) => !c.ok);
  const critical = failed.filter((c) => c.severity === "CRITICAL");

  console.log("\n--- Résumé ---");
  console.log(`Checks : ${checks.filter((c) => c.ok).length}/${checks.length}`);
  console.log(`Échecs : ${failed.length} (CRITICAL: ${critical.length})`);

  if (failed.length) {
    console.log("\n--- Échecs détaillés ---");
    for (const f of failed) {
      console.log(`  [${f.severity}] ${f.name}: ${f.detail}`);
    }
  }

  process.exitCode = critical.length > 0 || failed.some((f) => f.severity === "HIGH") ? 1 : 0;
}

main();
