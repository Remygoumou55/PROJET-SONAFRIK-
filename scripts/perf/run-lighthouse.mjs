#!/usr/bin/env node
/**
 * B3.2 — Runner Lighthouse Enterprise (référence officielle SONAFRIK).
 *
 * Exécute Lighthouse (desktop + mobile) sur une route, éventuellement authentifiée
 * via un fichier d'extra-headers (Cookie). Archive HTML + JSON et produit un résumé
 * machine `lighthouse-summary.json` avec la comparaison aux seuils Enterprise.
 *
 * Aucune dépendance ajoutée au repo : Lighthouse est invoqué via `npx` (transitoire CI).
 * Chrome : Chrome préinstallé du runner GitHub, ou CHROME_PATH si défini.
 *
 * Usage :
 *   node scripts/perf/run-lighthouse.mjs \
 *     --url http://localhost:3000/creator/catalog/tracks \
 *     --out apps/web/perf-artifacts \
 *     --headers apps/web/perf-artifacts/auth-headers.json \
 *     --form-factor both \
 *     --slug publications
 */
import { spawnSync } from "node:child_process";
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
const url = args.url;
const outDir = resolve(args.out ?? "perf-artifacts");
const headersFile = args.headers ? resolve(args.headers) : null;
const slug = args.slug ?? "route";
const formFactorArg = (args["form-factor"] ?? "both").toLowerCase();

if (!url) {
  console.error("[lighthouse] --url requis");
  process.exit(2);
}

mkdirSync(outDir, { recursive: true });

const LIGHTHOUSE_VERSION = process.env.LIGHTHOUSE_VERSION ?? "12";

// Seuils Enterprise SONAFRIK (référence officielle B3.2).
const THRESHOLDS = {
  performance: 95,
  accessibility: 95,
  "best-practices": 100,
  seo: 95,
};

const CHROME_FLAGS = [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
].join(" ");

function runLighthouse(formFactor) {
  const outPath = resolve(outDir, `lighthouse-${slug}-${formFactor}`);
  const lhArgs = [
    "-y",
    `lighthouse@${LIGHTHOUSE_VERSION}`,
    url,
    "--only-categories=performance,accessibility,best-practices,seo",
    "--output=json",
    "--output=html",
    `--output-path=${outPath}`,
    `--chrome-flags=${CHROME_FLAGS}`,
    "--quiet",
    "--max-wait-for-load=90000",
  ];
  if (formFactor === "desktop") {
    lhArgs.push("--preset=desktop");
  } else {
    lhArgs.push("--form-factor=mobile", "--screenEmulation.mobile");
  }
  if (headersFile && existsSync(headersFile)) {
    lhArgs.push(`--extra-headers=${headersFile}`);
  }

  console.log(`[lighthouse] ${formFactor} → ${url}`);
  const res = spawnSync("npx", lhArgs, {
    stdio: "inherit",
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (res.status !== 0) {
    console.error(`[lighthouse] ${formFactor} a échoué (exit ${res.status}).`);
    return { formFactor, ok: false, error: `lighthouse exit ${res.status}` };
  }

  const jsonPath = `${outPath}.report.json`;
  if (!existsSync(jsonPath)) {
    return { formFactor, ok: false, error: `rapport JSON introuvable: ${jsonPath}` };
  }
  const report = JSON.parse(readFileSync(jsonPath, "utf8"));
  const cat = report.categories ?? {};
  const audit = report.audits ?? {};
  const scoreOf = (c) => (cat[c]?.score == null ? null : Math.round(cat[c].score * 100));
  const numeric = (a) => (audit[a]?.numericValue == null ? null : Math.round(audit[a].numericValue));

  const scores = {
    performance: scoreOf("performance"),
    accessibility: scoreOf("accessibility"),
    "best-practices": scoreOf("best-practices"),
    seo: scoreOf("seo"),
  };
  const metrics = {
    LCP_ms: numeric("largest-contentful-paint"),
    CLS: audit["cumulative-layout-shift"]?.numericValue ?? null,
    TBT_ms: numeric("total-blocking-time"),
    FCP_ms: numeric("first-contentful-paint"),
    SpeedIndex_ms: numeric("speed-index"),
    TTI_ms: numeric("interactive"),
    TTFB_ms: numeric("server-response-time"),
  };

  const failures = [];
  for (const [c, min] of Object.entries(THRESHOLDS)) {
    const s = scores[c];
    if (s == null || s < min) {
      failures.push(`${c}=${s ?? "n/a"} < ${min}`);
    }
  }

  return {
    formFactor,
    ok: true,
    htmlReport: `${outPath}.report.html`,
    jsonReport: jsonPath,
    lighthouseVersion: report.lighthouseVersion,
    scores,
    metrics,
    thresholds: THRESHOLDS,
    thresholdFailures: failures,
    passed: failures.length === 0,
  };
}

const factors = formFactorArg === "both" ? ["desktop", "mobile"] : [formFactorArg];
const results = factors.map(runLighthouse);

const summary = {
  url,
  slug,
  capturedAt: new Date().toISOString(),
  thresholds: THRESHOLDS,
  results,
  allPassed: results.every((r) => r.ok && r.passed),
};

const summaryPath = resolve(outDir, `lighthouse-summary-${slug}.json`);
writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");
console.log(`[lighthouse] résumé écrit → ${summaryPath}`);
for (const r of results) {
  if (r.ok) {
    console.log(
      `[lighthouse] ${r.formFactor} scores=${JSON.stringify(r.scores)} ${
        r.passed ? "PASS" : "FAIL: " + r.thresholdFailures.join(", ")
      }`,
    );
  } else {
    console.log(`[lighthouse] ${r.formFactor} ERROR: ${r.error}`);
  }
}

// N'échoue pas ici : la décision de certification est prise par generate-report.mjs (QG10).
// Ce script se contente de capturer les preuves.
process.exit(0);
