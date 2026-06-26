/**
 * Certification maître Vagues A→E — audit senior ordonné (juin 2026).
 * Usage: pnpm probe:certification-a-e
 *
 * Ordre : A → B → C → D → E (historique + stabilisation) + hex + build gate optionnel.
 */
import { execSync } from "child_process";
import { existsSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");

type WaveResult = {
  wave: string;
  script: string;
  passed: number;
  total: number;
  ok: boolean;
};

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
    waves.push({ wave: label, script, passed, total, ok });
    console.log(ok ? `✅ ${label} — ${passed}/${total}` : `❌ ${label} — ${passed}/${total}`);
    if (!ok) console.log(out.slice(-600));
    return { wave: label, script, passed, total, ok };
  } catch (e) {
    const out = (e as { stdout?: string }).stdout ?? "";
    const m = out.match(/(\d+)\/(\d+) checks/);
    waves.push({
      wave: label,
      script,
      passed: m ? Number(m[1]) : 0,
      total: m ? Number(m[2]) : 0,
      ok: false,
    });
    console.log(`❌ ${label} — échec`);
    if (out) console.log(out.slice(-600));
    return { wave: label, script, passed: 0, total: 0, ok: false };
  }
}

function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("CERTIFICATION MAÎTRE — VAGUES A → E (ordre strict)");
  console.log("═══════════════════════════════════════════════\n");

  const sequence: [string, string][] = [
    ["probe-vague-a.ts", "A++ Sécurité"],
    ["probe-vague-a-launch.ts", "A Launch (wallet + orange)"],
    ["probe-vague-b.ts", "B++ Stabilisation"],
    ["probe-vague-b-stabilisation.ts", "B Stabilisation"],
    ["probe-vague-c.ts", "C++ Architecture admin"],
    ["probe-vague-c-stabilisation.ts", "C Stabilisation"],
    ["probe-vague-d.ts", "D++ Typage strict"],
    ["probe-vague-d-stabilisation.ts", "D Stabilisation"],
    ["probe-vague-e.ts", "E++ Paiements"],
    ["probe-vague-e-stabilisation.ts", "E Stabilisation"],
    ["probe-hex-colors.ts", "Global SCS (hex + Tailwind)"],
  ];

  for (const [script, label] of sequence) {
    if (!existsSync(resolve(ROOT, "scripts", script))) {
      console.log(`❌ ${label} — script manquant: ${script}`);
      waves.push({ wave: label, script, passed: 0, total: 0, ok: false });
      continue;
    }
    runProbe(script, label);
  }

  const passed = waves.reduce((a, w) => a + w.passed, 0);
  const total = waves.reduce((a, w) => a + w.total, 0);
  const allOk = waves.every((w) => w.ok);

  console.log("\n═══════════════════════════════════════════════");
  console.log(`TOTAL A→E + SCS : ${passed}/${total}`);
  console.log(allOk ? "STATUT : ✅ TOUTES LES VAGUES A→E VALIDÉES" : "STATUT : ❌ ÉCHEC — corriger avant prod");
  console.log("═══════════════════════════════════════════════\n");

  process.exitCode = allOk ? 0 : 1;
}

main();
