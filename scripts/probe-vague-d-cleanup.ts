/**
 * Vague D — Typage + design tokens (audit 360° juillet 2026)
 * Usage: pnpm probe:vague-d-cleanup
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve, relative } from "node:path";

const ROOT = resolve(__dirname, "..");
const WEB_SRC = resolve(ROOT, "apps/web/src/features");
const API_SRC = resolve(ROOT, "packages/api/src");
const EDGE_FN = resolve(ROOT, "supabase/functions");

type Check = { name: string; ok: boolean; detail: string };
const checks: Check[] = [];

function log(name: string, ok: boolean, detail: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name} — ${detail}`);
}

function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf8");
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

function scanDir(dir: string, pattern: RegExp): number {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") continue;
      total += scanDir(p, pattern);
    } else if (
      entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".d.ts") &&
      !entry.name.endsWith(".test.ts")
    ) {
      total += (readFileSync(p, "utf8").match(pattern) ?? []).length;
    }
  }
  return total;
}

function countRgbaInFeatures(): number {
  let total = 0;
  for (const abs of walkTsFiles(WEB_SRC)) {
    if (!abs.endsWith(".tsx")) continue;
    total += (readFileSync(abs, "utf8").match(/rgba\(/g) ?? []).length;
  }
  return total;
}

function main() {
  console.log("=== Vague D — Typage + design tokens ===\n");

  const globals = read("apps/web/src/app/globals.css");
  log(
    "D-TOK1 @theme + overlay tokens",
    globals.includes("@theme") &&
      globals.includes("--overlay-vert-soft") &&
      globals.includes("--chip-vert-bg"),
    "globals.css SSOT",
  );

  log(
    "D-TOK2 overlayTokens module",
    existsSync(resolve(ROOT, "apps/web/src/lib/design/overlayTokens.ts")),
    "lib/design/overlayTokens.ts",
  );

  const overlayModule = read("apps/web/src/lib/design/overlayTokens.ts");
  log(
    "D-TOK3 admin status via tokens",
    overlayModule.includes("WITHDRAWAL_STATUS_STYLES") &&
      overlayModule.includes("var(--overlay-vert-soft)") &&
      !overlayModule.includes("rgba("),
    "pas de rgba dans overlayTokens",
  );

  const rgbaFeatures = countRgbaInFeatures();
  log(
    "D-TOK4 rgba features tsx réduit",
    rgbaFeatures <= 60,
    `${rgbaFeatures} occurrences (cible cycle 3 ≤60, certifié)`,
  );

  log(
    "D-TYPE1 api as never",
    scanDir(API_SRC, /as never/g) === 0,
    "0 as never packages/api",
  );

  log(
    "D-TYPE2 api as any",
    scanDir(API_SRC, /\bas any\b/g) === 0,
    "0 as any packages/api",
  );

  log(
    "D-TYPE3 web as any",
    scanDir(resolve(ROOT, "apps/web/src"), /\bas any\b/g) === 0,
    "0 as any apps/web",
  );

  log(
    "D-TYPE4 edge as never",
    scanDir(EDGE_FN, /as never/g) === 0,
    "0 as never edge functions",
  );

  const streamingRepo = read("packages/api/src/streaming/streaming.repository.ts");
  const searchBeatsBlock =
    streamingRepo.match(/async searchBeats[\s\S]*?^  async /m)?.[0] ?? streamingRepo;
  log(
    "D-STRICT1 searchBeats propage erreurs",
    searchBeatsBlock.includes("if (error) throw error") &&
      !searchBeatsBlock.includes("if (error) return []"),
    "pas de swallow DB",
  );

  log(
    "D-STRICT2 zod caps analytics",
    read("packages/api/src/analytics/schemas.ts").includes(".max(90)") &&
      read("packages/api/src/payout/schemas.ts").includes(".max(200)"),
    "limites Zod",
  );

  log(
    "D-STRICT3 count_unread RPC",
    read("packages/api/src/notifications/notifications.repository.ts").includes(
      'rpc("count_unread_notifications")',
    ),
    "source unique notifications",
  );

  log(
    "D-REG probes juillet",
    existsSync(resolve(ROOT, "scripts/probe-vague-d.ts")) &&
      existsSync(resolve(ROOT, "scripts/probe-vague-d-stabilisation.ts")) &&
      existsSync(resolve(ROOT, "scripts/probe-hex-colors.ts")) &&
      existsSync(resolve(ROOT, "scripts/probe-vague-c-cleanup.ts")),
    "régression A→C + hex",
  );

  log(
    "D-DOC certification",
    existsSync(resolve(ROOT, "docs/vagues/VAGUE-D-CERTIFICATION.md")),
    "VAGUE-D-CERTIFICATION.md",
  );

  const passed = checks.filter((c) => c.ok).length;
  console.log(`\n${passed}/${checks.length} checks Vague D Typage + Tokens`);
  process.exitCode = passed === checks.length ? 0 : 1;
}

main();
