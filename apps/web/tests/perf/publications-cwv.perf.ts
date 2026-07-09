import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import {
  authenticateArtist,
  openPublicationsLibrary,
  publicationRowCount,
} from "../e2e/publications-e2e-helpers";

/**
 * B3.2 — Capture Core Web Vitals + Runtime + Network sur la route authentifiée
 * `/creator/catalog/tracks` (Mes publications), servie par un serveur `next start`.
 *
 * Métriques via API navigateur natives (aucune dépendance ajoutée) :
 *  - LCP  : PerformanceObserver "largest-contentful-paint" (dernière entrée)
 *  - CLS  : somme "layout-shift" hors hadRecentInput
 *  - FCP  : "first-contentful-paint"
 *  - TTFB : navigation.responseStart
 *  - INP  (proxy lab) : latence d'interaction max via "event" timing
 *  - Long tasks : "longtask" (proxy TBT/blocage main thread)
 *
 * Écrit aussi les cookies d'auth (extra-headers) pour le run Lighthouse authentifié.
 */

const ARTIFACT_DIR = resolve(__dirname, "..", "..", "perf-artifacts");
const ROUTE = "/creator/catalog/tracks";

const PERF_INIT_SCRIPT = `
  window.__perf = { lcp: 0, cls: 0, fcp: 0, ttfb: 0, inp: 0, longTasks: 0, longTaskTotal: 0 };
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__perf.lcp = e.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (_) {}
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (!e.hadRecentInput) window.__perf.cls += e.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch (_) {}
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.name === 'first-contentful-paint') window.__perf.fcp = e.startTime;
      }
    }).observe({ type: 'paint', buffered: true });
  } catch (_) {}
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.duration > window.__perf.inp) window.__perf.inp = e.duration;
      }
    }).observe({ type: 'event', durationThreshold: 16, buffered: true });
  } catch (_) {}
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        window.__perf.longTasks += 1;
        window.__perf.longTaskTotal += e.duration;
      }
    }).observe({ type: 'longtask', buffered: true });
  } catch (_) {}
`;

test("B3.2 — Core Web Vitals + runtime + network (Mes publications authentifié)", async ({
  page,
}) => {
  test.setTimeout(6 * 60 * 1000);
  mkdirSync(ARTIFACT_DIR, { recursive: true });

  await page.addInitScript(PERF_INIT_SCRIPT);
  await authenticateArtist(page);

  // Réseau : compter les requêtes Supabase (rest/rpc/functions) sur le cycle de vie.
  let supabaseRequests = 0;
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("supabase.co") || url.includes("/rest/v1/") || url.includes("/functions/v1/")) {
      supabaseRequests += 1;
    }
  });

  await openPublicationsLibrary(page);
  const rowCount = await publicationRowCount(page);
  expect(rowCount).toBeGreaterThan(0);

  const requestsAfterLoad = supabaseRequests;

  // Exercice interactions (mesure INP proxy + long tasks) : filtre, recherche, pagination.
  const filterPublies = page.getByRole("button", { name: "Publiés" });
  if (await filterPublies.isVisible().catch(() => false)) {
    await filterPublies.click();
    await page.waitForTimeout(600);
  }
  const search = page.getByLabel("Rechercher dans le catalogue");
  if (await search.isVisible().catch(() => false)) {
    await search.click();
    await search.type("a", { delay: 40 });
    await page.waitForTimeout(600);
    await search.fill("");
    await page.waitForTimeout(300);
  }
  const allFilter = page.getByRole("button", { name: "Tous" });
  if (await allFilter.isVisible().catch(() => false)) {
    await allFilter.click();
    await page.waitForTimeout(600);
  }

  const nav = await page.evaluate(() => {
    const n = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    return {
      ttfb: n ? n.responseStart : 0,
      domContentLoaded: n ? n.domContentLoadedEventEnd : 0,
      loadEvent: n ? n.loadEventEnd : 0,
    };
  });

  type PerfMetrics = {
    lcp: number;
    cls: number;
    fcp: number;
    ttfb: number;
    inp: number;
    longTasks: number;
    longTaskTotal: number;
  };
  const perf = await page.evaluate(
    () => (window as unknown as { __perf: PerfMetrics }).__perf,
  );

  const totalRequests = supabaseRequests;

  const result = {
    module: "mes-publications",
    route: ROUTE,
    capturedAt: new Date().toISOString(),
    rowCount,
    coreWebVitals: {
      LCP_ms: Math.round(perf.lcp),
      CLS: Number(perf.cls.toFixed(4)),
      INP_proxy_ms: Math.round(perf.inp),
      FCP_ms: Math.round(perf.fcp),
      TTFB_ms: Math.round(nav.ttfb),
    },
    runtime: {
      longTasks: perf.longTasks,
      longTaskTotalMs: Math.round(perf.longTaskTotal),
      domContentLoadedMs: Math.round(nav.domContentLoaded),
      loadEventMs: Math.round(nav.loadEvent),
    },
    network: {
      supabaseRequestsOnLoad: requestsAfterLoad,
      supabaseRequestsTotal: totalRequests,
    },
    googleThresholds: {
      LCP_good_ms: 2500,
      CLS_good: 0.1,
      INP_good_ms: 200,
      FCP_good_ms: 1800,
      TTFB_good_ms: 800,
    },
  };

  writeFileSync(
    resolve(ARTIFACT_DIR, "cwv-publications.json"),
    JSON.stringify(result, null, 2),
    "utf8",
  );

  // Dump cookies d'auth → extra-headers Lighthouse (route authentifiée).
  const cookies = await page.context().cookies();
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  writeFileSync(
    resolve(ARTIFACT_DIR, "auth-headers.json"),
    JSON.stringify({ Cookie: cookieHeader }, null, 2),
    "utf8",
  );

  console.log("[perf] CWV publications:", JSON.stringify(result.coreWebVitals));
  console.log("[perf] runtime:", JSON.stringify(result.runtime));
  console.log("[perf] network:", JSON.stringify(result.network));
});
