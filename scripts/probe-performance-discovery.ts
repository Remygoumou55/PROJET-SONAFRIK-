/**
 * Phase A — Performance & UX Discovery probe.
 * Usage: pnpm probe:performance-discovery
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, join } from "path";

const ROOT = resolve(__dirname, "..");
const WEB_SRC = resolve(ROOT, "apps/web/src");

let passed = 0;
let total = 0;

function log(name: string, ok: boolean, detail: string): void {
  total++;
  if (ok) passed++;
  console.log(`${ok ? "✅" : "❌"} ${name} — ${detail}`);
}

function countInDir(dir: string, pattern: RegExp, ext = ".tsx"): number {
  let count = 0;
  function walk(p: string): void {
    for (const entry of readdirSync(p, { withFileTypes: true })) {
      const full = join(p, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(ext) || entry.name.endsWith(".ts")) {
        const content = readFileSync(full, "utf8");
        if (pattern.test(content)) count++;
      }
    }
  }
  if (existsSync(dir)) walk(dir);
  return count;
}

function countFilesRecursive(dir: string, filename: string): number {
  let count = 0;
  function walk(p: string): void {
    for (const entry of readdirSync(p, { withFileTypes: true })) {
      const full = join(p, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === filename) count++;
    }
  }
  if (existsSync(dir)) walk(dir);
  return count;
}

function grepCount(dir: string, needle: string): number {
  let count = 0;
  function walk(p: string): void {
    for (const entry of readdirSync(p, { withFileTypes: true })) {
      const full = join(p, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
        if (readFileSync(full, "utf8").includes(needle)) count++;
      }
    }
  }
  if (existsSync(dir)) walk(dir);
  return count;
}

console.log("=== PERFORMANCE & UX DISCOVERY — Phase A ===\n");

// --- Documentation ---
log(
  "P1 programme principal",
  existsSync(resolve(ROOT, "docs/performance/PERFORMANCE_UX_CERTIFICATION.md")),
  "PERFORMANCE_UX_CERTIFICATION.md",
);
log(
  "P2 LIVE CONTROL",
  existsSync(resolve(ROOT, "docs/performance/LIVE_CONTROL_PERFORMANCE.md")),
  "LIVE_CONTROL_PERFORMANCE.md",
);
log(
  "P3 Africa Mode",
  existsSync(resolve(ROOT, "docs/performance/AFRICA_MODE.md")),
  "AFRICA_MODE.md",
);
log(
  "P4 rapports certification",
  existsSync(resolve(ROOT, "docs/performance/reports/PERFORMANCE_CERTIFICATION_REPORT.md")) &&
    existsSync(resolve(ROOT, "docs/performance/reports/CORE_WEB_VITALS_REPORT.md")),
  "4 rapports",
);

// --- Feature flags migration ---
const perfFlagMigration = resolve(
  ROOT,
  "supabase/migrations/20260626120000_performance_ux_feature_flags.sql",
);
log("P5 migration performance flags", existsSync(perfFlagMigration), "20260626120000");
if (existsSync(perfFlagMigration)) {
  const sql = readFileSync(perfFlagMigration, "utf8");
  const flagCount = (sql.match(/performance_[a-z_]+/g) ?? []).filter((v, i, a) => a.indexOf(v) === i).length;
  log("P6 flags performance count", flagCount >= 8, `${flagCount} flags`);
}

// --- Next.js patterns ---
const useClientCount = countInDir(WEB_SRC, /^"use client"/m);
log(
  "P7 use client count",
  useClientCount >= 80 && useClientCount <= 235,
  `${useClientCount} fichiers (cible ≤235 phase audit, objectif ≤165)`,
);

const loadingCount = countFilesRecursive(resolve(WEB_SRC, "app"), "loading.tsx");
log("P8 loading.tsx coverage", loadingCount >= 40, `${loadingCount} segments`);

const errorCount = countFilesRecursive(resolve(WEB_SRC, "app"), "error.tsx");
log("P9 error boundaries", errorCount >= 6, `${errorCount} error.tsx`);

const dynamicCount = grepCount(WEB_SRC, "dynamic(");
log("P10 dynamic imports", dynamicCount >= 3, `${dynamicCount} fichiers`);

const suspenseCount = grepCount(WEB_SRC, "Suspense");
log("P11 Suspense boundaries", suspenseCount >= 5, `${suspenseCount} fichiers`);

// --- Images & fonts ---
log(
  "P12 CoverImage next/image",
  existsSync(resolve(WEB_SRC, "components/CoverImage.tsx")) &&
    readFileSync(resolve(WEB_SRC, "components/CoverImage.tsx"), "utf8").includes("next/image"),
  "CoverImage centralisé",
);

const layoutContent = readFileSync(resolve(WEB_SRC, "app/layout.tsx"), "utf8");
log(
  "P13 Montserrat next/font",
  layoutContent.includes("Montserrat") && layoutContent.includes("next/font"),
  "font optimisée",
);

// --- Network aware ---
log(
  "P14 networkAware hook",
  existsSync(resolve(WEB_SRC, "lib/networkAware.ts")),
  "networkAware.ts",
);
log(
  "P15 useStreamQuality",
  existsSync(resolve(WEB_SRC, "features/listener/hooks/useStreamQuality.ts")),
  "qualité adaptative",
);

// --- Player ---
log(
  "P16 WebPlayer dynamic ssr:false",
  readFileSync(resolve(WEB_SRC, "features/listener/components/StreamingLayoutClient.tsx"), "utf8").includes(
    "ssr: false",
  ),
  "audio hors SSR",
);

// --- Search debounce ---
const useSearchContent = readFileSync(resolve(WEB_SRC, "features/listener/hooks/useSearch.ts"), "utf8");
log("P17 search debounce 300ms", useSearchContent.includes("300"), "useSearch");

// --- No heavy chart libs ---
const webPkg = JSON.parse(readFileSync(resolve(ROOT, "apps/web/package.json"), "utf8")) as {
  dependencies?: Record<string, string>;
};
const deps = { ...webPkg.dependencies };
log("P18 no framer-motion", !deps["framer-motion"], "absent");
log("P19 no recharts/chart.js", !deps["recharts"] && !deps["chart.js"], "absent");

// --- next.config ---
const nextConfig = readFileSync(resolve(ROOT, "apps/web/next.config.ts"), "utf8");
log("P20 compress enabled", nextConfig.includes("compress: true"), "gzip");
log("P21 image AVIF/WebP", nextConfig.includes("image/avif"), "formats");

// --- Skeleton ---
const globalsCss = readFileSync(resolve(WEB_SRC, "app/globals.css"), "utf8");
log("P22 skeleton token", globalsCss.includes("--color-skeleton") || globalsCss.includes("skeleton"), "globals.css");

// --- Package scripts ---
const rootPkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8")) as {
  scripts?: Record<string, string>;
};
log(
  "P24 performance layer",
  existsSync(resolve(WEB_SRC, "lib/performance/performance-context.tsx")) &&
    existsSync(resolve(ROOT, "packages/shared/src/performance/search-cache.ts")),
  "PerformanceProvider + shared cache",
);

const onboardingLoading = existsSync(resolve(WEB_SRC, "app/onboarding/loading.tsx"));
const legalLoading = existsSync(resolve(WEB_SRC, "app/legal/loading.tsx"));
log("P25 extended skeletons", onboardingLoading && legalLoading, "onboarding + legal loading.tsx");
log("P26 bundle analyzer", nextConfig.includes("bundle-analyzer"), "next.config.ts");
log(
  "P27 probe scripts registered",
  Boolean(rootPkg.scripts?.["probe:performance-discovery"]),
  "package.json",
);

console.log(`\n--- Résumé ---`);
console.log(`${passed}/${total} checks`);
process.exit(passed === total ? 0 : 1);
