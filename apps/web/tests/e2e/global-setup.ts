import { chromium, type FullConfig } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { createStreamingService } from "@sonafrik/api/streaming";

const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL ?? "s13b-playwright-listener@sonafrik.test";
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD ?? "S13BCert2026!";
export const CERTIFIED_TRACK_ID = "411f4e81-b684-4691-983d-234eb127c82b";
export const AUTH_STATE_PATH = "./tests/e2e/.auth-state.json";

export async function globalSetup(_config: FullConfig) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey || !anonKey) {
    console.warn(
      "[E2E] Variables Supabase absentes — les tests authentifiés seront ignorés.",
    );
    return;
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

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
    if (created.user) {
      userId = created.user.id;
    } else if (error?.message?.includes("already been registered")) {
      const probe = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: signInProbe, error: probeErr } = await probe.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });
      if (probeErr || !signInProbe.user) {
        throw new Error(`[E2E] Test user introuvable après conflit email : ${probeErr?.message}`);
      }
      userId = signInProbe.user.id;
    } else {
      throw new Error(`[E2E] Impossible de créer le test user : ${error?.message}`);
    }
  }

  await admin.from("profiles").upsert({
    id: userId,
    full_name: "S13B Playwright Listener",
    phone: "+224620000099",
    country_code: "GN",
    account_type: "auditeur",
    role: "listener",
    onboarding_completed: true,
  }, { onConflict: "id" });

  const probeClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: probeSignIn, error: probeSignInErr } = await probeClient.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (probeSignInErr || !probeSignIn.session) {
    throw new Error(`[E2E] Probe stream-start : connexion échouée — ${probeSignInErr?.message}`);
  }
  const probeStream = createStreamingService(probeClient);
  let probeOk = false;
  let probeDetail = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const start = await probeStream.startStream({
        trackId: CERTIFIED_TRACK_ID,
        platform: "web",
        qualityKbps: 96,
      });
      if (!start.sessionId || !start.signedUrl) {
        throw new Error("sessionId ou signedUrl manquant");
      }
      probeOk = true;
      break;
    } catch (probeErr) {
      probeDetail = probeErr instanceof Error ? probeErr.message : String(probeErr);
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  if (!probeOk) {
    throw new Error(`[E2E] Probe stream-start échoué (qualityKbps=96) : ${probeDetail}`);
  }

  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
  const baseHost = new URL(baseURL).hostname;
  const authCookies: { name: string; value: string }[] = [];
  const ssrClient = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return authCookies;
      },
      setAll(cookiesToSet: { name: string; value: string }[]) {
        for (const { name, value } of cookiesToSet) {
          const idx = authCookies.findIndex((c) => c.name === name);
          if (!value) {
            if (idx >= 0) authCookies.splice(idx, 1);
          } else if (idx >= 0) {
            authCookies[idx] = { name, value };
          } else {
            authCookies.push({ name, value });
          }
        }
      },
    },
  });
  const { error: cookieSignInErr } = await ssrClient.auth.setSession({
    access_token: probeSignIn.session.access_token,
    refresh_token: probeSignIn.session.refresh_token,
  });
  if (cookieSignInErr || authCookies.length === 0) {
    throw new Error(`[E2E] Injection cookies SSR échouée : ${cookieSignInErr?.message ?? "aucun cookie"}`);
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addCookies(
    authCookies.map(({ name, value }) => ({
      name,
      value,
      domain: baseHost,
      path: "/",
      httpOnly: false,
      secure: baseURL.startsWith("https"),
      sameSite: "Lax" as const,
    })),
  );
  const page = await context.newPage();
  await page.goto(baseURL);

  await context.storageState({ path: AUTH_STATE_PATH });
  await browser.close();

  console.log(`[E2E] Test user prêt : ${TEST_EMAIL} (id: ${userId})`);
}

export default globalSetup;
