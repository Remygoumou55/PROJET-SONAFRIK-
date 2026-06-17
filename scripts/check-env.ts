/**
 * SONAFRIK — Vérification des variables d'environnement
 * Usage : npx tsx scripts/check-env.ts
 *
 * Vérifie que toutes les variables obligatoires sont définies avant un déploiement.
 * Exit code 1 si une variable obligatoire manque.
 */

interface EnvCheck {
  key:      string;
  required: boolean;
  note?:    string;
}

const CHECKS: EnvCheck[] = [
  // Supabase — OBLIGATOIRES
  { key: "NEXT_PUBLIC_SUPABASE_URL",      required: true },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true },
  { key: "SUPABASE_SERVICE_ROLE_KEY",     required: true, note: "Ne pas exposer côté client" },
  // App — OBLIGATOIRE
  { key: "NEXT_PUBLIC_APP_URL",           required: true, note: "URL stable Vercel (ex: https://sonafrik.vercel.app)" },
  // Monitoring — recommandées
  { key: "NEXT_PUBLIC_SENTRY_DSN",        required: false, note: "Monitoring erreurs — fortement recommandé" },
  // Paiements — recommandées (mode sandbox accepté)
  { key: "ORANGE_MONEY_API_KEY",          required: false, note: "Orange Money Guinée — laisser vide pour sandbox" },
  { key: "MTN_MOMO_SUBSCRIPTION_KEY",     required: false, note: "MTN MoMo — laisser vide pour sandbox" },
  { key: "WAVE_API_KEY",                  required: false, note: "Wave Guinée — laisser vide pour sandbox" },
  { key: "SOUTRA_API_KEY",                required: false, note: "Soutra Money — laisser vide pour sandbox" },
];

function main() {
  console.log("🔐 SONAFRIK — Vérification des variables d'environnement\n");

  let hasError = false;

  for (const { key, required, note } of CHECKS) {
    const value   = process.env[key];
    const defined = value !== undefined && value !== "";

    if (required && !defined) {
      console.error(`❌ ${key.padEnd(40)} MANQUANTE (OBLIGATOIRE)${note ? ` — ${note}` : ""}`);
      hasError = true;
    } else if (!required && !defined) {
      console.warn( `⚠️  ${key.padEnd(40)} absente (recommandée)${note ? ` — ${note}` : ""}`);
    } else {
      const masked = value!.length > 8 ? `${value!.slice(0, 4)}…${value!.slice(-4)}` : "****";
      console.log(  `✅ ${key.padEnd(40)} ${masked}`);
    }
  }

  console.log(`\n${"─".repeat(60)}`);
  if (hasError) {
    console.error("❌ Des variables obligatoires manquent — déploiement BLOQUÉ");
    process.exitCode = 1;
  } else {
    console.log("✅ Toutes les variables obligatoires sont définies — déploiement autorisé");
  }
}

main();
