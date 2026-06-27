import { existsSync } from "node:fs";
import { join } from "node:path";

const nextDir = join(import.meta.dirname, "..", ".next");
const manifestPath = join(nextDir, "routes-manifest.json");

if (existsSync(nextDir) && !existsSync(manifestPath)) {
  console.warn(
    "\n⚠️  .next corrompu (routes-manifest.json absent).\n" +
      "   Cause fréquente : pnpm build pendant que pnpm dev tourne.\n" +
      "   → Arrête le dev, puis : pnpm dev:clean\n",
  );
  process.exit(1);
}
