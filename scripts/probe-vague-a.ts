/**
 * Certification Vague A++ — sécurité admin, wallet, notifications, navigation.
 * Usage: npx tsx scripts/probe-vague-a.ts
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const ROOT = resolve(__dirname, "..");
const envPath = resolve(ROOT, "apps/web/.env.local");

type Check = { name: string; ok: boolean; detail: string };

const checks: Check[] = [];
const log = (name: string, ok: boolean, detail: string) => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name} — ${detail}`);
};

function loadEnv() {
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1]!.trim()] = m[2]!.trim().replace(/^["']|["']$/g, "");
  }
}

function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

function staticChecks() {
  const adminActions = read("apps/web/src/features/admin/actions/admin.actions.ts");
  log(
    "A1 admin.actions verifyAdmin",
    adminActions.includes("verifyAdminForAction()") &&
      adminActions.includes("adminVerified: true"),
    "guard + adminVerified sur client service role",
  );

  const middleware = read("apps/web/src/middleware.ts");
  log(
    "A1 middleware admin guard",
    middleware.includes("isAdminRoute") && middleware.includes('rpc("is_admin"'),
    "is_admin vérifié sur /admin/*",
  );

  const listenerHomeSources = [
    "apps/web/src/features/listener/components/HomepageContentSections.tsx",
    "apps/web/src/features/listener/components/DiscoveriesSection.tsx",
    "apps/web/src/features/listener/components/SearchResultRows.tsx",
  ]
    .map(read)
    .join("\n");
  log(
    "A3 homepage artist links",
    listenerHomeSources.includes("/listen/artist/") &&
      listenerHomeSources.includes("/listen/album/") &&
      listenerHomeSources.includes("/library/playlist/"),
    "artistes, albums, playlists",
  );

  const landing = read("apps/web/src/components/landing/LandingFooter.tsx");
  log(
    "A3 landing role=artist",
    landing.includes("role=artist") && !landing.includes("role=creator"),
    "inscription créateur",
  );

  const nextConfig = read("apps/web/next.config.ts");
  log(
    "A6 /explorer redirect",
    nextConfig.includes('source: "/explorer"') && nextConfig.includes('destination: "/search"'),
    "redirect vers /search",
  );

  const envExample = existsSync(resolve(ROOT, ".env.example"))
    ? read(".env.example")
    : "";
  log(
    "A5 BYPASS_AUTH documented",
    envExample.includes("BYPASS_AUTH"),
    ".env.example mentionne BYPASS_AUTH",
  );

  const walletService = read("packages/api/src/wallet/wallet.service.ts");
  log(
    "A2 wallet.service topup bloqué",
    walletService.includes("throw new WalletError") &&
      walletService.includes("Recharge indisponible en direct"),
    "topupWallet() refuse le crédit direct",
  );

  const tipsActions = read("apps/web/src/features/shared/actions/tips.actions.ts");
  const beatsActions = read("apps/web/src/features/listener/beats/beats.actions.ts");
  log(
    "A1 server actions session guard",
    tipsActions.includes('if (!user) return { error: "Connexion requise." }') &&
      beatsActions.includes('if (!user) return { error: "Connexion requise." }'),
    "tips + beats vérifient getUser()",
  );

  const adminLayout = read("apps/web/src/app/(admin)/layout.tsx");
  log(
    "A1 admin layout requireAdmin",
    adminLayout.includes("requireAdmin()"),
    "layout (admin) protège toutes les pages",
  );
}

async function liveChecks() {
  loadEnv();
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!URL || !ANON) {
    log("live env", false, "NEXT_PUBLIC_SUPABASE_URL ou ANON_KEY manquant dans .env.local");
    return;
  }

  const listener = createClient(URL, ANON, { auth: { persistSession: false } });
  const { error: signInErr } = await listener.auth.signInWithPassword({
    email: "s13b-playwright-listener@sonafrik.test",
    password: "S13BCert2026!",
  });
  if (signInErr) {
    log("auth listener test", false, signInErr.message);
    return;
  }

  const { error: topupErr } = await listener.rpc("topup_wallet", {
    p_amount_gnf: 5000,
    p_payment_method: "internal",
    p_payment_reference: null,
    p_description: "probe",
  });
  log(
    "A2 topup_wallet authenticated",
    !!topupErr,
    topupErr?.message ?? "FAIL: crédit autorisé sans paiement",
  );

  const { data: sess } = await listener.auth.getSession();
  const token = sess.session?.access_token;
  const edgeRes = await fetch(`${URL}/functions/v1/wallet-topup`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: ANON,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amountGnf: 5000, paymentMethod: "wave", paymentReference: "probe" }),
  });
  const edgeBody = (await edgeRes.json()) as { error?: string };
  log(
    "A2 edge wallet-topup",
    (edgeRes.status === 403 || edgeRes.status === 423) && edgeBody.error === "topup_disabled",
    `status=${edgeRes.status} error=${edgeBody.error ?? "?"}`,
  );

  const { error: confirmErr } = await listener.rpc("confirm_payment_intent", {
    p_intent_id: "00000000-0000-0000-0000-000000000001",
    p_provider_ref: "probe-forbidden",
  });
  log(
    "A2 confirm_payment_intent authenticated",
    !!confirmErr,
    confirmErr?.message ?? "FAIL: confirmation paiement accessible",
  );

  const { data: unread, error: unreadErr } = await listener.rpc("count_unread_notifications");
  log(
    "A4 count_unread_notifications",
    !unreadErr && typeof unread === "number",
    unreadErr?.message ?? `count=${unread}`,
  );

  const { error: markAllErr } = await listener.rpc("mark_all_notifications_read");
  log(
    "A4 mark_all_notifications_read",
    !markAllErr,
    markAllErr?.message ?? "ok",
  );

  const { data: listenerAdmin } = await listener.rpc("is_admin", {
    p_user_id: (await listener.auth.getUser()).data.user!.id,
  });
  log("A1 listener not admin", listenerAdmin === false, String(listenerAdmin));
}

async function main() {
  console.log("=== Vague A++ — checks statiques ===\n");
  staticChecks();
  console.log("\n=== Vague A++ — checks live Supabase ===\n");
  await liveChecks();

  const passed = checks.filter((c) => c.ok).length;
  console.log(`\n${passed}/${checks.length} checks Vague A++`);
  process.exitCode = passed === checks.length ? 0 : 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
