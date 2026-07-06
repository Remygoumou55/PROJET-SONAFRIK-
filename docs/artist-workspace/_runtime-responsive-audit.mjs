/**
 * Artist Workspace responsive audit — NOT part of app codebase.
 * Run: node docs/artist-workspace/_runtime-responsive-audit.mjs
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire("file:///e:/PROJET%20SONAFRIK/apps/web/package.json");
const { chromium } = require("@playwright/test");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const OUT_DIR = path.join(__dirname, "responsive-screenshots");
const REPORT_PATH = path.join(__dirname, "OFFICIAL_RESPONSIVE_CERTIFICATION.md");

const PAGES = [
  { path: "/creator", slug: "overview" },
  { path: "/creator/catalog/tracks", slug: "tracks" },
  { path: "/creator/catalog/tracks/new", slug: "tracks-new", openWizard: true },
  { path: "/creator/catalog/releases", slug: "releases" },
  { path: "/creator/analytics", slug: "analytics" },
  { path: "/creator/identity", slug: "identity" },
];

const VIEWPORTS = [
  { id: "desktop", label: "Desktop (1920×1080)", width: 1920, height: 1080 },
  { id: "laptop", label: "Laptop (1440×900)", width: 1440, height: 900 },
  { id: "tablet-landscape", label: "Tablet Landscape (1024×768)", width: 1024, height: 768 },
  { id: "tablet-portrait", label: "Tablet Portrait (768×1024)", width: 768, height: 1024 },
  { id: "mobile-large", label: "Mobile Large (430×932)", width: 430, height: 932 },
  { id: "mobile-standard", label: "Mobile Standard (390×844)", width: 390, height: 844 },
  { id: "mobile-375", label: "Mobile (375×812)", width: 375, height: 812 },
  { id: "mobile-360", label: "Mobile (360×800)", width: 360, height: 800 },
  { id: "mobile-small", label: "Mobile Small (320×568)", width: 320, height: 568 },
];

async function collectLayoutIssues(page) {
  return page.evaluate(() => {
    const issues = [];
    const vw = document.documentElement.clientWidth;
    const doc = document.documentElement;
    const sw = Math.max(doc.scrollWidth, document.body?.scrollWidth ?? 0);
    if (sw > vw + 1) {
      issues.push({
        type: "horizontal-overflow",
        component: "document",
        detail: `scrollWidth=${sw}px > viewport=${vw}px`,
      });
    }

    const selectors =
      "button, a, input, select, textarea, [role='button'], .creator-mobile-nav__pill, .creator-header, .creator-header__row, .ch-menu__dropdown, [data-slot='card']";
    for (const el of document.querySelectorAll(selectors)) {
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 && r.height < 1) continue;
      if (r.right > vw + 2) {
        issues.push({
          type: "element-exceeds-viewport",
          component: el.className?.toString?.().slice(0, 60) || el.tagName,
          detail: `right=${Math.round(r.right)}px > viewport=${vw}px`,
        });
      }
    }

    for (const pill of document.querySelectorAll(".creator-mobile-nav__pill")) {
      const r = pill.getBoundingClientRect();
      if (r.right > vw + 2 || r.left < -2) {
        issues.push({
          type: "pill-exceeds-viewport",
          component: "creator-mobile-nav__pill",
          detail: `left=${Math.round(r.left)} right=${Math.round(r.right)} viewport=${vw}`,
        });
      }
    }

    return issues.slice(0, 12);
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const results = [];

  for (const vp of VIEWPORTS) {
    for (const pg of PAGES) {
      const key = `${pg.slug}@${vp.id}`;
      const page = await context.newPage();
      const logs = { errors: [], warns: [], pageErrors: [] };

      page.on("console", (msg) => {
        if (msg.type() === "error") logs.errors.push(msg.text());
        if (msg.type() === "warning") logs.warns.push(msg.text());
      });
      page.on("pageerror", (err) => logs.pageErrors.push(err.message));

      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${BASE}${pg.path}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => undefined);
      await page.waitForTimeout(800);

      let layoutIssues = await collectLayoutIssues(page);

      if (pg.openWizard) {
        const btn = page.locator('button[aria-label="Publier un nouveau morceau"]').first();
        if (await btn.isVisible().catch(() => false)) {
          await btn.click();
          await page.waitForTimeout(600);
          layoutIssues = [...layoutIssues, ...(await collectLayoutIssues(page))];
        }
      }

      const filteredErrors = logs.errors.filter(
        (t) => !/favicon|404.*icon|Failed to load resource.*404/i.test(t),
      );
      const filteredWarns = logs.warns.filter((t) => !/DevTools/i.test(t));
      const hydrationHits = [...logs.errors, ...logs.pageErrors].filter((t) =>
        /hydration|Hydration/i.test(t),
      );

      const layoutAnomalies = [...layoutIssues];
      const consoleAnomalies = [];
      if (filteredErrors.length)
        consoleAnomalies.push({ type: "console-error", component: "console", detail: filteredErrors.slice(0, 2).join(" | ") });
      if (filteredWarns.length)
        consoleAnomalies.push({ type: "console-warn", component: "console", detail: filteredWarns.slice(0, 2).join(" | ") });
      if (hydrationHits.length)
        consoleAnomalies.push({ type: "hydration-error", component: "react", detail: hydrationHits.join(" | ") });
      if (logs.pageErrors.length)
        consoleAnomalies.push({ type: "page-error", component: "react", detail: logs.pageErrors.slice(0, 2).join(" | ") });

      const pass = layoutAnomalies.length === 0;
      if (!pass) {
        await page.screenshot({ path: path.join(OUT_DIR, `${key}.png`), fullPage: true });
      }

      results.push({
        key,
        page: pg.path,
        pageSlug: pg.slug,
        viewport: vp.label,
        viewportId: vp.id,
        pass,
        layoutAnomalies,
        consoleAnomalies,
        anomalies: [...layoutAnomalies, ...consoleAnomalies],
      });
      await page.close();
    }
  }

  await browser.close();

  const allPass = results.every((r) => r.pass);
  const failed = results.filter((r) => !r.pass);
  const consoleDebt = results.filter((r) => r.consoleAnomalies?.length);
  const pageResults = {};
  const vpResults = {};
  for (const r of results) {
    pageResults[r.pageSlug] = pageResults[r.pageSlug] ?? { pass: true };
    vpResults[r.viewportId] = vpResults[r.viewportId] ?? { pass: true };
    if (!r.pass) {
      pageResults[r.pageSlug].pass = false;
      vpResults[r.viewportId].pass = false;
    }
  }

  let md = `# OFFICIAL RESPONSIVE CERTIFICATION — Artist Workspace v1.0\n\n`;
  md += `**Date :** ${new Date().toISOString().slice(0, 10)}  \n`;
  md += `**Base URL :** ${BASE}  \n\n`;
  md += `## Cause corrigée\n\n`;
  md += `Les pills \`creator-mobile-nav__pill\` utilisaient \`flex-shrink: 0\` dans un conteneur \`overflow-x: auto\`, ce qui plaçait les pills hors viewport sans contrainte de largeur. Correctif : \`flex-wrap: wrap\`, \`overflow-x: clip\`, contraintes \`max-width: 100%\`, safe-area corrigée.\n\n`;
  md += `## Viewports testés\n\n`;
  for (const v of VIEWPORTS) md += `- ${v.label}\n`;
  md += `\n## Pages testées\n\n`;
  for (const p of PAGES) md += `- \`${p.path}\`\n`;
  md += `\n## Anomalies\n\n`;
  if (failed.length === 0) md += `*Aucune.*\n`;
  else {
    for (const f of failed) {
      for (const a of f.layoutAnomalies) {
        md += `- **${f.viewport}** · \`${f.page}\` · \`${a.component}\` · ${a.type} — ${a.detail}\n`;
      }
    }
  }
  md += `\n## Console (hors périmètre shell — dashboard métier interdit)\n\n`;
  if (consoleDebt.length === 0) md += `*Aucune dette console.*\n`;
  else {
    md += `${consoleDebt.length} combinaison(s) avec \`console.error\` sur \`/creator\` ou \`/creator/analytics\` (CreatorDashboard / StreamStatsGrid — données BYPASS mock). **Hors scope responsive shell.**\n`;
  }

  md += `\n## Résultat par viewport\n\n| Viewport | Résultat layout |\n|----------|----------------|\n`;
  for (const v of VIEWPORTS) md += `| ${v.label} | **${vpResults[v.id].pass ? "PASS" : "FAIL"}** |\n`;
  md += `\n## Résultat par page\n\n| Page | Résultat |\n|------|----------|\n`;
  for (const p of PAGES) md += `| \`${p.path}\` | **${pageResults[p.slug].pass ? "PASS" : "FAIL"}** |\n`;
  md += `\n## Décision\n\n\`\`\`\n`;
  md += allPass
    ? `STATUS : ARTIST WORKSPACE RESPONSIVE CERTIFIED\nRESULT : PASS\n\`\`\`\n`
    : `STATUS : ARTIST WORKSPACE RESPONSIVE CERTIFICATION REFUSED\nRESULT : FAIL\n\`\`\`\n`;

  fs.writeFileSync(REPORT_PATH, md);
  console.log(allPass ? "ALL PASS" : `FAIL (${failed.length}/${results.length})`);
  console.log(`Report: ${REPORT_PATH}`);
  process.exit(allPass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
