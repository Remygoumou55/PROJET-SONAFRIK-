import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const adminCss = resolve(ROOT, "apps/web/src/app/styles/admin.css");
const adminDir = resolve(ROOT, "apps/web/src/app/styles/admin");

const lines = readFileSync(adminCss, "utf8").split(/\r?\n/);
const splits = [
  { name: "layout-shell.css", start: 0, end: 719 },
  { name: "shared-components.css", start: 720, end: 1354 },
  { name: "revenue-modules.css", start: 1355, end: lines.length },
];

mkdirSync(adminDir, { recursive: true });
for (const s of splits) {
  const body = lines.slice(s.start, s.end).join("\n").trimEnd() + "\n";
  writeFileSync(resolve(adminDir, s.name), body);
  console.log(`${s.name}: ${body.split("\n").length} lines`);
}

writeFileSync(
  adminCss,
  [
    "/* Registre admin — modules découpés (Vague H) */",
    '@import "./admin/layout-shell.css";',
    '@import "./admin/shared-components.css";',
    '@import "./admin/revenue-modules.css";',
    "",
  ].join("\n"),
);

console.log("admin.css barrel updated");
