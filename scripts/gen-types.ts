/**
 * Régénère packages/database/src/types/index.ts depuis Supabase linked (UTF-8).
 * Usage: npx tsx scripts/gen-types.ts
 */
import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");
const out = resolve(ROOT, "packages/database/src/types/index.ts");

const raw = execSync("npx supabase gen types typescript --linked", {
  cwd: ROOT,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

writeFileSync(out, raw.replace(/^\uFEFF/, ""), "utf8");
console.log(`Types écrits → ${out} (${raw.split("\n").length} lignes)`);
