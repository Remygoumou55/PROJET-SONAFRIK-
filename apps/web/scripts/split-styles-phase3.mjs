/**
 * Audit 360 phase 3 — split CSS par domaine (one-shot idempotent).
 * Usage: node apps/web/scripts/split-styles-phase3.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stylesDir = path.join(__dirname, "../src/app/styles");
const enterpriseDir = path.join(stylesDir, "creator/enterprise");

function sliceFile(srcPath, slices) {
  const lines = fs.readFileSync(srcPath, "utf8").split("\n");
  for (const { file, start, end } of slices) {
    const chunk = lines.slice(start, end).join("\n").trim();
    if (chunk) {
      fs.writeFileSync(path.join(enterpriseDir, file), `${chunk}\n`, "utf8");
    }
  }
}

function splitAtMarker(srcPath, destPath, markerRegex) {
  const lines = fs.readFileSync(srcPath, "utf8").split("\n");
  const idx = lines.findIndex((l) => markerRegex.test(l));
  if (idx === -1) throw new Error(`Marker not found in ${srcPath}`);
  fs.writeFileSync(srcPath, `${lines.slice(0, idx).join("\n").trim()}\n`, "utf8");
  fs.writeFileSync(destPath, `${lines.slice(idx).join("\n").trim()}\n`, "utf8");
}

// landing.css → identity.css @ "Identity / Profile"
splitAtMarker(
  path.join(stylesDir, "landing.css"),
  path.join(stylesDir, "identity.css"),
  /^\/\* ── Identity \/ Profile/,
);

// performance.css → identity-account.css @ identity-profile-completion
splitAtMarker(
  path.join(stylesDir, "performance.css"),
  path.join(stylesDir, "identity-account.css"),
  /^\.identity-profile-completion__value/,
);

// enterprise.css → 6 modules
fs.mkdirSync(enterpriseDir, { recursive: true });
const entLines = fs.readFileSync(path.join(stylesDir, "creator/enterprise.css"), "utf8").split("\n");

function findLine(pattern) {
  const idx = entLines.findIndex((l) => pattern.test(l));
  if (idx === -1) throw new Error(`Enterprise marker not found: ${pattern}`);
  return idx;
}

const markers = [
  { file: "base.css", start: 0, end: findLine(/^\/\* ─── Hero vitrine/) },
  { file: "vitrine.css", start: findLine(/^\/\* ─── Hero vitrine/), end: findLine(/^\.dash-glance__grid/) },
  { file: "glance.css", start: findLine(/^\.dash-glance__grid/), end: findLine(/^\.dash-quick-actions__grid/) },
  { file: "actions.css", start: findLine(/^\.dash-quick-actions__grid/), end: findLine(/^\.dash-stats-career__grid/) },
  { file: "stats.css", start: findLine(/^\.dash-stats-career__grid/), end: findLine(/^\.dash-activity,/) },
  { file: "panels.css", start: findLine(/^\.dash-activity,/), end: entLines.length },
];

for (const m of markers) {
  const chunk = entLines.slice(m.start, m.end).join("\n").trim();
  if (chunk) fs.writeFileSync(path.join(enterpriseDir, m.file), `${chunk}\n`, "utf8");
}

fs.unlinkSync(path.join(stylesDir, "creator/enterprise.css"));

// creator.css hub
fs.writeFileSync(
  path.join(stylesDir, "creator.css"),
  [
    '@import "./creator/layout.css";',
    '@import "./creator/hero.css";',
    '@import "./creator/enterprise/base.css";',
    '@import "./creator/enterprise/vitrine.css";',
    '@import "./creator/enterprise/glance.css";',
    '@import "./creator/enterprise/actions.css";',
    '@import "./creator/enterprise/stats.css";',
    '@import "./creator/enterprise/panels.css";',
    '@import "./creator/mobile.css";',
    "",
  ].join("\n"),
  "utf8",
);

// globals.css imports
const globalsPath = path.join(__dirname, "../src/app/globals.css");
let globals = fs.readFileSync(globalsPath, "utf8");
if (!globals.includes("identity.css")) {
  globals = globals.replace(
    '@import "./styles/landing.css";',
    '@import "./styles/landing.css";\n@import "./styles/identity.css";',
  );
}
if (!globals.includes("identity-account.css")) {
  globals = globals.replace(
    '@import "./styles/performance.css";',
    '@import "./styles/performance.css";\n@import "./styles/identity-account.css";',
  );
}
fs.writeFileSync(globalsPath, globals, "utf8");

console.log("Phase 3 CSS split OK");
console.log(
  "enterprise:",
  markers.map((m) => `${m.file}=${m.end - m.start}L`).join(", "),
);
