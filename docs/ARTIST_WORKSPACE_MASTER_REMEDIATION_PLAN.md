# ARTIST WORKSPACE — Master Remediation Plan
**Mission D · Version 1.0**
**Date :** 2026-07-03 | **Auteur :** Claude Sonnet 4.6
**Basé sur :** FORENSIC_AUDIT_REPORT.md (AUDIT 1)

---

## CYCLE DE REMÉDIATION

```
AUDIT 1 ✅ → REMEDIATION 1 ⏳ → AUDIT 2 → REMEDIATION 2 → AUDIT 3 → CERTIFICATION
```

---

## REMEDIATION 1 — Correction CRITIQUE uniquement

**Déclencheur :** Validation de Rémy sur ce plan
**Durée estimée :** < 30 min
**Risque :** Faible (un seul fichier, une correction chirurgicale)

### R1-C001 — Corriger `CreatorDashboardBoundary` (page.tsx)

**Anomalie :** C-001 — catch avale les redirections Next.js
**Fichier :** `apps/web/src/app/(creator)/creator/page.tsx` lignes 56–63

**Avant :**
```typescript
async function CreatorDashboardBoundary() {
  try {
    return await CreatorDashboardContent();
  } catch (e) {
    console.error("[CreatorDashboard] crash:", e);
    return <CreatorDashboardError />;
  }
}
```

**Après :**
```typescript
async function CreatorDashboardBoundary() {
  try {
    return await CreatorDashboardContent();
  } catch (e) {
    // Next.js redirect() throws a special NEXT_REDIRECT error — must re-throw
    const digest = (e as { digest?: string })?.digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
      throw e;
    }
    console.error("[CreatorDashboard] crash:", e);
    return <CreatorDashboardError />;
  }
}
```

**Également :** Supprimer le `console.error` debug ajouté précédemment (pas besoin en production — Next.js logge déjà les erreurs non-redirect).

**Validation après R1 :**
- [ ] `pnpm build` → 0 erreur
- [ ] `pnpm lint` → 0 erreur
- [ ] `pnpm typecheck` → 0 erreur
- [ ] Test manuel : accéder à `/creator` sans être connecté → redirect vers `/auth/connexion` (pas l'écran d'erreur)
- [ ] Test manuel : accéder à `/creator` avec compte auditeur pur → redirect vers `/profile`
- [ ] Test manuel : accéder à `/creator` avec compte artiste valide → dashboard s'affiche normalement

---

## REMEDIATION 2 — Nettoyage MAJEURE

**Déclencheur :** AUDIT 2 confirmant l'état après R1 + validation de Rémy
**Durée estimée :** 45–60 min
**Risque :** Faible (suppressions de code mort, pas de logique touchée)

### R2-M001 + R2-M002 + R2-M003 — Supprimer les 3 composants orphelins

**Fichiers à supprimer :**
- `apps/web/src/features/creator/dashboard/components/ActivityFeed.tsx`
- `apps/web/src/features/creator/dashboard/components/DashboardQuickCards.tsx`
- `apps/web/src/features/creator/dashboard/components/SparklineChart.tsx`

**Vérification avant suppression :**
- Grep sur l'ensemble du repo pour s'assurer qu'aucun nouveau consommateur n'a été ajouté depuis l'audit

---

### R2-M004 — Supprimer le bloc CSS mort `.artist-hero` dans `hero.css`

**Fichier :** `apps/web/src/app/styles/creator/hero.css`
**Action :** Supprimer les lignes 1–675 (section `.artist-hero { }` complète avec `.artist-hero__*`, `.creator-welcome-*`)

**Garder :** lignes ~677–fin (`.ahero { }`, `.crop-modal { }`, leurs variantes responsives et keyframes)

**Vérification :** Grep `artist-hero` dans tous les tsx/css après suppression — 0 résultat attendu.

---

### R2-M005 — Supprimer `enterprise/vitrine.css`

**Fichier :** `apps/web/src/app/styles/creator/enterprise/vitrine.css`
**Action :** Supprimer le fichier entier

**Vérification :** S'assurer que `vitrine.css` est référencé dans `globals.css` ou un fichier d'import CSS — retirer la référence également.

---

### R2-N001 — Corriger le hex hardcodé dans `cover-studio.css`

**Fichier :** `apps/web/src/app/styles/creator/cover-studio.css` ligne 44
**Avant :** `color: #f87171;`
**Après :** `color: var(--color-erreur);`

---

### R2-N002 — Corriger l'ordre des imports dans `ArtistCoverSlider.tsx`

**Fichier :** `apps/web/src/features/creator/dashboard/components/ArtistCoverSlider.tsx` lignes 17–18

**Option A (recommandée) :** Déplacer `import { useRouter }` avant le type alias
**Option B :** Supprimer l'alias `AllowedImageMime` et utiliser `ImageMime` directement partout

---

### R2-N003 — Supprimer le CSS orphelin dans `panels.css`

Avec les composants (R2-M001, R2-M002), supprimer leurs classes CSS correspondantes :
- `.dash-activity__*` (lignes 1–99)
- `.dash-weekly__*` (lignes 101–241)
- `.dash-quick-cards`, `.dash-quick-card__*` (lignes 257–305)

**Garder :** `.co-*`, `.dash-conseil__*`, `.dash-career-progress__*`, `.dash-coach__*`, `.dash-bottom-2col`, `.dash-premium__*`, `.dash-catalogue-card__*`

---

### R2-N004 — Consolider le formateur `fmtGnf`

**Fichiers touchés :** `ArtistHero.tsx` et `CreatorDashboardView.tsx`

**Action :**
1. Ajouter `export function fmtGnf(n: number): string` dans `creatorPresentation.ts`
2. Utiliser l'implémentation la plus complète (avec `toLocaleString` pour les petites valeurs)
3. Importer depuis `@/features/creator/lib/creatorPresentation` dans les deux composants

---

## HORS SCOPE — Roadmap future

Ces items ont été identifiés mais sont **hors périmètre Mission D** :

| Item | Motif d'exclusion |
|---|---|
| Migration `rgba()` → `color-mix()` CSS (Co-001, Co-002) | Sprint CSS Vague J — scope trop large |
| Intégration `ActivityFeed` dans le dashboard | Décision produit Rémy — hors scope workspace UX |
| Composant vitrine artiste publique | Feature prévue post-lancement |
| `SparklineChart` dans les KPI cards | UX enhancement post-MVP |

---

## CONTRAINTES NON-NÉGOCIABLES (inchangées)

| Interdit | Raison |
|---|---|
| ❌ Toucher Publication / Catalogue / Wizard | Silo artiste — hors scope Mission D |
| ❌ Toucher Audio Upload / Edge Fn / Storage / Zod | Upload Policy Enterprise v1.1.0 gelé |
| ❌ Toucher Wallet / Royalties / Analytics Engine | Silos autonomes |
| ❌ push --force | Règle absolue CLAUDE.md |
| ❌ hex hardcodé dans TSX | Token governance CLAUDE.md §1ter |

---

## CALENDRIER

```
[FAIT]     AUDIT 1               — 2026-07-03
[EN COURS] Validation Rémy       — attente
[À VENIR]  REMEDIATION 1 (C-001) — 30 min après validation
[À VENIR]  AUDIT 2               — vérification post-R1
[À VENIR]  REMEDIATION 2 (M+N)  — 45-60 min après validation AUDIT 2
[À VENIR]  AUDIT 3               — vérification post-R2
[À VENIR]  CERTIFICATION         — rapport final
```
