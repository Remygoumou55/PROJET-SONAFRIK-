/**
 * One-shot Scenario 5 responsive audit — NOT part of app codebase.
 * Run: node docs/publication-catalog/_runtime-s5-audit.mjs
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
const REPORT_PATH = path.join(__dirname, "SCENARIO_5_RESPONSIVE_CERTIFICATION.md");

const PAGES = [
  { path: "/creator/catalog/tracks", slug: "tracks", openWizard: false },
  {
    path: "/creator/catalog/tracks/new",
    slug: "tracks-new",
    openWizard: true,
    wizardSelector: 'button[aria-label="Publier un nouveau morceau"]',
  },
  { path: "/creator/catalog/releases", slug: "releases", openWizard: false },
];

const VIEWPORTS = [
  { id: "desktop", label: "Desktop (1920×1080)", width: 1920, height: 1080 },
  { id: "laptop", label: "Laptop (1440×900)", width: 1440, height: 900 },
  { id: "tablet-portrait", label: "Tablet Portrait (768×1024)", width: 768, height: 1024 },
  { id: "tablet-landscape", label: "Tablet Landscape (1024×768)", width: 1024, height: 768 },
  { id: "mobile-large", label: "Mobile Large (430×932)", width: 430, height: 932 },
  { id: "mobile-standard", label: "Mobile Standard (390×844)", width: 390, height: 844 },
  { id: "mobile-small", label: "Mobile Small (320×568)", width: 320, height: 568 },
];

async function collectLayoutIssues(page) {
  return page.evaluate(() => {
    const issues = [];
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
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
      "button, a, input, select, textarea, [role='button'], .pub-wiz, .pub-home, .pub-wiz__card, .pub-home-hero, [data-slot='card']";
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
      if (r.bottom > vh + 2 && r.top < vh && r.height > vh * 0.5) {
        /* tall content ok */
      }
    }

    for (const btn of document.querySelectorAll("button:not([disabled]), a[href], input, select, textarea")) {
      const style = getComputedStyle(btn);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const r = btn.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && (r.width < 10 || r.height < 10)) {
        issues.push({
          type: "control-too-small",
          component: btn.getAttribute("aria-label") || btn.textContent?.trim().slice(0, 40) || btn.tagName,
          detail: `${Math.round(r.width)}×${Math.round(r.height)}px`,
        });
      }
    }

    for (const img of document.querySelectorAll("img")) {
      const r = img.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || !img.naturalWidth) continue;
      const displayed = r.width / r.height;
      const natural = img.naturalWidth / img.naturalHeight;
      if (Math.abs(displayed - natural) / natural > 0.35 && r.width > 40) {
        issues.push({
          type: "image-distortion",
          component: img.alt || img.src.slice(-48),
          detail: `display ratio ${displayed.toFixed(2)} vs natural ${natural.toFixed(2)}`,
        });
      }
    }

    return issues.slice(0, 8);
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const results = [];
  const consoleIssues = [];

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
      const url = `${BASE}${pg.path}`;
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => undefined);
      await page.waitForTimeout(800);

      const finalUrl = page.url();
      const status = response?.status() ?? 0;
      const layoutIssues = await collectLayoutIssues(page);

      if (pg.openWizard) {
        const btn = page.locator(pg.wizardSelector).first();
        if (await btn.isVisible().catch(() => false)) {
          await btn.click();
          await page.waitForTimeout(600);
          const wizardIssues = await collectLayoutIssues(page);
          for (const wi of wizardIssues) {
            wi.component = `wizard:${wi.component}`;
            layoutIssues.push(wi);
          }
        } else {
          layoutIssues.push({
            type: "wizard-unreachable",
            component: "PublicationWizard",
            detail: "Bouton wizard non visible",
          });
        }
      }

      const hydrationHits = [...logs.errors, ...logs.pageErrors].filter((t) =>
        /hydration|Hydration/i.test(t),
      );
      const filteredErrors = logs.errors.filter(
        (t) => !/favicon|404.*icon|Failed to load resource.*404/i.test(t),
      );
      const filteredWarns = logs.warns.filter((t) => !/DevTools/i.test(t));

      const anomalies = [...layoutIssues];
      if (status >= 500) anomalies.push({ type: "http-500", component: pg.path, detail: String(status) });
      if (status === 401 || status === 403)
        anomalies.push({ type: `http-${status}`, component: pg.path, detail: finalUrl });
      if (/auth\/connexion|onboarding/.test(finalUrl) && !pg.path.includes("auth")) {
        anomalies.push({ type: "auth-redirect", component: pg.path, detail: finalUrl });
      }
      if (filteredErrors.length)
        anomalies.push({ type: "console-error", component: "console", detail: filteredErrors.slice(0, 3).join(" | ") });
      if (filteredWarns.length)
        anomalies.push({ type: "console-warn", component: "console", detail: filteredWarns.slice(0, 3).join(" | ") });
      if (hydrationHits.length)
        anomalies.push({ type: "hydration-error", component: "react", detail: hydrationHits.join(" | ") });
      if (logs.pageErrors.length)
        anomalies.push({ type: "page-error", component: "react", detail: logs.pageErrors.slice(0, 2).join(" | ") });

      const pass = anomalies.length === 0;
      if (!pass) {
        const shot = path.join(OUT_DIR, `${key}.png`);
        await page.screenshot({ path: shot, fullPage: true });
      }

      results.push({
        key,
        page: pg.path,
        pageSlug: pg.slug,
        viewport: vp.label,
        viewportId: vp.id,
        pass,
        status,
        finalUrl,
        anomalies,
        screenshot: pass ? null : `${key}.png`,
      });

      if (filteredErrors.length || hydrationHits.length || logs.pageErrors.length) {
        consoleIssues.push({ key, errors: filteredErrors, hydrationHits, pageErrors: logs.pageErrors });
      }

      await page.close();
    }
  }

  await browser.close();

  const pageResults = {};
  const vpResults = {};
  for (const r of results) {
    pageResults[r.pageSlug] = pageResults[r.pageSlug] ?? { pass: true, fails: [] };
    vpResults[r.viewportId] = vpResults[r.viewportId] ?? { pass: true, fails: [] };
    if (!r.pass) {
      pageResults[r.pageSlug].pass = false;
      pageResults[r.pageSlug].fails.push(r.key);
      vpResults[r.viewportId].pass = false;
      vpResults[r.viewportId].fails.push(r.key);
    }
  }

  const allPass = results.every((r) => r.pass);
  const failed = results.filter((r) => !r.pass);

  let md = `# SCENARIO 5 — OFFICIAL RESPONSIVE RUNTIME CERTIFICATION\n\n`;
  md += `**Date :** ${new Date().toISOString().slice(0, 10)}  \n`;
  md += `**Base URL :** ${BASE}  \n`;
  md += `**Mode :** BYPASS auth local (.env.local)  \n\n`;

  md += `## 1. Viewports testés\n\n`;
  for (const v of VIEWPORTS) md += `- ${v.label}\n`;

  md += `\n## 2. Pages testées\n\n`;
  for (const p of PAGES) md += `- \`${p.path}\`${p.openWizard ? " (+ wizard ouvert)" : ""}\n`;

  md += `\n## 3. Anomalies Responsive détectées\n\n`;
  if (failed.length === 0) {
    md += `*Aucune.*\n`;
  } else {
    for (const f of failed) {
      for (const a of f.anomalies) {
        md += `- **${f.viewport}** · \`${f.page}\` · \`${a.component}\` · ${a.type} — ${a.detail}\n`;
      }
    }
  }

  md += `\n## 4. Captures anomalies\n\n`;
  if (failed.length === 0) {
    md += `*Aucune capture (100% PASS).*\n`;
  } else {
    for (const f of failed) {
      md += `- \`responsive-screenshots/${f.screenshot}\` — ${f.key}\n`;
    }
  }

  md += `\n## 5. Résultat par viewport\n\n| Viewport | Résultat |\n|----------|----------|\n`;
  for (const v of VIEWPORTS) {
    md += `| ${v.label} | **${vpResults[v.id].pass ? "PASS" : "FAIL"}** |\n`;
  }

  md += `\n## 6. Résultat par page\n\n| Page | Résultat |\n|------|----------|\n`;
  for (const p of PAGES) {
    md += `| \`${p.path}\` | **${pageResults[p.slug].pass ? "PASS" : "FAIL"}** |\n`;
  }

  md += `\n## 7. Console (session complète)\n\n`;
  md += `- console.error bloquants : **${consoleIssues.length ? "FAIL" : "0"}**\n`;
  md += `- console.warn bloquants : **${results.some((r) => r.anomalies.some((a) => a.type === "console-warn")) ? "voir anomalies" : "0"}**\n`;
  md += `- Hydration errors : **${results.some((r) => r.anomalies.some((a) => a.type === "hydration-error")) ? "FAIL" : "0"}**\n`;

  md += `\n## 8. Conclusion\n\n`;
  if (allPass) {
    md += `**SCENARIO 5 — RESPONSIVE CERTIFIED — PASS**\n\n`;
    md += `Aucune anomalie responsive, layout ou console bloquante détectée sur les 21 combinaisons page×viewport (3 pages × 7 viewports, wizard inclus sur \`/tracks/new\`).\n`;
  } else {
    md += `**SCENARIO 5 — RESPONSIVE CERTIFICATION REFUSED — FAIL**\n\n`;
    md += `${failed.length} combinaison(s) en échec sur ${results.length}.\n`;
  }

  md += `\n---\n\n## DÉCISION\n\n\`\`\`\n`;
  if (allPass) {
    md += `STATUS : SCENARIO 5 RESPONSIVE CERTIFIED\nRESULT : PASS\n\`\`\`\n`;
  } else {
    md += `STATUS : SCENARIO 5 RESPONSIVE CERTIFICATION REFUSED\nRESULT : FAIL\n\`\`\`\n`;
  }

  fs.writeFileSync(REPORT_PATH, md);
  fs.writeFileSync(path.join(__dirname, "_runtime-s5-results.json"), JSON.stringify({ allPass, results }, null, 2));

  console.log(allPass ? "ALL PASS" : `FAIL (${failed.length}/${results.length})`);
  console.log(`Report: ${REPORT_PATH}`);
  process.exit(allPass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
