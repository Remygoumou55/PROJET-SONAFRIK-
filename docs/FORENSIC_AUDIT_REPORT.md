# FORENSIC AUDIT REPORT — Artist Workspace Experience
**Mission D · AUDIT 1**
**Date :** 2026-07-03 | **Auditeur :** Claude Sonnet 4.6
**Périmètre :** Dashboard, Hero, Avatar (display), Cover (display), KPIs, Cards, Navigation, Sidebar, Loading, Responsive, Accessibilité, Animations, UX

---

## RÉSUMÉ EXÉCUTIF

L'espace artiste contient **1 anomalie CRITIQUE** qui cause un crash utilisateur confirmé (bug actif en production), **5 anomalies MAJEURES** (dette technique significative / dégradation UX), et **4 anomalies MINEURES** (qualité code / gouvernance tokens).

| Sévérité | Nb | Résumé |
|---|---|---|
| CRITIQUE | 1 | Crash `/creator` — boundary avale les redirections Next.js |
| MAJEURE | 5 | 3 composants orphelins + 2 blocs CSS morts (héros V2 complet) |
| MINEURE | 4 | Hex hardcodé, type alias mal placé, CSS d'orphelins, duplicate formatter |
| COSMÉTIQUE | 2 | rgba hardcodés pouvant dériver des tokens couleur |

---

## ANOMALIES CRITIQUES (P0 — Bloquer le lancement)

---

### C-001 — `CreatorDashboardBoundary` avale les redirections Next.js

**Fichier :** [apps/web/src/app/(creator)/creator/page.tsx](apps/web/src/app/(creator)/creator/page.tsx#L56-L63)
**Lignes :** 56–63

**Code incriminé :**
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

**Description du défaut :**
En Next.js 15 App Router, `redirect()` fonctionne en **lançant une erreur spéciale** (`NEXT_REDIRECT` dans le champ `digest`). Ce try/catch générique capture TOUTES les exceptions, y compris ces redirections. Résultat : au lieu d'être redirigé, l'utilisateur voit `<CreatorDashboardError />` avec le message "Impossible de charger votre espace artiste pour le moment."

**Chemins déclencheurs dans `requireCreatorContext()` → `fetchCreatorContext()` :**
1. `if (!profile) redirect("/auth/connexion")` — utilisateur non connecté
2. `redirect("/onboarding/artist")` / `redirect("/onboarding/listener")` / `redirect("/onboarding/role")` — onboarding incomplet
3. `redirect("/profile")` — compte non-artiste (auditeur pur)
4. `redirect("/profile")` dans le `catch { }` du timeout DB (ligne 85 de `requireCreatorContext.ts`)

**Impact :** Tout utilisateur redirigeable voit l'écran d'erreur au lieu d'être dirigé vers la bonne page. L'espace artiste est **inaccessible** pour ces cas.

**Symptôme confirmé :** Screenshot fourni par Rémy montre la page `/creator` affichant uniquement le message d'erreur avec fond noir.

**Correction :**
```typescript
async function CreatorDashboardBoundary() {
  try {
    return await CreatorDashboardContent();
  } catch (e) {
    // Next.js redirect() throws NEXT_REDIRECT — must re-throw or redirection is swallowed
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

## ANOMALIES MAJEURES (P1 — À corriger avant lancement)

---

### M-001 — `ActivityFeed.tsx` : composant orphelin (mort)

**Fichier :** [apps/web/src/features/creator/dashboard/components/ActivityFeed.tsx](apps/web/src/features/creator/dashboard/components/ActivityFeed.tsx)

**Description :** `ActivityFeed` est défini et exporté, mais **n'est importé nulle part dans l'arbre de rendu actuel**. Grep confirmé : 0 importeur. Il n'apparaît pas dans `CreatorDashboardView`, dans aucune page, ni dans aucun autre composant du silo creator.

**Impact :**
- Dead code : increase le risque de confusion pour les futurs développeurs
- CSS associé dans `enterprise/panels.css` (classes `.dash-activity__*`, `.dash-weekly__*`) également mort
- Le type `CreatorDashboardActivity` est dans le bundle type mais le composant qui l'utilise ne s'affiche pas

**Correction :** Supprimer le fichier (ou l'intégrer dans `DashboardCoachCard` si intention de l'afficher).

---

### M-002 — `DashboardQuickCards.tsx` : composant orphelin (mort)

**Fichier :** [apps/web/src/features/creator/dashboard/components/DashboardQuickCards.tsx](apps/web/src/features/creator/dashboard/components/DashboardQuickCards.tsx)

**Description :** Même situation que M-001. `DashboardQuickCards` est défini mais **jamais importé**. Les CSS correspondants (`.dash-quick-cards`, `.dash-quick-card` dans `enterprise/panels.css`) sont également morts.

**Impact :** Dead code, confusion développeur, CSS mort.

**Correction :** Supprimer le fichier.

---

### M-003 — `SparklineChart.tsx` : composant orphelin (mort)

**Fichier :** [apps/web/src/features/creator/dashboard/components/SparklineChart.tsx](apps/web/src/features/creator/dashboard/components/SparklineChart.tsx)

**Description :** `SparklineChart` est défini mais **jamais importé**. Le CSS correspondant (`.creator-sparkline`, `.creator-sparkline__area`, `.creator-sparkline__line` dans `hero.css`) n'est jamais atteint.

**Impact :** Dead code. Le sparkline était prévu dans les KPI cards (`dash-stats__spark`) mais n'est pas rendu.

**Correction :** Supprimer le fichier.

---

### M-004 — Hero CSS V2 (`.artist-hero`) entièrement mort dans `hero.css`

**Fichier :** [apps/web/src/app/styles/creator/hero.css](apps/web/src/app/styles/creator/hero.css#L1-L675)
**Lignes :** 1–675 (section `.artist-hero { }` complète)

**Description :** Le système `ArtistHero` a été migré vers le design V3.5 "premium card" (classes `.ahero__*`, lignes 677–1664 du même fichier). TOUS les composants (`ArtistHero.tsx`, `ArtistProfilePhoto.tsx`, `ArtistCoverSlider.tsx`) utilisent désormais les classes `.ahero__*`. Le bloc `.artist-hero { }` (~675 lignes) n'est **référencé dans aucun fichier TSX/TSX du domaine creator**.

**Grep confirmé :** Aucune occurrence de `artist-hero` dans les fichiers `.tsx` du dossier `features/creator`.

**Impact :**
- ~675 lignes de CSS chargées inutilement dans chaque bundle
- Ambiguïté pour les futurs développeurs (deux systèmes parallèles `.artist-hero` et `.ahero` dans le même fichier)

**Correction :** Supprimer les lignes 1–675 de `hero.css` (garder uniquement la section `.ahero` et `.crop-modal`).

---

### M-005 — `enterprise/vitrine.css` entièrement mort

**Fichier :** [apps/web/src/app/styles/creator/enterprise/vitrine.css](apps/web/src/app/styles/creator/enterprise/vitrine.css)
**Lignes :** 1–225

**Description :** Le fichier `vitrine.css` définit la variante `.artist-hero--vitrine` (mode carte compacte). Cette classe n'est **référencée dans aucun composant TSX** de l'application. Grep confirmé : `artist-hero--vitrine` → 0 résultat dans les fichiers `.tsx`.

**Impact :** 225 lignes de CSS mort. Le concept "vitrine compacte" semble avoir été conçu mais jamais intégré.

**Correction :** Supprimer le fichier (ou documenter l'intention dans la roadmap si le composant vitrine est prévu prochainement).

---

## ANOMALIES MINEURES (P2 — Qualité code)

---

### N-001 — Hex hardcodé dans `cover-studio.css`

**Fichier :** [apps/web/src/app/styles/creator/cover-studio.css](apps/web/src/app/styles/creator/cover-studio.css#L44)
**Ligne :** 44

**Code :** `color: #f87171;`

**Description :** Violation directe de la règle CLAUDE.md §1ter — les couleurs doivent passer par les tokens `@theme`. `#f87171` est une nuance rouge pour les messages d'erreur. Le token `var(--color-erreur)` existe dans `globals.css`.

**Correction :** `color: var(--color-erreur);`

---

### N-002 — Type alias entre deux blocs d'imports dans `ArtistCoverSlider.tsx`

**Fichier :** [apps/web/src/features/creator/dashboard/components/ArtistCoverSlider.tsx](apps/web/src/features/creator/dashboard/components/ArtistCoverSlider.tsx#L17-L18)
**Lignes :** 17–18

**Code :**
```typescript
type AllowedImageMime = ImageMime;
import { useRouter } from "next/navigation";
```

**Description :** Un `type` alias est déclaré au milieu des imports, interrompant le bloc d'importation. ESLint (`import/order`) signalerait ceci. De plus, l'alias `AllowedImageMime = ImageMime` est redondant — `ImageMime` importé directement suffirait.

**Correction :** Déplacer `import { useRouter }` avant le type alias, ou supprimer l'alias et utiliser `ImageMime` directement.

---

### N-003 — CSS orphelin pour composants morts dans `panels.css`

**Fichier :** [apps/web/src/app/styles/creator/enterprise/panels.css](apps/web/src/app/styles/creator/enterprise/panels.css)

**Description :** Les classes suivantes correspondent à des composants supprimés/orphelins (M-001, M-002) :
- `.dash-activity__*` (lignes 1–99) — pour `ActivityFeed` (M-001, orphelin)
- `.dash-weekly__*` (lignes 101–241) — pour un "WeeklyPanel" jamais rendu
- `.dash-quick-cards`, `.dash-quick-card__*` (lignes 257–305) — pour `DashboardQuickCards` (M-002, orphelin)

**Impact :** CSS inutilisé chargé dans chaque rendu.

**Correction :** Supprimer avec les composants correspondants (M-001 et M-002).

---

### N-004 — Formateur `fmtGnf` dupliqué

**Fichiers :**
- [apps/web/src/features/creator/dashboard/components/ArtistHero.tsx](apps/web/src/features/creator/dashboard/components/ArtistHero.tsx#L42)
- [apps/web/src/features/creator/components/CreatorDashboardView.tsx](apps/web/src/features/creator/components/CreatorDashboardView.tsx#L19)

**Description :** La fonction `fmtGnf(n: number)` est définie deux fois avec des implémentations légèrement différentes (ArtistHero retourne `${n} GNF` pour les petites valeurs, CreatorDashboardView retourne `${n.toLocaleString("fr-FR")} GNF`). Cette divergence est source de présentation incohérente.

**Correction :** Consolider dans `creatorPresentation.ts` ou `packages/api/src/creator/presentation.ts`.

---

## ANOMALIES COSMÉTIQUES (P3 — Bonne hygiène)

---

### Co-001 — Valeurs `rgba` hardcodées avec composantes hex dans les CSS

**Fichiers :** `enterprise/base.css`, `enterprise/glance.css`, `enterprise/actions.css`, `enterprise/panels.css`, `hero.css`, `cover-studio.css`

**Description :** Les opacités sur les couleurs de brand sont exprimées avec `rgba(0, 210, 106, 0.X)` au lieu de `color-mix(in srgb, var(--color-vert-energie) X%, transparent)`. Si le token `--color-vert-energie` change un jour, toutes ces valeurs deviennent incohérentes.

**Impact :** Faible à court terme. Risque de dérive visuelle lors d'un changement de palette.

**Correction :** Migration progressive vers `color-mix()` lors d'un futur sprint CSS (Vague J).

---

### Co-002 — `rgba(255, 194, 14, 0.X)` au lieu de `var(--color-or-solaire)` avec opacité

Même problème pour la couleur or. Même recommandation.

---

## INVENTAIRE FICHIERS AUDITÉS

| Fichier | Statut |
|---|---|
| `app/(creator)/creator/page.tsx` | ❌ CRITIQUE C-001 |
| `features/creator/lib/requireCreator.ts` | ⚠️ contribue à C-001 |
| `features/creator/components/CreatorDashboard.tsx` | ✅ sain |
| `features/creator/components/CreatorDashboardView.tsx` | ✅ sain |
| `features/creator/components/CreatorLayoutClient.tsx` | ✅ sain |
| `features/creator/components/CreatorSidebar.tsx` | ✅ sain |
| `features/creator/components/CreatorMobileNav.tsx` | ✅ sain |
| `features/creator/lib/creatorNavConfig.ts` | ✅ sain |
| `features/creator/lib/creatorPresentation.ts` | ✅ sain |
| `features/creator/lib/greeting.ts` | ✅ sain |
| `features/creator/dashboard/components/ArtistHero.tsx` | ✅ sain |
| `features/creator/dashboard/components/HeroCard.tsx` | ✅ sain (re-export) |
| `features/creator/dashboard/components/ArtistCoverSlider.tsx` | ⚠️ N-002 |
| `features/creator/dashboard/components/ArtistProfilePhoto.tsx` | ✅ sain |
| `features/creator/dashboard/components/CreatorAssetImage.tsx` | ✅ sain |
| `features/creator/dashboard/components/ActivityFeed.tsx` | ❌ ORPHELIN M-001 |
| `features/creator/dashboard/components/DashboardQuickCards.tsx` | ❌ ORPHELIN M-002 |
| `features/creator/dashboard/components/SparklineChart.tsx` | ❌ ORPHELIN M-003 |
| `features/creator/dashboard/components/GlanceKpiGrid.tsx` | ✅ sain |
| `features/creator/dashboard/components/DashboardCatalogueCard.tsx` | ✅ sain |
| `features/creator/dashboard/components/DashboardCareerProgressCard.tsx` | ✅ sain |
| `features/creator/dashboard/components/DashboardCoachCard.tsx` | ✅ sain |
| `features/creator/dashboard/components/DashboardPremiumCard.tsx` | ✅ sain |
| `features/creator/dashboard/components/WelcomeModal.tsx` | ✅ sain |
| `features/creator/dashboard/components/CropEditorModal.tsx` | ✅ sain |
| `features/creator/dashboard/hooks/useCreatorAssetUrl.ts` | ✅ sain |
| `features/creator/dashboard/components/enterprise/GlanceKpiGrid.tsx` | ✅ sain |
| `features/creator/dashboard/components/enterprise/CreatorHeaderUtilities.tsx` | ✅ sain |
| `app/styles/creator/layout.css` | ✅ sain |
| `app/styles/creator/hero.css` L1-675 | ❌ CSS MORT M-004 |
| `app/styles/creator/hero.css` L677-fin | ✅ sain (`.ahero`, `.crop-modal`) |
| `app/styles/creator/mobile.css` | ✅ sain |
| `app/styles/creator/cover-studio.css` | ⚠️ N-001 (hex) |
| `app/styles/creator/enterprise/base.css` | ✅ sain |
| `app/styles/creator/enterprise/glance.css` | ✅ sain |
| `app/styles/creator/enterprise/actions.css` | ✅ sain |
| `app/styles/creator/enterprise/panels.css` | ⚠️ N-003 (CSS orphelin) |
| `app/styles/creator/enterprise/stats.css` | ✅ sain |
| `app/styles/creator/enterprise/vitrine.css` | ❌ ENTIÈREMENT MORT M-005 |
| `app/(creator)/creator/loading.tsx` | ✅ sain |

---

## TABLEAU DE SYNTHÈSE

| ID | Sévérité | Fichier | Impact |
|---|---|---|---|
| C-001 | 🔴 CRITIQUE | `page.tsx:56-63` | Crash utilisateur — redirect avalé |
| M-001 | 🟠 MAJEURE | `ActivityFeed.tsx` | Composant mort |
| M-002 | 🟠 MAJEURE | `DashboardQuickCards.tsx` | Composant mort |
| M-003 | 🟠 MAJEURE | `SparklineChart.tsx` | Composant mort |
| M-004 | 🟠 MAJEURE | `hero.css:1-675` | ~675 lignes CSS mortes |
| M-005 | 🟠 MAJEURE | `vitrine.css` | 225 lignes CSS mortes |
| N-001 | 🟡 MINEURE | `cover-studio.css:44` | Hex token violation |
| N-002 | 🟡 MINEURE | `ArtistCoverSlider.tsx:17` | Type alias entre imports |
| N-003 | 🟡 MINEURE | `panels.css` | CSS d'orphelins |
| N-004 | 🟡 MINEURE | `ArtistHero.tsx + View` | `fmtGnf` dupliqué |
| Co-001 | ⚪ COSM. | Multiple CSS | rgba sans tokens |
| Co-002 | ⚪ COSM. | Multiple CSS | or-solaire sans tokens |

---

*Prochain document : ARTIST_WORKSPACE_MASTER_REMEDIATION_PLAN.md*
*Prochain jalon : REMEDIATION 1 (C-001 uniquement) après validation de Rémy*
