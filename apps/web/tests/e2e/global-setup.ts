import { chromium, type FullConfig } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL ?? "e2e-test@sonafrik.test";
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD ?? "PlaywrightTest2026!";
export const AUTH_STATE_PATH = "./tests/e2e/.auth-state.json";

export async function globalSetup(_config: FullConfig) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.warn(
      "[E2E] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY absent — " +
      "les tests authentifiés seront ignorés.",
    );
    return;
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Créer le test user ou récupérer son ID s'il existe déjà
  let userId: string | undefined;

  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const existing = existingUsers?.users.find((u) => u.email === TEST_EMAIL);

  if (existing) {
    userId = existing.id;
  } else {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (error || !created.user) {
      throw new Error(`[E2E] Impossible de créer le test user : ${error?.message}`);
    }
    userId = created.user.id;
  }

  // S'assurer que le profil existe et que l'onboarding est marqué complet
  // (le trigger handle_new_user crée le profil, mais parfois avec délai)
  await admin.from("profiles").upsert({
    id: userId,
    full_name: "Test E2E",
    account_type: "auditeur",
    onboarding_completed: true,
  }, { onConflict: "id" });

  // Signer le test user et capturer la session dans storageState
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Injecter la session Supabase via le storage (localStorage + cookie)
  const { data: sessionData, error: sessionError } = await admin.auth.admin.getUserById(userId);
  if (sessionError || !sessionData.user) {
    throw new Error(`[E2E] Impossible de récupérer le test user : ${sessionError?.message}`);
  }

  // Créer une session de test via signInWithPassword
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (signInError || !signInData.session) {
    throw new Error(`[E2E] Connexion test user échouée : ${signInError?.message}`);
  }

  const { access_token, refresh_token } = signInData.session;
  const storageKey = `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`;

  await page.goto(baseURL);
  await page.evaluate(
    ({ key, value }) => { localStorage.setItem(key, JSON.stringify(value)); },
    {
      key: storageKey,
      value: {
        access_token,
        refresh_token,
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: signInData.user,
      },
    },
  );

  await context.storageState({ path: AUTH_STATE_PATH });
  await browser.close();

  console.log(`[E2E] Test user prêt : ${TEST_EMAIL} (id: ${userId})`);
}

export default globalSetup;
