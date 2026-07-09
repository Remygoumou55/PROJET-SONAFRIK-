#!/usr/bin/env node
/**
 * B3.2 — Extraction bundle depuis le log de build Next + écriture context.json.
 *
 * Parse la table de routes de `next build` pour la route cible et récupère la
 * colonne "First Load JS". Écrit/complète perf-artifacts/context.json avec la
 * mesure bundle réelle + baseline B3 pour la détection de régression.
 *
 * Usage :
 *   node scripts/perf/extract-bundle.mjs \
 *     --log build.log --out apps/web/perf-artifacts \
 *     --route /creator/catalog/tracks --baseline 268
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i += 1;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const logPath = resolve(args.log ?? "build.log");
const outDir = resolve(args.out ?? "perf-artifacts");
const route = args.route ?? "/creator/catalog/tracks";
const baseline = args.baseline != null ? Number(args.baseline) : null;
mkdirSync(outDir, { recursive: true });

function toKb(value, unit) {
  const n = Number(value);
  if (unit === "MB") return Math.round(n * 1024);
  if (unit === "B") return Number((n / 1024).toFixed(2));
  return n; // kB
}

let firstLoadKb = null;
let routeSizeKb = null;

if (existsSync(logPath)) {
  const log = readFileSync(logPath, "utf8");
  const lines = log.split("\n");
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Ligne route : "├ ƒ /creator/catalog/tracks   6.86 kB   268 kB"
  const re = new RegExp(`${escaped}\\s+([\\d.]+)\\s*(B|kB|MB)\\s+([\\d.]+)\\s*(B|kB|MB)`);
  for (const line of lines) {
    const m = line.match(re);
    if (m) {
      routeSizeKb = toKb(m[1], m[2]);
      firstLoadKb = toKb(m[3], m[4]);
      break;
    }
  }
} else {
  console.warn(`[bundle] log introuvable: ${logPath}`);
}

const contextPath = resolve(outDir, "context.json");
const existing = existsSync(contextPath) ? JSON.parse(readFileSync(contextPath, "utf8")) : {};
const context = {
  ...existing,
  route,
  bundleRouteKb: routeSizeKb,
  bundleFirstLoadKb: firstLoadKb,
  baselineFirstLoadKb: baseline ?? existing.baselineFirstLoadKb ?? null,
  bundleToleranceKb: 5,
};

writeFileSync(contextPath, JSON.stringify(context, null, 2), "utf8");
console.log(
  `[bundle] route=${route} size=${routeSizeKb}kB firstLoad=${firstLoadKb}kB baseline=${context.baselineFirstLoadKb}kB → ${contextPath}`,
);
