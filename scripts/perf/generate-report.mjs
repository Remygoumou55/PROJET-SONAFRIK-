#!/usr/bin/env node
/**
 * B3.2 — Générateur du rapport de certification Enterprise Performance.
 *
 * Agrège des PREUVES RÉELLES (aucune valeur inventée) :
 *  - Lighthouse desktop/mobile (lighthouse-summary-<slug>.json)
 *  - Core Web Vitals natifs (cwv-<slug>.json)
 *  - Bundle + statut build/tests (context.json fourni par la CI)
 *
 * Produit :
 *  - PERFORMANCE_CI_REPORT.md (lisible)
 *  - certification.json (machine)
 *
 * Décision de certification = seuils Enterprise atteints sur mesures réelles.
 * Exit 1 si --enforce et non certifié (QG10 bloquant).
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
const dir = resolve(args.dir ?? "perf-artifacts");
const slug = args.slug ?? "publications";
const enforce = Boolean(args.enforce);
mkdirSync(dir, { recursive: true });

function readJson(path) {
  try {
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
  } catch (err) {
    console.warn(`[report] lecture échouée ${path}: ${err.message}`);
    return null;
  }
}

const lh = readJson(resolve(dir, `lighthouse-summary-${slug}.json`));
const cwv = readJson(resolve(dir, `cwv-${slug}.json`));
const context = readJson(resolve(dir, "context.json")) ?? {};

const CWV_GREEN = { LCP_ms: 2500, CLS: 0.1, INP_ms: 200, FCP_ms: 1800, TTFB_ms: 800 };

// ── Axes de certification (mesures réelles uniquement) ──────────────────────
const axes = [];

// Axe Lighthouse
if (lh?.results?.length) {
  for (const r of lh.results) {
    if (!r.ok) {
      axes.push({ axis: `Lighthouse ${r.formFactor}`, status: "MISSING", detail: r.error });
      continue;
    }
    axes.push({
      axis: `Lighthouse ${r.formFactor}`,
      status: r.passed ? "PASS" : "FAIL",
      detail: `perf=${r.scores.performance} a11y=${r.scores.accessibility} bp=${r.scores["best-practices"]} seo=${r.scores.seo}`,
      failures: r.thresholdFailures,
    });
  }
} else {
  axes.push({ axis: "Lighthouse", status: "MISSING", detail: "aucun résumé Lighthouse" });
}

// Axe Core Web Vitals
if (cwv?.coreWebVitals) {
  const v = cwv.coreWebVitals;
  const checks = [
    ["LCP", v.LCP_ms, CWV_GREEN.LCP_ms, "ms"],
    ["CLS", v.CLS, CWV_GREEN.CLS, ""],
    ["INP(proxy)", v.INP_proxy_ms, CWV_GREEN.INP_ms, "ms"],
    ["FCP", v.FCP_ms, CWV_GREEN.FCP_ms, "ms"],
    ["TTFB", v.TTFB_ms, CWV_GREEN.TTFB_ms, "ms"],
  ];
  const cwvFailures = checks.filter(([, val, max]) => val == null || val > max);
  axes.push({
    axis: "Core Web Vitals",
    status: cwvFailures.length === 0 ? "PASS" : "FAIL",
    detail: checks.map(([n, val, max, u]) => `${n}=${val}${u}(≤${max}${u})`).join(" "),
    failures: cwvFailures.map(([n, val]) => `${n}=${val}`),
  });
} else {
  axes.push({ axis: "Core Web Vitals", status: "MISSING", detail: "aucune capture CWV" });
}

// Axe Bundle (régression vs baseline B3)
if (context.bundleFirstLoadKb != null && context.baselineFirstLoadKb != null) {
  const delta = context.bundleFirstLoadKb - context.baselineFirstLoadKb;
  const tolerance = context.bundleToleranceKb ?? 5;
  axes.push({
    axis: "Bundle",
    status: delta <= tolerance ? "PASS" : "FAIL",
    detail: `First Load ${context.bundleFirstLoadKb}kB (baseline B3 ${context.baselineFirstLoadKb}kB, Δ${delta >= 0 ? "+" : ""}${delta}kB, tol ±${tolerance}kB)`,
    failures: delta <= tolerance ? [] : [`régression bundle +${delta}kB`],
  });
} else {
  axes.push({ axis: "Bundle", status: "MISSING", detail: "métriques bundle non fournies" });
}

// Axe Build & Tests (statut injecté par la CI : les étapes précédentes ont déjà PASS)
axes.push({
  axis: "Build & Tests",
  status: context.buildTestsPassed ? "PASS" : "MISSING",
  detail: context.buildTestsDetail ?? "statut non fourni",
});

// ── Décision ────────────────────────────────────────────────────────────────
const hasMissing = axes.some((a) => a.status === "MISSING");
const hasFail = axes.some((a) => a.status === "FAIL");
const certified = !hasMissing && !hasFail;

// Score indicatif : proportion pondérée des axes réellement PASS (transparent).
const weights = {
  "Lighthouse desktop": 0.2,
  "Lighthouse mobile": 0.2,
  "Core Web Vitals": 0.3,
  Bundle: 0.15,
  "Build & Tests": 0.15,
};
let scoreAcc = 0;
let weightAcc = 0;
for (const a of axes) {
  const w = weights[a.axis] ?? 0;
  weightAcc += w;
  if (a.status === "PASS") scoreAcc += w;
}
const score10 = weightAcc > 0 ? Number(((scoreAcc / weightAcc) * 10).toFixed(2)) : null;

const decision = {
  module: "mes-publications",
  phase: "B3.2",
  certified,
  score10,
  scoreNote: "Score indicatif = proportion pondérée des axes PASS sur mesures réelles CI.",
  axes,
  capturedAt: new Date().toISOString(),
  environment: context.environment ?? "CI (ubuntu-latest, next start production)",
};

writeFileSync(resolve(dir, "certification.json"), JSON.stringify(decision, null, 2), "utf8");

// ── Rapport Markdown ─────────────────────────────────────────────────────────
const fmt = (a) =>
  `| ${a.axis} | ${a.status === "PASS" ? "✅ PASS" : a.status === "FAIL" ? "❌ FAIL" : "⚠️ MISSING"} | ${a.detail}${a.failures?.length ? ` — ${a.failures.join("; ")}` : ""} |`;

const lhTable = (lh?.results ?? [])
  .filter((r) => r.ok)
  .map(
    (r) =>
      `| ${r.formFactor} | ${r.scores.performance} | ${r.scores.accessibility} | ${r.scores["best-practices"]} | ${r.scores.seo} | ${r.metrics.LCP_ms ?? "—"} | ${r.metrics.TBT_ms ?? "—"} | ${r.metrics.CLS ?? "—"} |`,
  )
  .join("\n");

const md = `# SONAFRIK — Enterprise Performance CI Certification (B3.2)

Module : **Mes publications** · Route : \`${cwv?.route ?? "/creator/catalog/tracks"}\`
Environnement : ${decision.environment}
Capture : ${decision.capturedAt}

## Décision

**${certified ? "✅ B3 CERTIFIÉ ENTERPRISE" : "❌ NON CERTIFIÉ"}** — Score indicatif : **${score10 ?? "n/a"}/10**

> ${decision.scoreNote}
> Toutes les valeurs proviennent de preuves générées par la CI. Aucune estimation.

## Axes de certification

| Axe | Statut | Détail |
|---|---|---|
${axes.map(fmt).join("\n")}

## Lighthouse (authentifié)

| Form factor | Perf | A11y | BP | SEO | LCP(ms) | TBT(ms) | CLS |
|---|---|---|---|---|---|---|---|
${lhTable || "| — | — | — | — | — | — | — | — |"}

Seuils Enterprise : Perf ≥ 95 · A11y ≥ 95 · BP = 100 · SEO ≥ 95

## Core Web Vitals (natif, route authentifiée)

${
  cwv?.coreWebVitals
    ? `| Métrique | Mesure | Seuil vert | Statut |
|---|---|---|---|
| LCP | ${cwv.coreWebVitals.LCP_ms} ms | ≤ 2500 ms | ${cwv.coreWebVitals.LCP_ms <= 2500 ? "✅" : "❌"} |
| CLS | ${cwv.coreWebVitals.CLS} | ≤ 0.1 | ${cwv.coreWebVitals.CLS <= 0.1 ? "✅" : "❌"} |
| INP (proxy lab) | ${cwv.coreWebVitals.INP_proxy_ms} ms | ≤ 200 ms | ${cwv.coreWebVitals.INP_proxy_ms <= 200 ? "✅" : "❌"} |
| FCP | ${cwv.coreWebVitals.FCP_ms} ms | ≤ 1800 ms | ${cwv.coreWebVitals.FCP_ms <= 1800 ? "✅" : "❌"} |
| TTFB | ${cwv.coreWebVitals.TTFB_ms} ms | ≤ 800 ms | ${cwv.coreWebVitals.TTFB_ms <= 800 ? "✅" : "❌"} |

> INP est une métrique terrain ; en lab on rapporte un **proxy** (latence d'interaction max). TBT Lighthouse est le proxy officiel du blocage main-thread.`
    : "_Aucune capture CWV disponible._"
}

## Runtime & Network

${
  cwv?.runtime
    ? `- Long tasks : **${cwv.runtime.longTasks}** (total ${cwv.runtime.longTaskTotalMs} ms)
- DOMContentLoaded : ${cwv.runtime.domContentLoadedMs} ms · load : ${cwv.runtime.loadEventMs} ms
- Requêtes Supabase au chargement : **${cwv.network.supabaseRequestsOnLoad}** · total session : ${cwv.network.supabaseRequestsTotal}
- Lignes catalogue rendues : ${cwv.rowCount}`
    : "_Non disponible._"
}

## Bundle

${
  context.bundleFirstLoadKb != null
    ? `- First Load JS \`/creator/catalog/tracks\` : **${context.bundleFirstLoadKb} kB** (baseline B3 : ${context.baselineFirstLoadKb ?? "?"} kB)`
    : "_Non fourni._"
}

## Reproduction

Voir \`docs/performance/ENTERPRISE_PERF_CI_PIPELINE.md\`.
`;

writeFileSync(resolve(dir, "PERFORMANCE_CI_REPORT.md"), md, "utf8");

console.log(`[report] certification=${certified} score=${score10}`);
console.log(`[report] écrit → ${resolve(dir, "PERFORMANCE_CI_REPORT.md")}`);

if (enforce && !certified) {
  console.error("[report] QG10 : certification non atteinte (voir axes MISSING/FAIL).");
  process.exit(1);
}
process.exit(0);
