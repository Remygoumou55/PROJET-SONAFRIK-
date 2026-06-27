/**
 * Audit Global SCS — détecte les couleurs hex hardcodées hors tokens CSS.
 * Usage: pnpm probe:hex-colors
 *
 * Autorisé :
 * - apps/web/src/app/globals.css (@theme — source unique tokens)
 * - GoogleAuthButton.tsx (couleurs brand Google officielles)
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, join, relative } from "path";

const ROOT = resolve(__dirname, "..");
const WEB_SRC = resolve(ROOT, "apps/web/src");

const ALLOWLIST = new Set([
  "apps/web/src/app/globals.css",
  "apps/web/src/features/identity/auth/components/GoogleAuthButton.tsx",
]);

const HEX_PATTERN = /#[0-9a-fA-F]{3,8}\b/g;
const TAILWIND_PALETTE =
  /\b(text|bg|border|ring|fill|stroke|from|to|via)-(red|green|blue|yellow|orange|purple|pink|gray|slate|zinc|neutral|stone|amber|lime|emerald|teal|cyan|sky|indigo|violet|fuchsia|rose)-[0-9]{2,3}\b/g;

type Violation = { file: string; count: number; samples: string[] };
type Check = { name: string; ok: boolean; detail: string };
const checks: Check[] = [];

function log(name: string, ok: boolean, detail: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name} — ${detail}`);
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

function scanTailwindViolations(): Violation[] {
  const violations: Violation[] = [];
  const files = walkFiles(WEB_SRC, /\.tsx$/);

  for (const abs of files) {
    const rel = relative(ROOT, abs).replace(/\\/g, "/");
    if (ALLOWLIST.has(rel)) continue;
    const src = readFileSync(abs, "utf8");
    const matches = src.match(TAILWIND_PALETTE) ?? [];
    if (matches.length === 0) continue;
    violations.push({
      file: rel,
      count: matches.length,
      samples: [...new Set(matches)].slice(0, 5),
    });
  }
  return violations;
}

function scanHexViolations(): Violation[] {
  const violations: Violation[] = [];
  const files = walkFiles(WEB_SRC, /\.(tsx|ts|css)$/);

  for (const abs of files) {
    const rel = relative(ROOT, abs).replace(/\\/g, "/");
    if (ALLOWLIST.has(rel)) continue;

    const src = readFileSync(abs, "utf8");
    const matches = src.match(HEX_PATTERN) ?? [];
    if (matches.length === 0) continue;

    violations.push({
      file: rel,
      count: matches.length,
      samples: [...new Set(matches)].slice(0, 5),
    });
  }
  return violations;
}

function verifyThemeTokens(): boolean {
  const css = readFileSync(resolve(WEB_SRC, "app/globals.css"), "utf8");
  const required = [
    "--color-vert-energie",
    "--color-or-solaire",
    "--color-noir-profond",
    "--color-texte-principal",
    "--color-texte-secondaire",
    "@theme",
  ];
  return required.every((token) => css.includes(token));
}

function main() {
  console.log("=== Global SCS — audit couleurs hex ===\n");

  log("SCS1 @theme tokens présents", verifyThemeTokens(), "globals.css @theme");

  const violations = scanHexViolations();
  log(
    "SCS2 zero hex TSX/TS (hors allowlist)",
    violations.length === 0,
    violations.length
      ? violations.map((v) => `${v.file} (${v.count}: ${v.samples.join(", ")})`).join(" | ")
      : "0 violation",
  );

  log(
    "SCS3 pas de SCSS parallèle",
    !existsSync(resolve(WEB_SRC, "..", "styles")) &&
      walkFiles(WEB_SRC, /\.scss$/).length === 0,
    "aucun .scss dans apps/web",
  );

  const twViolations = scanTailwindViolations();
  log(
    "SCS4 zero Tailwind palette (text-red-500, etc.)",
    twViolations.length === 0,
    twViolations.length
      ? twViolations.map((v) => `${v.file} (${v.samples.join(", ")})`).join(" | ")
      : "0 violation",
  );

  const passed = checks.filter((c) => c.ok).length;
  console.log(`\n${passed}/${checks.length} checks Global SCS`);
  process.exitCode = passed === checks.length ? 0 : 1;
}

main();
