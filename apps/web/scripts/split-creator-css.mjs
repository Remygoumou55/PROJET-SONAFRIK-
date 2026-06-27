import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stylesDir = path.join(__dirname, "../src/app/styles");
const creatorPath = path.join(stylesDir, "creator.css");
const creatorDir = path.join(stylesDir, "creator");

const lines = fs.readFileSync(creatorPath, "utf8").split("\n");

/** Ranges 1-indexed inclusive — CSS mort post-refactor enterprise */
const deadRanges = [
  [886, 1020],
  [1037, 1209],
];

const kept = lines.filter((_, i) => {
  const line = i + 1;
  return !deadRanges.some(([start, end]) => line >= start && line <= end);
});

const markers = [
  { file: "layout.css", pattern: /^\/\* ─── Artist Hero/ },
  { file: "hero.css", pattern: /^\/\* ─── Creator Enterprise Dashboard/ },
  { file: "enterprise.css", pattern: /^\/\* ─── Creator mobile nav/ },
];

const slices = [];
let start = 0;

for (const { file, pattern } of markers) {
  const idx = kept.findIndex((l) => pattern.test(l));
  if (idx === -1) throw new Error(`Marker not found: ${file}`);
  slices.push({ file, start, end: idx });
  start = idx;
}
/** mobile.css = nav base + @media responsive (single file) */
slices.push({ file: "mobile.css", start, end: kept.length });

fs.mkdirSync(creatorDir, { recursive: true });

for (const slice of slices) {
  const chunk = kept.slice(slice.start, slice.end).join("\n").trim();
  if (chunk) {
    fs.writeFileSync(path.join(creatorDir, slice.file), `${chunk}\n`, "utf8");
  }
}

const imports = slices
  .map((s) => s.file)
  .filter((f) => fs.existsSync(path.join(creatorDir, f)))
  .map((f) => `@import "./creator/${f}";`)
  .join("\n");

fs.writeFileSync(creatorPath, `${imports}\n`, "utf8");

console.log(
  "creator.css split:",
  slices.map((s) => `${s.file}=${s.end - s.start}L`).join(", "),
);
console.log(`Removed dead CSS: ${886}-${1020}, ${1037}-${1209}`);
