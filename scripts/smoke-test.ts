/**
 * SONAFRIK — Smoke Test
 * Usage : npx tsx scripts/smoke-test.ts
 * Pré-requis : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans l'environnement.
 *
 * Vérifie les flux critiques sans framework de test.
 * Exit code 1 si au moins un check échoue.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Variables d'environnement manquantes : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requises.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check(name: string, fn: () => Promise<unknown>): Promise<boolean> {
  try {
    await fn();
    console.log(`✅ ${name}`);
    return true;
  } catch (err) {
    console.error(`❌ ${name} :`, err instanceof Error ? err.message : String(err));
    return false;
  }
}

async function main() {
  console.log("🔍 SONAFRIK Smoke Test — démarrage…\n");
  const results: boolean[] = [];

  // 1. Genres
  results.push(await check("Genres : COUNT >= 14", async () => {
    const { count, error } = await supabase.from("genres").select("*", { count: "exact", head: true });
    if (error) throw new Error(error.message);
    if ((count ?? 0) < 14) throw new Error(`Seulement ${count} genres (attendu >= 14)`);
  }));

  // 2. Morceaux publiés
  results.push(await check("Morceaux publiés : COUNT >= 30", async () => {
    const { count, error } = await supabase
      .from("tracks")
      .select("*", { count: "exact", head: true })
      .eq("publication_status", "published");
    if (error) throw new Error(error.message);
    if ((count ?? 0) < 30) throw new Error(`Seulement ${count} morceaux publiés (attendu >= 30)`);
  }));

  // 3. Sessions de streaming
  results.push(await check("Sessions de streaming : COUNT >= 5000", async () => {
    const { count, error } = await supabase.from("stream_sessions").select("*", { count: "exact", head: true });
    if (error) throw new Error(error.message);
    if ((count ?? 0) < 5000) throw new Error(`Seulement ${count} sessions (attendu >= 5000)`);
  }));

  // 4. get_trending_tracks RPC
  results.push(await check("RPC get_trending_tracks() → tableau non vide", async () => {
    const { data, error } = await supabase.rpc("get_trending_tracks", { p_limit: 5 });
    if (error) throw new Error(error.message);
    if (!Array.isArray(data) || data.length === 0) throw new Error("Tableau vide ou format incorrect");
  }));

  // 5. Wallets accessibles (service_role)
  results.push(await check("Wallets : accessibles via service_role", async () => {
    const { count, error } = await supabase.from("wallets").select("*", { count: "exact", head: true });
    if (error) throw new Error(error.message);
    if ((count ?? 0) === 0) throw new Error("Aucun wallet trouvé — vérifiez les seeds");
  }));

  // 6. Artistes vérifiés
  results.push(await check("Artistes vérifiés : COUNT >= 5", async () => {
    const { count, error } = await supabase
      .from("artist_profiles")
      .select("*", { count: "exact", head: true })
      .eq("verified", true);
    if (error) throw new Error(error.message);
    if ((count ?? 0) < 5) throw new Error(`Seulement ${count} artistes vérifiés (attendu >= 5)`);
  }));

  // 7. expire_stale_payment_intents
  results.push(await check("RPC expire_stale_payment_intents() → retourne un entier", async () => {
    const { data, error } = await supabase.rpc("expire_stale_payment_intents");
    if (error) throw new Error(error.message);
    if (typeof data !== "number") throw new Error(`Type inattendu : ${typeof data}`);
  }));

  // 8. send_tip avec UUID invalide → raise exception
  results.push(await check("RPC send_tip(invalid-uuid) → exception correcte", async () => {
    const { error } = await supabase.rpc("send_tip", {
      p_receiver_id: "00000000-0000-0000-0000-000000000000",
      p_amount_gnf:  3000,
    });
    if (!error) throw new Error("Devrait échouer avec un UUID inexistant");
    // On accepte toute erreur (receiver inexistant, rate limit, etc.)
  }));

  console.log(`\n${"─".repeat(40)}`);
  const passed = results.filter(Boolean).length;
  const failed = results.length - passed;
  console.log(`Résultats : ${passed}/${results.length} checks passés`);
  if (failed > 0) {
    console.error(`⚠️  ${failed} check(s) échoué(s)`);
    process.exitCode = 1;
  } else {
    console.log("🚀 Tous les checks sont verts — prêt pour le lancement !");
  }
}

main().catch((err) => {
  console.error("Erreur fatale :", err);
  process.exitCode = 1;
});
