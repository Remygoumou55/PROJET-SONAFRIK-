/**
 * SONAFRIK Sprint 1.2-B — Publication Workflow Live Validation
 * Usage: npx tsx scripts/publication-workflow-live.ts
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createAdminService } from "@sonafrik/api/admin";

const envPath = resolve(__dirname, "../apps/web/.env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1]!.trim()] = m[2]!.trim().replace(/^["']|["']$/g, "");
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!URL || !ANON || !SERVICE) {
  console.error("❌ Variables Supabase manquantes");
  process.exit(1);
}

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const ts = Date.now();
const PASSWORD = "Sprint12BTest2026!";

type Step = { phase: string; ok: boolean; detail: string };
const steps: Step[] = [];
const log = (phase: string, ok: boolean, detail: string) => {
  steps.push({ phase, ok, detail });
  console.log(`${ok ? "✅" : "❌"} [${phase}] ${detail}`);
};

async function signIn(email: string): Promise<SupabaseClient> {
  const client = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error || !data.session) throw new Error(error?.message ?? "signIn failed");
  return client;
}

async function invokeFn(client: SupabaseClient, body: Record<string, unknown>) {
  const { data: sess } = await client.auth.getSession();
  const token = sess.session?.access_token;
  const res = await fetch(`${URL}/functions/v1/catalog-asset-signed-url`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: ANON,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const parsed = (await res.json()) as Record<string, unknown>;
  if (!res.ok) throw new Error((parsed.error as string) ?? `HTTP ${res.status}`);
  return parsed;
}

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function createArtist(label: string) {
  const email = `s12b-artist-${label}-${ts}@sonafrik.test`;
  const { data: u, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !u.user) throw new Error(error.message);
  await admin.from("profiles").upsert({
    id: u.user.id,
    full_name: `S12B ${label}`,
    account_type: "auditeur",
    onboarding_completed: false,
  });
  const client = await signIn(email);
  const { error: onbErr } = await client.rpc("complete_onboarding", {
    p_full_name: `S12B ${label}`,
    p_account_type: "artiste",
  });
  if (onbErr) throw onbErr;
  const { data: creatorId, error: crErr } = await client.rpc("ensure_creator_for_current_user");
  if (crErr || !creatorId) throw crErr ?? new Error("no creator");
  return { label, email, userId: u.user.id, client, creatorId: creatorId as string };
}

async function journey(artist: Awaited<ReturnType<typeof createArtist>>, adminClient: SupabaseClient) {
  const { client, creatorId, userId, label } = artist;
  const adminSvc = createAdminService(adminClient);

  const { data: album, error: albErr } = await client
    .from("albums")
    .insert({
      creator_id: creatorId,
      title: `S12B Album ${label}`,
      slug: `s12b-alb-${label}-${ts}`,
      release_type: "album",
      publication_status: "draft",
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();
  if (albErr) throw albErr;

  const { data: track, error: trErr } = await client
    .from("tracks")
    .insert({
      creator_id: creatorId,
      album_id: album.id,
      title: `S12B Track ${label}`,
      slug: `s12b-tr-${label}-${ts}`,
      publication_status: "draft",
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();
  if (trErr) throw trErr;

  const cover = await invokeFn(client, {
    action: "upload",
    assetType: "cover",
    creatorId,
    albumId: album.id,
    contentType: "image/png",
    format: "png",
  });
  await fetch(cover.signedUrl as string, {
    method: "PUT",
    headers: { "Content-Type": "image/png" },
    body: TINY_PNG,
  });

  const audio = await invokeFn(client, {
    action: "upload",
    assetType: "audio",
    creatorId,
    trackId: track.id,
    contentType: "audio/mpeg",
    format: "mp3",
    bitrateKbps: 128,
  });
  await fetch(audio.signedUrl as string, {
    method: "PUT",
    headers: { "Content-Type": "audio/mpeg" },
    body: Buffer.from(
      await fetch("https://download.samplelib.com/mp3/sample-3s.mp3").then((r) => r.arrayBuffer()),
    ),
  });

  const { error: subErr } = await client.rpc("submit_track_for_review", { p_track_id: track.id });
  if (subErr) throw subErr;

  const { data: pending } = await client
    .from("tracks")
    .select("publication_status")
    .eq("id", track.id)
    .single();
  if (pending?.publication_status !== "pending_review") {
    throw new Error(`expected pending_review got ${pending?.publication_status}`);
  }

  const { error: hackErr } = await client
    .from("tracks")
    .update({ publication_status: "published", published_at: new Date().toISOString() })
    .eq("id", track.id);
  log(`B-${label}`, !!hackErr, hackErr?.message ?? "SECURITY GAP: artist published");

  await adminSvc.reviewCatalogItem(track.id, "track", "published");

  const { data: published } = await client
    .from("tracks")
    .select("publication_status, published_at")
    .eq("id", track.id)
    .single();
  log(`G-${label}`, published?.publication_status === "published" && !!published?.published_at, `status=${published?.publication_status}`);
}

async function main() {
  console.log("📋 Sprint 1.2-B — Publication Workflow Validation\n");

  const adminEmail = `s12b-admin-${ts}@sonafrik.test`;
  const { data: adminUser, error: adminCreateErr } = await admin.auth.admin.createUser({
    email: adminEmail,
    password: PASSWORD,
    email_confirm: true,
  });
  if (adminCreateErr || !adminUser.user) throw adminCreateErr;

  await admin.from("profiles").upsert({
    id: adminUser.user.id,
    full_name: "S12B Admin",
    account_type: "auditeur",
    onboarding_completed: true,
  });

  const { error: bootErr } = await admin.rpc("bootstrap_admin_if_none", {
    p_user_id: adminUser.user.id,
  });
  if (bootErr?.message?.includes("admin_already_exists")) {
    const { error: assignErr } = await admin.rpc("assign_admin_role", {
      p_user_id: adminUser.user.id,
    });
    log("D-Admin", !assignErr, assignErr?.message ?? `assigned ${adminEmail}`);
  } else {
    log("D-Admin", !bootErr, bootErr?.message ?? `bootstrapped ${adminEmail}`);
  }

  const { data: isAdmin } = await admin.rpc("is_admin", { p_user_id: adminUser.user.id });
  log("D-is_admin", isAdmin === true, String(isAdmin));

  const adminClient = await signIn(adminEmail);
  const artists = [];
  for (const label of ["1", "2", "3"]) {
    try {
      artists.push(await createArtist(label));
      log(`D-Artist-${label}`, true, artists[artists.length - 1]!.email);
    } catch (e) {
      log(`D-Artist-${label}`, false, e instanceof Error ? e.message : String(e));
    }
  }

  for (const artist of artists) {
    try {
      await journey(artist, adminClient);
    } catch (e) {
      log(`G-${artist.label}`, false, e instanceof Error ? e.message : String(e));
    }
  }

  const passed = steps.filter((s) => s.ok).length;
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Résultat : ${passed}/${steps.length}`);
  process.exitCode = passed === steps.length ? 0 : 1;
}

main().catch((err) => {
  console.error("Erreur fatale:", err);
  process.exit(1);
});
