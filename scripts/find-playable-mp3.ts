import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { chromium } from "@playwright/test";

const CANDIDATES = [
  "https://download.samplelib.com/mp3/sample-3s.mp3",
  "https://filesamples.com/samples/audio/mp3/sample4.mp3",
  "https://ia800304.us.archive.org/27/items/testmp3testfile/mpthreetest.mp3",
];

async function main() {
  for (const url of CANDIDATES) {
    const res = await fetch(url);
    console.log(url, res.status, res.headers.get("content-type"), res.headers.get("content-length"));
    if (!res.ok) continue;
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(resolve(__dirname, ".tmp-test.mp3"), buf);

    const browser = await chromium.launch();
    const page = await browser.newPage();
    const b64 = buf.toString("base64");
    const test = await page.evaluate(async (b) => {
      const bin = atob(b);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const obj = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
      return await new Promise<{ ok: boolean; code?: number; dur?: number }>((resolve) => {
        const a = new Audio();
        a.oncanplay = () => resolve({ ok: true, dur: a.duration });
        a.onerror = () => resolve({ ok: false, code: a.error?.code });
        a.src = obj;
        setTimeout(() => resolve({ ok: false, code: -1 }), 8000);
      });
    }, b64);
    await browser.close();
    console.log("  browser:", test, "size:", buf.length);
    if (test.ok) {
      console.log("WINNER:", url);
      break;
    }
  }
}

main().catch(console.error);
