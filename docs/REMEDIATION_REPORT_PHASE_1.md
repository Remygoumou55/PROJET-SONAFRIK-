# REMEDIATION REPORT — PHASE 1
> Mission D — Artist Workspace Experience  
> Cycle : AUDIT 1 → **REMEDIATION 1** ← AUDIT 2 → REMEDIATION 2 → AUDIT 3 → CERTIFICATION  
> Commit de référence : `f8b37d4`

---

## Anomalie corrigée

### C-001 — Crash `/creator` : redirect() swallowed par try/catch

**Fichier :** `apps/web/src/app/(creator)/creator/page.tsx`  
**Gravité :** CRITIQUE — tous les artistes non-onboardés recevaient un écran d'erreur au lieu d'être redirigés

**Cause racine :**  
`CreatorDashboardBoundary` attrapait toutes les exceptions sans relancer les erreurs `NEXT_REDIRECT`. Or Next.js 15 implémente `redirect()` par un mécanisme d'exception avec `digest: "NEXT_REDIRECT:..."`. Avaler cette exception empêchait la redirection et affichait le composant d'erreur à la place.

**Code avant :**
```typescript
async function CreatorDashboardBoundary() {
  try {
    return await CreatorDashboardContent();
  } catch (e) {
    console.error("[CreatorDashboard] crash:", e);
    return <CreatorDashboardError />;  // ← swallowait redirect()
  }
}
```

**Code après :**
```typescript
async function CreatorDashboardBoundary() {
  try {
    return await CreatorDashboardContent();
  } catch (e) {
    // Next.js redirect() throws a NEXT_REDIRECT error — must re-throw or the redirect is swallowed
    const digest = (e as { digest?: string })?.digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
      throw e;
    }
    console.error("[CreatorDashboard] crash:", e);
    return <CreatorDashboardError />;
  }
}
```

---

## Validation post-R1

| Vérification | Résultat |
|---|---|
| `pnpm build` | ✅ 9/9 réussi |
| `pnpm lint` | ✅ 0 erreur |
| `pnpm typecheck` | ✅ 0 erreur |
| `/creator` redirige vers onboarding si non-onboardé | ✅ (confirmé par AUDIT 2) |
| `/creator` charge le dashboard si artiste complet | ✅ (confirmé par AUDIT 2) |

**Log attendu au build :** `DYNAMIC_SERVER_USAGE` sur `/creator` — ce n'est PAS une erreur. C'est Next.js qui détecte l'usage de `cookies()` pendant la génération statique et marque la page comme `ƒ Dynamic`. À l'exécution la page se rend correctement.

---

## Périmètre autorisé respecté

✅ Aucun code de Publication, Catalogue, Upload, Wallet, Player ou Admin n'a été touché.
