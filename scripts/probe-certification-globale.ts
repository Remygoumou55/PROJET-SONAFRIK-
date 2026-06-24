/**
 * Certification globale SONAFRIK — vagues A→F + santé monorepo.
 * Usage: pnpm probe:certification
 */
import { execSync } from "child_process";
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, join } from "path";

const ROOT = resolve(__dirname, "..");

type WaveResult = { wave: string; passed: number; total: number; ok: boolean };
const waves: WaveResult[] = [];

function runProbe(script: string, label: string): WaveResult {
  try {
    const out = execSync(`npx tsx scripts/${script}`, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const m = out.match(/(\d+)\/(\d+) checks/);
    const passed = m ? Number(m[1]) : 0;
    const total = m ? Number(m[2]) : 0;
    const ok = passed === total && total > 0;
    waves.push({ wave: label, passed, total, ok });
    console.log(ok ? `✅ ${label} — ${passed}/${total}` : `❌ ${label} — ${passed}/${total}`);
    if (!ok) console.log(out.slice(-800));
    return { wave: label, passed, total, ok };
  } catch (e) {
    const out = (e as { stdout?: string; stderr?: string }).stdout ?? "";
    const m = out.match(/(\d+)\/(\d+) checks/);
    waves.push({
      wave: label,
      passed: m ? Number(m[1]) : 0,
      total: m ? Number(m[2]) : 0,
      ok: false,
    });
    console.log(`❌ ${label} — échec`);
    return { wave: label, passed: 0, total: 0, ok: false };
  }
}

function extraChecks(): { passed: number; total: number } {
  let passed = 0;
  let total = 0;
  const log = (name: string, ok: boolean, detail: string) => {
    total++;
    if (ok) passed++;
    console.log(`${ok ? "✅" : "❌"} ${name} — ${detail}`);
  };

  const migDir = resolve(ROOT, "supabase/migrations");
  const migCount = readdirSync(migDir).filter((f) => f.endsWith(".sql")).length;
  log("G1 migrations locales", migCount >= 60, `${migCount} fichiers SQL`);

  log(
    "G2 migration vague E présente",
    existsSync(resolve(migDir, "20260624200000_vague_e_payout_audit_request.sql")),
    "20260624200000",
  );

  log(
    "G3 docs clés",
    existsSync(resolve(ROOT, "docs/PLAN_CORRECTION_360.md")) &&
      existsSync(resolve(ROOT, "docs/PAIEMENTS.md")) &&
      existsSync(resolve(ROOT, "docs/RAPPORT-CERTIFICATION-GLOBALE.md")),
    "PLAN + PAIEMENTS + RAPPORT",
  );

  const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8")) as { scripts?: Record<string, string> };
  log(
    "G4 scripts probes A-F",
    ["probe:vague-a", "probe:vague-b", "probe:vague-c", "probe:vague-d", "probe:vague-e", "probe:vague-f", "probe:hex-colors"].every(
      (s) => pkg.scripts?.[s],
    ),
    "pnpm probe:vague-* + hex",
  );

  log(
    "G5 error boundaries web",
    existsSync(resolve(ROOT, "apps/web/src/app/error.tsx")) &&
      existsSync(resolve(ROOT, "apps/web/src/app/(admin)/error.tsx")),
    "error.tsx global + admin",
  );

  log(
    "G6 payments env documented",
    readFileSync(resolve(ROOT, ".env.example"), "utf8").includes("NEXT_PUBLIC_PAYMENTS_ENABLED"),
    ".env.example",
  );

  return { passed, total };
}

function main() {
  console.log("=== CERTIFICATION GLOBALE SONAFRIK — Vagues A→F ===\n");

  runProbe("probe-vague-a.ts", "Vague A++ (sécurité)");
  runProbe("probe-vague-b.ts", "Vague B++ (stabilisation)");
  runProbe("probe-vague-c.ts", "Vague C++ (architecture)");
  runProbe("probe-vague-d.ts", "Vague D++ (typage)");
  runProbe("probe-vague-e.ts", "Vague E++ (paiements)");
  runProbe("probe-vague-f.ts", "Vague F (domaines)");

  console.log("\n=== Checks globaux ===\n");
  const extra = extraChecks();

  const wavePassed = waves.reduce((a, w) => a + w.passed, 0);
  const waveTotal = waves.reduce((a, w) => a + w.total, 0);
  const allWavesOk = waves.every((w) => w.ok);
  const allExtraOk = extra.passed === extra.total;

  console.log(`\n--- Résumé ---`);
  console.log(`Vagues A→F : ${wavePassed}/${waveTotal}`);
  console.log(`Globaux    : ${extra.passed}/${extra.total}`);
  console.log(`TOTAL      : ${wavePassed + extra.passed}/${waveTotal + extra.total}`);

  process.exitCode = allWavesOk && allExtraOk ? 0 : 1;
}

main();
