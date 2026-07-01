/**
 * Regénère listen-home-bundle.css depuis les modules existants.
 * Usage: node scripts/split-listen-home-css.mjs
 *
 * Note: le monolithe listen-home.css a été supprimé (Vague G).
 * Éditer les fichiers dans apps/web/src/app/styles/listen-home/*.css
 */
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "apps/web/src/app/styles/listen-home");
const modules = fs
  .readdirSync(outDir)
  .filter((f) => f.endsWith(".css"))
  .sort();

const bundle = `/* listen-home — bundle modulaire (scripts/split-listen-home-css.mjs) */
${modules.map((f) => `@import "./listen-home/${f}";`).join("\n")}
`;
fs.writeFileSync(
  path.join(root, "apps/web/src/app/styles/listen-home-bundle.css"),
  bundle,
  "utf8",
);
console.log(`Bundle ${modules.length} modules → listen-home-bundle.css`);
