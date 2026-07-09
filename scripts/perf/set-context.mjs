#!/usr/bin/env node
/**
 * B3.2 — Fusionne des clés arbitraires dans perf-artifacts/context.json.
 * Usage : node scripts/perf/set-context.mjs --out <dir> key=value ...
 * (les valeurs "true"/"false"/nombres sont typées automatiquement)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const argv = process.argv.slice(2);
let outDir = "perf-artifacts";
const pairs = [];
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i] === "--out") {
    outDir = argv[i + 1];
    i += 1;
  } else if (argv[i].includes("=")) {
    pairs.push(argv[i]);
  }
}
outDir = resolve(outDir);
mkdirSync(outDir, { recursive: true });

const contextPath = resolve(outDir, "context.json");
const context = existsSync(contextPath) ? JSON.parse(readFileSync(contextPath, "utf8")) : {};

for (const pair of pairs) {
  const idx = pair.indexOf("=");
  const key = pair.slice(0, idx);
  let value = pair.slice(idx + 1);
  if (value === "true") value = true;
  else if (value === "false") value = false;
  else if (value !== "" && !Number.isNaN(Number(value))) value = Number(value);
  context[key] = value;
}

writeFileSync(contextPath, JSON.stringify(context, null, 2), "utf8");
console.log(`[context] mis à jour → ${contextPath}`);
