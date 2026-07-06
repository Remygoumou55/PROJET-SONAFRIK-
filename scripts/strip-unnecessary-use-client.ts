/**
 * Strip "use client" from files that do not need client boundaries.
 * Usage: npx tsx scripts/strip-unnecessary-use-client.ts [--dry-run]
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const WEB_SRC = resolve(ROOT, "apps/web/src");

const CLIENT_MARKERS = [
  /\buseState\b/,
  /\buseEffect\b/,
  /\buseCallback\b/,
  /\buseMemo\b/,
  /\buseRef\b/,
  /\buseContext\b/,
  /\buseReducer\b/,
  /\buseLayoutEffect\b/,
  /\buseId\b/,
  /\buseSyncExternalStore\b/,
  /\buseTransition\b/,
  /\buseDeferredValue\b/,
  /\buseImperativeHandle\b/,
  /\buseFormState\b/,
  /\buseFormStatus\b/,
  /\buseOptimistic\b/,
  /\buseActionState\b/,
  /\buseRouter\b/,
  /\buseSearchParams\b/,
  /\busePathname\b/,
  /\buseParams\b/,
  /\bonClick\b/,
  /\bonChange\b/,
  /\bonSubmit\b/,
  /\bonKeyDown\b/,
  /\bonInput\b/,
  /\bonBlur\b/,
  /\bonFocus\b/,
  /\bwindow\./,
  /\bdocument\./,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\baddEventListener\b/,
  /\bdynamic\s*\(/,
  /\bcreateContext\b/,
  /\buseSrtsp/,
  /\buseEventSubscription\b/,
  /\buseLdse/,
  /\busePlayer\b/,
  /\buseCatalog\b/,
  /\buseAuth\b/,
  /\buseNotifications\b/,
  /\buseWallet\b/,
  /\buseStreaming\b/,
  /\buseAdmin\b/,
  /\buseIdentity\b/,
  /\buseSocial\b/,
  /\buseTip\b/,
  /\bfrom\s+['"][^'"]*\/use[A-Z]/,
  /\bimport\s+\{[^}]*\buse[A-Z]/,
];

const SKIP_DIRS = new Set(["node_modules", ".next"]);

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p, acc);
    else if (/\.(tsx|ts)$/.test(entry.name)) acc.push(p);
  }
  return acc;
}

function needsClient(content: string): boolean {
  if (content.includes('"use server"') || content.includes("'use server'")) return true;
  return CLIENT_MARKERS.some((re) => re.test(content));
}

const dryRun = process.argv.includes("--dry-run");
const stripped: string[] = [];

for (const abs of walk(WEB_SRC)) {
  const content = readFileSync(abs, "utf8");
  if (!/^"use client";?\s*$/m.test(content)) continue;
  if (needsClient(content)) continue;

  const next = content.replace(/^"use client";?\s*\r?\n/, "");
  if (next === content) continue;

  stripped.push(abs.replace(ROOT + "\\", "").replace(ROOT + "/", ""));
  if (!dryRun) writeFileSync(abs, next, "utf8");
}

console.log(`${dryRun ? "[dry-run] " : ""}Stripped "use client" from ${stripped.length} files`);
for (const f of stripped.slice(0, 120)) console.log(`  - ${f}`);
if (stripped.length > 120) console.log(`  ... +${stripped.length - 120} more`);
