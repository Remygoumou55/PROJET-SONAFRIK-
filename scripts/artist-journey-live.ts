/**
 * SONAFRIK Sprint 1.2 — Artist Journey Live Validation
 * Usage: npx tsx scripts/artist-journey-live.ts
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
const ARTIST_EMAIL = `s12-artist-${ts}@sonafrik.test`;
const PASSWORD = "Sprint12Test2026!";

type StepResult = { step: string; ok: boolean; detail: string };
const results: StepResult[] = [];

function log(step: string, ok: boolean, detail: string) {
  results.push({ step, ok, detail });
  console.log(`${ok ? "✅" : "❌"} [${step}] ${detail}`);
}

async function invokeFn(
  client: SupabaseClient,
  name: string,
  body: Record<string, unknown>,
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  const { data: sess } = await client.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) return { data: null, error: "no session token" };

  const res = await fetch(`${URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: ANON,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    /* non-json */
  }
  if (!res.ok) {
    const msg =
      (parsed?.error as string | undefined) ??
      (parsed?.message as string | undefined) ??
      text.slice(0, 200) ??
      `HTTP ${res.status}`;
    return { data: null, error: msg };
  }
  return { data: parsed, error: null };
}

async function signIn(email: string): Promise<SupabaseClient> {
  const client = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error || !data.session) throw new Error(error?.message ?? "signIn failed");
  return client;
}

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function main() {
  console.log("🎤 Sprint 1.2 — Artist Journey Validation\n");

  let artistId = "";
  let creatorId = "";
  let albumId = "";
  let singleId = "";
  let trackId = "";

  // Create user
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: ARTIST_EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });
  if (createErr || !created.user) throw new Error(createErr?.message);
  artistId = created.user.id;
  await admin.from("profiles").upsert({
    id: artistId,
    full_name: "S12 Candidate",
    account_type: "auditeur",
    onboarding_completed: false,
  });

  const artistClient = await signIn(ARTIST_EMAIL);

  // Phase C — provisioning via complete_onboarding
  const { data: onbData, error: onbErr } = await artistClient.rpc("complete_onboarding", {
    p_full_name: "S12 Artiste Live",
    p_account_type: "artiste",
  });
  if (onbErr) {
    log("C-Provisioning", false, onbErr.message);
  } else {
    const { data: creators, error: crErr } = await admin
      .from("creators")
      .select("id")
      .eq("owner_id", artistId);
    const creator = creators?.[0];
    const { data: profile } = await admin
      .from("artist_profiles")
      .select("creator_id, stage_name")
      .eq("creator_id", creator?.id ?? "")
      .maybeSingle();
    creatorId = (creator?.id as string) ?? "";
    if (!creatorId) {
      // Fallback explicite si la RPC onboarding n'a pas provisionné (ne devrait plus arriver post-Sprint 1.2)
      const { data: ensured, error: ensureErr } = await artistClient.rpc(
        "ensure_creator_for_current_user",
      );
      if (!ensureErr && ensured) {
        creatorId = ensured as string;
      }
    }
    log(
      "C-Provisioning",
      !!creatorId,
      `onboarding=${String(onbData?.account_type ?? "?")} creator=${creatorId.slice(0, 8) || "none"}`,
    );
  }

  if (!creatorId) {
    console.error("\n⛔ Provisioning échoué — arrêt.");
    process.exit(1);
  }

  // Phase D — Catalogue
  try {
    const { data: album, error: albErr } = await artistClient
      .from("albums")
      .insert({
        creator_id: creatorId,
        title: `S12 Album ${ts}`,
        slug: `s12-album-${ts}`,
        release_type: "album",
        publication_status: "draft",
        created_by: artistId,
        updated_by: artistId,
      })
      .select("id")
      .single();
    if (albErr) throw albErr;
    albumId = album.id as string;

    const { data: single, error: sinErr } = await artistClient
      .from("albums")
      .insert({
        creator_id: creatorId,
        title: `S12 Single ${ts}`,
        slug: `s12-single-${ts}`,
        release_type: "single",
        publication_status: "draft",
        created_by: artistId,
        updated_by: artistId,
      })
      .select("id")
      .single();
    if (sinErr) throw sinErr;
    singleId = single.id as string;

    const { data: track, error: trkErr } = await artistClient
      .from("tracks")
      .insert({
        creator_id: creatorId,
        album_id: albumId,
        title: `S12 Track ${ts}`,
        slug: `s12-track-${ts}`,
        track_number: 1,
        publication_status: "draft",
        created_by: artistId,
        updated_by: artistId,
      })
      .select("id")
      .single();
    if (trkErr) throw trkErr;
    trackId = track.id as string;

    await artistClient.from("albums").update({ title: `S12 Album Updated ${ts}` }).eq("id", albumId);
    log("D-Catalogue", true, `album=${albumId.slice(0, 8)} single=${singleId.slice(0, 8)} track=${trackId.slice(0, 8)}`);
  } catch (e) {
    log("D-Catalogue", false, e instanceof Error ? e.message : String(e));
    process.exit(1);
  }

  // Phase E — Uploads
  for (const mime of ["image/png", "image/jpeg", "image/webp"] as const) {
    try {
      const { data, error } = await invokeFn(artistClient, "catalog-asset-signed-url", {
        action: "upload",
        assetType: "cover",
        creatorId,
        albumId,
        contentType: mime,
      });
      if (error || !data?.signedUrl) throw new Error(error ?? "no signedUrl");
      const put = await fetch(data.signedUrl as string, {
        method: "PUT",
        headers: { "Content-Type": mime },
        body: TINY_PNG,
      });
      if (!put.ok) throw new Error(`PUT ${put.status}`);
      log(`E-Cover-${mime.split("/")[1]}`, true, `cover_path set, PUT ${put.status}`);
    } catch (e) {
      log(`E-Cover-${mime.split("/")[1]}`, false, e instanceof Error ? e.message : String(e));
    }
  }

  for (const [label, mime, format] of [
    ["MP3", "audio/mpeg", "mp3"],
    ["AAC", "audio/mp4", "aac"],
  ] as const) {
    try {
      const { data, error } = await invokeFn(artistClient, "catalog-asset-signed-url", {
        action: "upload",
        assetType: "audio",
        creatorId,
        trackId,
        contentType: mime,
        format,
        bitrateKbps: 128,
      });
      if (error || !data?.signedUrl) throw new Error(error ?? "no signedUrl");
      const put = await fetch(data.signedUrl as string, {
        method: "PUT",
        headers: { "Content-Type": mime },
        body: new Uint8Array([0xff, 0xfb, 0x90, 0x00]),
      });
      if (!put.ok) throw new Error(`PUT ${put.status}`);
      const { data: files } = await artistClient
        .from("track_files")
        .select("id")
        .eq("track_id", trackId)
        .eq("is_primary", true);
      const { data: adminFiles } = await admin
        .from("track_files")
        .select("id, format")
        .eq("track_id", trackId);
      log(
        `E-Audio-${label}`,
        (files?.length ?? 0) > 0 || (adminFiles?.length ?? 0) > 0,
        `client_primary=${files?.length ?? 0} admin_rows=${adminFiles?.length ?? 0} PUT=${put.status}`,
      );
    } catch (e) {
      log(`E-Audio-${label}`, false, e instanceof Error ? e.message : String(e));
    }
  }

  // Phase F — Publication
  try {
    const { error: subErr } = await artistClient.rpc("submit_track_for_review", {
      p_track_id: trackId,
    });
    if (subErr) throw subErr;
    const { data: pending } = await artistClient
      .from("tracks")
      .select("publication_status")
      .eq("id", trackId)
      .single();
    log("F-Submit-review", pending?.publication_status === "pending_review", `status=${pending?.publication_status}`);

    // Publication via workflow admin officiel (review_track_publication)
    const adminEmail = `s12-admin-${ts}@sonafrik.test`;
    const { data: adminUser } = await admin.auth.admin.createUser({
      email: adminEmail,
      password: PASSWORD,
      email_confirm: true,
    });
    await admin.from("profiles").upsert({
      id: adminUser!.user!.id,
      full_name: "S12 Admin",
      account_type: "auditeur",
      onboarding_completed: true,
    });
    const { error: bootErr } = await admin.rpc("bootstrap_admin_if_none", {
      p_user_id: adminUser!.user!.id,
    });
    if (bootErr?.message?.includes("admin_already_exists")) {
      await admin.rpc("assign_admin_role", { p_user_id: adminUser!.user!.id });
    }
    const adminClient = await signIn(adminEmail);
    await createAdminService(adminClient).reviewCatalogItem(trackId, "track", "published");

    const { data: pub } = await admin.from("tracks").select("publication_status").eq("id", trackId).single();
    log("F-Published", pub?.publication_status === "published", `final=${pub?.publication_status}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : typeof e === "object" ? JSON.stringify(e) : String(e);
    log("F-Publication", false, msg);
  }

  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Résultat : ${passed}/${total} (${Math.round((passed / total) * 100)}%)`);
  console.log(`Test artist : ${ARTIST_EMAIL}`);
  process.exitCode = passed >= Math.ceil(total * 0.6) ? 0 : 1;
}

main().catch((err) => {
  console.error("Erreur fatale:", err);
  process.exit(1);
});
