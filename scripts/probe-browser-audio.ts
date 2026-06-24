import { readFileSync } from "fs";
import { resolve } from "path";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const envPath = resolve(__dirname, "../apps/web/.env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1]!.trim()] = m[2]!.trim().replace(/^["']|["']$/g, "");
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const TRACK = "1d068c31-74fa-4f4b-b0fa-2ab8847e260c"; // S12B Track 2

async function main() {
  const client = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data: signIn } = await client.auth.signInWithPassword({
    email: "s13b-playwright-listener@sonafrik.test",
    password: "S13BCert2026!",
  });
  const token = signIn.session!.access_token;

  const res = await fetch(`${URL}/functions/v1/stream-start`, {
    method: "POST",
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ trackId: TRACK, platform: "web", qualityKbps: 96 }),
  });
  const body = await res.json();
  const signedUrl = body.signedUrl as string;
  console.log("signedUrl ok", res.status, signedUrl.slice(0, 100));

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const result = await page.evaluate(async (url) => {
    const fetchRes = await fetch(url);
    const fetchOk = fetchRes.ok;
    const contentType = fetchRes.headers.get("content-type");
    const size = fetchRes.headers.get("content-length");

    const direct = await new Promise<{ ok: boolean; code?: number; readyState?: number }>((resolve) => {
      const a = new Audio();
      a.oncanplay = () => resolve({ ok: true, readyState: a.readyState });
      a.onerror = () => resolve({ ok: false, code: a.error?.code, readyState: a.readyState });
      a.src = url;
      setTimeout(() => resolve({ ok: false, code: -1, readyState: a.readyState }), 8000);
    });

    let blobOk = false;
    let blobCode: number | undefined;
    if (fetchOk) {
      const blob = await fetchRes.clone().blob();
      const obj = URL.createObjectURL(blob);
      blobOk = await new Promise((resolve) => {
        const a = new Audio();
        a.oncanplay = () => resolve(true);
        a.onerror = () => {
          blobCode = a.error?.code;
          resolve(false);
        };
        a.src = obj;
        setTimeout(() => resolve(false), 8000);
      });
      URL.revokeObjectURL(obj);
    }

    return { fetchOk, contentType, size, direct, blobOk, blobCode };
  }, signedUrl);

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
