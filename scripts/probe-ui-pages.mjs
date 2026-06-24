const paths = ["/", "/auth/connexion", "/auth/mot-de-passe-oublie", "/lancement"];
const base = process.argv[2] ?? "http://localhost:3001";

for (const p of paths) {
  const r = await fetch(base + p);
  const h = await r.text();
  const cssLinks = (h.match(/href="\/_next\/static\/css\/[^"]+\.css"/g) ?? []).length;
  const hasFlexClass = h.includes('class="flex') || h.includes("flex min-h-screen");
  const hasNaN = h.includes("NaN");
  console.log(`${p} status=${r.status} css=${cssLinks} flex=${hasFlexClass} nan=${hasNaN}`);
}
