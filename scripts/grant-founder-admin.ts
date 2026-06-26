/**
 * Accorde le rôle admin au compte REMY (session Live Control courante).
 * Usage: npx tsx scripts/grant-founder-admin.ts
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = resolve(__dirname, "../apps/web/.env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1]!.trim()] = m[2]!.trim().replace(/^["']|["']$/g, "");
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const FOUNDER_IDS = [
  "1d6a93f2-48ed-4532-9779-e78c564887dd", // REMY — session courante (playwright listener)
  "36dac3f8-c58e-4a95-a93a-521f70109b35", // remygoumou55@gmail.com
  "6c24f563-f325-405e-9c14-58eeff18248a", // +2230546508020
];

async function main() {
  const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

  for (const userId of FOUNDER_IDS) {
    const { error } = await admin.rpc("assign_admin_role", { p_user_id: userId });
    if (error) {
      console.error(`❌ ${userId}: ${error.message}`);
      continue;
    }
    const { data: ok } = await admin.rpc("is_admin", { p_user_id: userId });
    console.log(`${ok ? "✅" : "❌"} ${userId} is_admin=${ok}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
