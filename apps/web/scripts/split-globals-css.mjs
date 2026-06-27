import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "../src/app");
const globalsPath = path.join(root, "globals.css");
const lines = fs.readFileSync(globalsPath, "utf8").split("\n");
const stylesDir = path.join(root, "styles");
fs.mkdirSync(stylesDir, { recursive: true });

const slices = [
  ["landing.css", 292, 1038],
  ["performance.css", 1038, 1420],
  ["revenue.css", 1420, 1543],
  ["creator.css", 1543, lines.length],
];

for (const [file, start, end] of slices) {
  fs.writeFileSync(
    path.join(stylesDir, file),
    `${lines.slice(start, end).join("\n")}\n`,
    "utf8",
  );
}

const imports = [
  '@import "./styles/landing.css";',
  '@import "./styles/performance.css";',
  '@import "./styles/revenue.css";',
  '@import "./styles/creator.css";',
].join("\n");

const base = `${lines.slice(0, 292).join("\n")}\n\n${imports}\n`;
fs.writeFileSync(globalsPath, base, "utf8");

console.log(
  "Split OK:",
  slices.map(([file, start, end]) => `${file}=${end - start} lines`).join(", "),
);
