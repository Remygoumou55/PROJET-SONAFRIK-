# SONAFRIK DASHBOARD DESIGN LANGUAGE — Certification Report

**Date :** 2026-07-07  
**Programme :** Dashboard Design Language Program (Artist Dashboard)  
**Décision :** **SONAFRIK DASHBOARD DESIGN LANGUAGE CERTIFIED**

---

## 1. Audit — constat initial

| Zone | Problème identifié |
|---|---|
| Hero | Barre profil % dupliquée avec Coach |
| KPI | `GlanceKpiGrid` (« En un coup d'œil ») + anciens KPI hero — redondance |
| Hiérarchie | Ordre incohérent : KPI → Wallet → Catalogue → Coach |
| Coach | Texte long (`tip.message`), activités mélangées, mission peu scannable |
| Wallet | Carte minimale (solde + CTA), peu orientée métier |
| Espacements | `--dash-section-gap` ≠ `--dash-card-gap`, sensation d'empilement |
| Career OS | `DashboardCareerProgressCard` en colonne séparée — duplication niveau/progression |
| Design System | Styles wallet (`co-*`) non factorisés |

---

## 2. Benchmark (synthèse — inspiration, pas copie)

| Plateforme | Pratique retenue | Application SONAFRIK |
|---|---|---|
| Audiomack | Bandeau KPI compact, 4 métriques alignées | `DashboardKpiBand` — tuiles centrées, delta discret |
| Spotify for Artists | Coach actionnable, une mission visible | Objectif + progression + CTA + badge récompense |
| Apple Music for Artists | Wallet lisible, solde en tête | Bloc solde hero + grille métier |
| TikTok Studio | Timeline activité séparée du coaching | `DashboardActivityCard` dédiée |
| Instagram Creator | Respiration verticale constante | `--dash-section-gap` = `--dash-card-gap` = 1.25rem |

---

## 3. Nouvelle architecture Dashboard

```
Hero (identité)
  ↓
DashboardKpiBand (4 KPI uniques)
  ↓
DashboardCoachCard (objectif · progression · action · récompense)
  ↓
DashboardWalletCard (solde · revenus · retrait · transaction · versement · état)
  ↓
DashboardCatalogueCard
  ↓
DashboardActivityCard
  ↓
DashboardPremiumCard
```

**Fichier orchestrateur :** `apps/web/src/features/creator/components/CreatorDashboardView.tsx`

---

## 4. Livrables par mission

| Mission | Statut | Livrable |
|---|---|---|
| M1 — Bandeau KPI | ✅ | `buildDashboardKpiBand` + `DashboardKpiBand` — 🎧 ❤️ 🎵 💰 |
| M2 — Respiration | ✅ | Grille verticale unifiée `creator-dashboard__stack` |
| M3 — Hiérarchie | ✅ | Ordre Hero → KPI → Coach → Wallet → Catalogue → Activité → Premium |
| M4 — Coach | ✅ | `DashboardCoachCard` — < 3 s, sans `tip.message` |
| M5 — Wallet | ✅ | `DashboardWalletCard` — 6 blocs métier + CTA |
| M6 — Micro-interactions | ✅ | `dash-kpi-in`, `dash-section-in`, progress animée |
| M7 — Design System | ✅ | Tokens `--dash-*`, panels unifiés via `DashboardPanel` |
| M8 — Déduplication | ✅ | Glance supprimé du dashboard, profil % retiré du Hero |
| M9 — Philosophie 5Q | ✅ | Chaque section = une question utilisateur |
| M10 — Benchmark | ✅ | Synthèse section 2 |
| M11 — Factorisation | ✅ | `features/shared/dashboard/*` |
| M12 — Qualité | ✅ | build / lint / typecheck = 0 erreur |

---

## 5. Factorisation — composants réutilisables

| Composant / utilitaire | Chemin |
|---|---|
| `DashboardKpiBand` | `features/shared/dashboard/DashboardKpiBand.tsx` |
| `DashboardCoachCard` | `features/shared/dashboard/DashboardCoachWalletActivity.tsx` |
| `DashboardWalletCard` | `features/shared/dashboard/DashboardCoachWalletActivity.tsx` |
| `DashboardActivityCard` | `features/shared/dashboard/DashboardCoachWalletActivity.tsx` |
| `buildDashboardKpiBand` | `packages/api/src/creator/creatorDashboard.kpiBand.presentation.ts` |
| `formatDashboardGnf` | `features/shared/dashboard/dashboardFormat.ts` |
| CSS design language | `app/styles/creator/dashboard.css` |

**Exports :** `@/features/shared/dashboard` · `@sonafrik/api/creator/presentation`

---

## 6. Éléments supprimés / déplacés

- `GlanceKpiGrid` retiré de `CreatorDashboardView` (composant conservé pour réutilisation analytics)
- `DashboardCareerProgressCard` retiré du flux principal (niveau intégré en pill Coach si `career_os`)
- Barre profil % retirée du Hero (`ArtistHero`)
- Activités retirées du Coach → `DashboardActivityCard`
- Inline `WalletCard` supprimé de `CreatorDashboardView`

---

## 7. Responsive & accessibilité

| Breakpoint | Comportement |
|---|---|
| Desktop / Laptop | Bandeau KPI 4 colonnes, wallet grille 2×2 |
| Tablette | Idem avec gutter `clamp` |
| Mobile ≤600px | KPI 2×2, delta masqué, coach reward en ligne, wallet 1 colonne |
| Mobile ≤380px | KPI 2×2 maintenu |

**A11y :**
- `aria-label` sur bandeau KPI, panels, coach reward
- `role="progressbar"` sur `DashboardProgressBar`
- `role="list"` / `listitem` sur tuiles KPI
- `<time dateTime>` sur activités
- Contraste via tokens `globals.css` uniquement

---

## 8. Validation technique

| Vérification | Résultat |
|---|---|
| `pnpm build` | ✅ 10/10 packages |
| `pnpm lint` | ✅ 17/17 tasks |
| `pnpm typecheck` | ✅ 17/17 tasks |
| Cache `.next` nettoyé | ✅ `pnpm dev:clean` |
| Dev server | ✅ Ready |
| `GET /creator` | ✅ HTTP 200 |

---

## 9. Avant / Après (structure)

**Avant**
```
Hero (+ barre profil %)
GlanceKpiGrid (6 tuiles « En un coup d'œil »)
Wallet minimal
Catalogue
[CareerProgress?] + Coach (texte + activités)
Premium
```

**Après**
```
Hero (identité : greeting, avatar, nom, badges, chips)
DashboardKpiBand (4 KPI : Écoutes · Fans · Catalogue · Revenus)
DashboardCoachCard (🎯 objectif · barre · 🚀 action · 🎁 récompense)
DashboardWalletCard (solde + grille métier)
DashboardCatalogueCard
DashboardActivityCard
DashboardPremiumCard
```

---

## 10. Règles respectées

- ❌ Aucune modification backend / API service / DB / Session Engine / Wallet Engine
- ✅ UI/UX + présentation pure (`buildDashboardKpiBand` = mapping données existantes)
- ✅ Tokens CSS uniquement (pas de hex hardcodé dans les composants)
- ✅ Domaine `creator/` — imports depuis `shared/dashboard` uniquement

---

## 11. Réserves & tests manuels recommandés

- [ ] Vérification visuelle Desktop / Laptop / Tablette / Mobile avec compte artiste réel
- [ ] Console navigateur : aucune erreur runtime sur `/creator` (auth requise)
- [ ] Vérifier CTA Wallet avec solde > 0 et paiement non configuré
- [ ] Captures écran avant/après à archiver par l'équipe produit

---

## Décision finale

# ✅ SONAFRIK DASHBOARD DESIGN LANGUAGE CERTIFIED

Le Dashboard Artiste respecte le design language factorisé, la hiérarchie premium, l'absence de duplication KPI, et passe l'audit build/lint/typecheck.
