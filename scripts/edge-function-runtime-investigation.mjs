/**
 * SONAFRIK — Edge Function Runtime Investigation v1.0 (fetch-only)
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve("apps/web/.env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const MOCK_CREATOR_ID = "00000000-0000-4000-a000-000000000002";
const ARTIST_EMAIL = "s12b-artist-1-1782222972289@sonafrik.test";
const ARTIST_PASSWORD = "Sprint12BTest2026!";
const FN = "catalog-asset-signed-url";
const FN_URL = `${SUPABASE_URL}/functions/v1/${FN}`;

const log = [];

function record(label, data) {
  log.push({ label, at: new Date().toISOString(), ...data });
  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(data, null, 2));
}

async function rawInvoke(accessToken, body) {
  const started = Date.now();
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      apikey: ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { _raw: text };
  }
  return {
    requestUrl: FN_URL,
    method: "POST",
    requestHeaders: {
      Authorization: "Bearer [JWT redacted]",
      "Content-Type": "application/json",
      apikey: "[anon key redacted]",
    },
    requestBody: body,
    status: res.status,
    statusText: res.statusText,
    responseHeaders: Object.fromEntries(res.headers.entries()),
    responseBody: json,
    timingMs: Date.now() - started,
  };
}

async function authSignIn() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: ARTIST_EMAIL, password: ARTIST_PASSWORD }),
  });
  const body = await res.json();
  return { status: res.status, body };
}

async function restRpc(accessToken, fn, args) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

async function restInsertAlbum(accessToken, creatorId) {
  const slug = `edge-inv-${Date.now()}`;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/albums`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      creator_id: creatorId,
      title: "Edge Investigation",
      slug,
      release_type: "single",
      publication_status: "draft",
    }),
  });
  const body = await res.json();
  return { status: res.status, body };
}

const auth = await authSignIn();
if (auth.status !== 200 || !auth.body.access_token) {
  record("AUTH_FAIL", auth);
  process.exit(1);
}

const accessToken = auth.body.access_token;
const userId = auth.body.user.id;

record("AUTH_OK", {
  httpStatus: auth.status,
  userId,
  email: ARTIST_EMAIL,
  tokenLength: accessToken.length,
  expiresIn: auth.body.expires_in,
});

const creatorRpc = await restRpc(accessToken, "ensure_creator_for_current_user", {});
const realCreatorId = JSON.parse(creatorRpc.body);

record("CREATOR_OK", {
  httpStatus: creatorRpc.status,
  realCreatorId,
  mockCreatorId: MOCK_CREATOR_ID,
});

const canEditMock = await restRpc(accessToken, "can_edit_creator", { p_creator_id: MOCK_CREATOR_ID });
const canEditReal = await restRpc(accessToken, "can_edit_creator", { p_creator_id: realCreatorId });

record("RPC_can_edit_creator", {
  mock: { httpStatus: canEditMock.status, result: canEditMock.body },
  real: { httpStatus: canEditReal.status, result: canEditReal.body },
});

const albumInsert = await restInsertAlbum(accessToken, realCreatorId);
if (albumInsert.status !== 201) {
  record("ALBUM_FAIL", albumInsert);
  process.exit(1);
}
const album = albumInsert.body[0];

record("ALBUM_OK", { albumId: album.id, creatorId: album.creator_id });

const coverUploadPayloadMock = {
  action: "upload",
  assetType: "cover",
  creatorId: MOCK_CREATOR_ID,
  albumId: album.id,
  contentType: "image/jpeg",
};

const coverUploadPayloadReal = {
  action: "upload",
  assetType: "cover",
  creatorId: realCreatorId,
  albumId: album.id,
  contentType: "image/jpeg",
};

record("PROBE_A_MOCK_CREATOR", await rawInvoke(accessToken, coverUploadPayloadMock));
record("PROBE_B_REAL_CREATOR", await rawInvoke(accessToken, coverUploadPayloadReal));

const realUpload = log.find((e) => e.label === "PROBE_B_REAL_CREATOR");
if (realUpload?.status === 200 && realUpload.responseBody?.signedUrl) {
  const tinyJpeg = Buffer.from(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AVN//2Q==",
    "base64",
  );
  const putStarted = Date.now();
  const putRes = await fetch(realUpload.responseBody.signedUrl, {
    method: "PUT",
    headers: { "Content-Type": "image/jpeg" },
    body: tinyJpeg,
  });
  record("STORAGE_PUT", {
    status: putRes.status,
    statusText: putRes.statusText,
    path: realUpload.responseBody.path,
    bucket: "catalog-visuals",
    timingMs: Date.now() - putStarted,
  });

  const confirmPayload = {
    action: "confirm",
    assetType: "cover",
    creatorId: realCreatorId,
    albumId: album.id,
    path: realUpload.responseBody.path,
  };
  record("PROBE_C_CONFIRM_REAL", await rawInvoke(accessToken, confirmPayload));
  record("PROBE_D_CONFIRM_MOCK_CREATOR", await rawInvoke(accessToken, {
    ...confirmPayload,
    creatorId: MOCK_CREATOR_ID,
  }));
}

record("OPTIONS_PREFLIGHT", await (async () => {
  const res = await fetch(FN_URL, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:3000",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "authorization,content-type,apikey",
    },
  });
  return {
    status: res.status,
    statusText: res.statusText,
    headers: Object.fromEntries(res.headers.entries()),
  };
})());

writeFileSync(
  resolve("docs/publication-catalog/edge-function-runtime-investigation-log.json"),
  JSON.stringify(log, null, 2),
);
console.log("\nLog written to docs/publication-catalog/edge-function-runtime-investigation-log.json");
