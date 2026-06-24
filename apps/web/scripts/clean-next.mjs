import { rmSync } from "node:fs";
import { join } from "node:path";

const nextDir = join(import.meta.dirname, "..", ".next");
rmSync(nextDir, { recursive: true, force: true });
console.log("Removed", nextDir);
