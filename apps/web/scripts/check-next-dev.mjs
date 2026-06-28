import { existsSync } from "node:fs";
import { join } from "node:path";

const nextDir = join(import.meta.dirname, "..", ".next");
const manifestPath = join(nextDir, "routes-manifest.json");
const buildIdPath = join(nextDir, "BUILD_ID");

function fail(message) {
  console.warn(message);
  process.exit(1);
}

if (!existsSync(nextDir)) {
  process.exit(0);
}

if (existsSync(buildIdPath)) {
  fail(
    "\n⚠️  .next contient un build PRODUCTION (BUILD_ID présent).\n" +
      "   Cause fréquente : `pnpm build` lancé pendant ou avant `pnpm dev`.\n" +
      "   → Arrête le dev, puis : pnpm dev:clean\n",
  );
}

if (!existsSync(manifestPath)) {
  fail(
    "\n⚠️  .next corrompu (routes-manifest.json absent).\n" +
      "   Cause fréquente : build + dev en parallèle, ou cache webpack incomplet.\n" +
      "   → Arrête le dev, puis : pnpm dev:clean\n",
  );
}
