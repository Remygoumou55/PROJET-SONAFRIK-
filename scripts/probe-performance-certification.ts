/**
 * Performance & UX Certification gate.
 * Usage: pnpm probe:performance
 */
import { execSync } from "child_process";
import { existsSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");

function runDiscovery(): { passed: number; total: number; ok: boolean } {
  const out = execSync("npx tsx scripts/probe-performance-discovery.ts", {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  const m = out.match(/(\d+)\/(\d+) checks/);
  const passed = m ? Number(m[1]) : 0;
  const total = m ? Number(m[2]) : 0;
  console.log(out);
  return { passed, total, ok: passed === total && total > 0 };
}

function extraChecks(): { passed: number; total: number } {
  let passed = 0;
  let total = 0;
  const log = (name: string, ok: boolean, detail: string) => {
    total++;
    if (ok) passed++;
    console.log(`${ok ? "✅" : "❌"} ${name} — ${detail}`);
  };

  const docs = [
    "docs/performance/PERFORMANCE_UX_CERTIFICATION.md",
    "docs/performance/LIVE_CONTROL_PERFORMANCE.md",
    "docs/performance/AFRICA_MODE.md",
    "docs/performance/reports/PERFORMANCE_CERTIFICATION_REPORT.md",
    "docs/performance/reports/UX_CERTIFICATION_REPORT.md",
    "docs/performance/reports/BUNDLE_ANALYSIS_REPORT.md",
    "docs/performance/reports/CORE_WEB_VITALS_REPORT.md",
  ];
  log("G1 docs performance", docs.every((d) => existsSync(resolve(ROOT, d))), `${docs.length} fichiers`);

  log(
    "G2 EXECUTION_LOG référence",
    existsSync(resolve(ROOT, "docs/EXECUTION_LOG.md")),
    "EXECUTION_LOG.md",
  );

  log(
    "G3 migration flags",
    existsSync(resolve(ROOT, "supabase/migrations/20260626120000_performance_ux_feature_flags.sql")),
    "performance_ux_feature_flags",
  );

  log(
    "G4 LIVE CONTROL prêt",
    existsSync(resolve(ROOT, "docs/performance/LIVE_CONTROL_PERFORMANCE.md")),
    "checklist Rémy",
  );

  return { passed, total };
}

console.log("=== PERFORMANCE & UX CERTIFICATION GATE ===\n");

const discovery = runDiscovery();
console.log("");
const extra = extraChecks();

const totalPassed = discovery.passed + extra.passed;
const totalChecks = discovery.total + extra.total;

console.log(`\n--- Résumé ---`);
console.log(`Discovery  : ${discovery.passed}/${discovery.total}`);
console.log(`Globaux    : ${extra.passed}/${extra.total}`);
console.log(`TOTAL      : ${totalPassed}/${totalChecks}`);

if (!discovery.ok || extra.passed !== extra.total) {
  process.exit(1);
}

console.log("\n🟢 Programme discovery certifié — LIVE CONTROL Rémy requis pour certification finale.");
process.exit(0);
