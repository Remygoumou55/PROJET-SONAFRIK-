# MUSIC NAVIGATION EXPERIENCE — Certification SONAFRIK

**Date :** 7 juillet 2026  
**Programme :** Music Navigation Experience Program — Global Sidebar · Header · Navigation Refactoring  
**Décision :** ✅ **MUSIC NAVIGATION EXPERIENCE CERTIFIED**

---

## 1. Résumé exécutif

SONAFRIK dispose désormais d'un **langage de navigation Music OS unifié** : un seul design language pour Sidebar, Header, Bottom Nav et items de menu, factorisé dans `features/shared/navigation/`. Chaque silo (Artiste, Auditeur, Admin, Profil) conserve sa personnalité narrative via `MusicSidebarStory` et des hiérarchies de parcours adaptées, sans ressembler à un ERP/SaaS. Le système s'appuie sur l'Enterprise Shell existant (Sidebar Card · Header Card · Content Card).

---

## 2. Rapport d'audit (état initial)

### 2.1 Constats transversaux

| Problème | Silos touchés | Impact |
|---|---|---|
| 4 implémentations sidebar distinctes (`cs-sidebar`, `listener-sidebar`, `admin-sidebar`, `SidebarNav`) | Creator, Listener, Admin, Identity | Duplication, maintenance ×4 |
| Icônes emoji dans nav admin et creator | Admin, Creator | Aspect ERP / dashboard générique |
| Icônes SVG dupliquées (3 familles stroke différentes) | Listener mobile + desktop | Incohérence visuelle |
| Headers ad-hoc par silo | Creator, Admin, Identity | Pas de langage commun |
| Bottom nav inline avec styles hardcodés | Listener | Non factorisé |
| Sections techniques (« GESTION », « SYSTÈME ») | Admin | Parcours ERP, pas musical |
| Pas de contexte narratif dans la sidebar | Tous | Navigation froide, utilitaire |
| Hiérarchie creator centrée technique | Creator | Pas de parcours Créer → Comprendre → Revenus |

### 2.2 Ressemblances ERP/SaaS identifiées

- Admin : titres `VUE D'ENSEMBLE`, `GESTION`, `SYSTÈME`, emoji 📊👥⚙️
- Creator : liste plate sans storytelling carrière
- Identity : composant `SidebarNav` générique type settings SaaS
- Absence d'éléments contextuels discrets (lecture en cours, santé plateforme)

### 2.3 Points conservés (déjà Music OS)

- Motif africain `listen-pattern-strip.svg` sur sidebars auditeur/artiste
- Palette jungle/or SONAFRIK
- Enterprise Shell flottant (certifié précédemment)
- Enrichissements listener : RecentlyPlayed, QuickPlaylists, MiniPlayer

---

## 3. Langage officiel Music Navigation

### Architecture

```
features/shared/navigation/
├── musicNavTypes.ts          — types, rôles, icônes, badges
├── MusicNavIcon.tsx          — famille SVG unique (stroke 1.75, 20px)
├── MusicNavBadge.tsx         — badges unifiés (default, pending, alert, live)
├── MusicNavLink.tsx          — item de navigation
├── MusicNavMenu.tsx          — menu, sections, séparateurs
├── MusicNavFromSections.tsx  — rendu config → sections
├── MusicNavBackLink.tsx      — retour app
├── MusicSidebar.tsx          — carte sidebar Music OS
├── MusicSidebarBrand.tsx     — logo / marque par rôle
├── MusicSidebarStory.tsx     — pulse narratif par rôle
├── MusicHeader.tsx           — header card factorisé
├── MusicBottomNav.tsx        — navigation mobile auditeur
├── MusicMobilePillNav.tsx    — pills scrollables (creator, identity)
└── config/
    ├── listenerNav.ts        — parcours ÉCOUTER · COMPTE
    ├── creatorNav.ts         — parcours Créer · Comprendre · Revenus
    └── (admin via admin-nav.ts migré)
```

### Hiérarchies musicales par rôle

| Rôle | Story eyebrow | Parcours |
|---|---|---|
| **Artiste** | Ta carrière | Créer → Comprendre → Revenus → Paramètres |
| **Auditeur** | Découverte | ÉCOUTER (Accueil, Explorer, Biblio) → COMPTE (Wallet, Profil) |
| **Admin** | Plateforme | Piloter → Écosystème → Flux financiers → Gouvernance → Temps réel |
| **Profil** | Découverte (listener role) | Profil & compte + retour écoute |

### Design Tokens (`globals.css` + `music-navigation.css`)

| Catégorie | Tokens |
|---|---|
| Icônes | `--nav-icon-size` |
| Items | `--nav-item-height`, `--nav-item-radius`, `--nav-item-padding-x` |
| Espacements | `--nav-spacing-xs` → `--nav-spacing-l` |
| Sidebar | `--nav-sidebar-pattern-width`, `--nav-sidebar-body-width`, `--nav-sidebar-brand-padding` |
| États | `--nav-link-active-bg`, `--nav-link-hover-bg` |
| Mobile | `--nav-bottom-height` |

Tous héritent de `--shell-*` — aucune couleur hex hardcodée dans les composants.

---

## 4. Silos déployés

| Silo | Sidebar | Header | Mobile Nav | Statut |
|---|---|---|---|---|
| **Listener** | `MusicSidebar` + sections + widgets live | — (hero in-page) | `MusicBottomNav` | ✅ |
| **Creator** | `MusicSidebar` + hiérarchie carrière | `MusicHeader` | `MusicMobilePillNav` | ✅ |
| **Admin** | `MusicSidebar` + badges LDSE | `MusicHeader` | Drawer (existant) | ✅ |
| **Identity** | `MusicSidebar` compact | `MusicHeader` | `MusicMobilePillNav` | ✅ |
| **Wallet** | — (tabs dans header) | Enterprise header card | — | ✅ partiel* |

\*Wallet conserve une nav tabs intégrée au header (parcours financier court) — conforme au pattern header-card, hors scope sidebar.

---

## 5. Composants factorisés (liste officielle)

| Composant | Rôle |
|---|---|
| `MusicSidebar` | Shell sidebar Music OS |
| `MusicSidebarBrand` | Marque par rôle |
| `MusicSidebarStory` | Contexte narratif |
| `MusicNavMenu` | Conteneur menu |
| `MusicNavSection` | Groupe avec titre |
| `MusicNavSeparator` | Séparateur |
| `MusicNavLink` | Lien + icône + badge + états |
| `MusicNavIcon` | Icône SVG unifiée (33 icônes) |
| `MusicNavBadge` | Badge notification/live |
| `MusicNavBackLink` | Retour application |
| `MusicNavFromSections` | Rendu depuis config |
| `MusicHeader` | Header card unifié |
| `MusicBottomNav` | Bottom navigation mobile |
| `MusicMobilePillNav` | Nav pills horizontale |

**Règle :** aucune variante locale de sidebar/header/nav — imports depuis `@/features/shared/navigation` uniquement.

---

## 6. Accessibilité

| Critère | Implémentation |
|---|---|
| `role="navigation"` + `aria-label` | Toutes les sidebars et navs |
| `aria-current="page"` | Items actifs |
| `aria-expanded` / `aria-controls` | Menu burger admin |
| `focus-visible` outline | Links et pills |
| `aria-busy` | Pills en transition creator |
| Contraste | Tokens `--color-texte-*` officiels |

---

## 7. Responsive

| Breakpoint | Comportement |
|---|---|
| `< 768px` | Bottom nav listener ; sidebars masquées ; pills creator/identity |
| `≥ 768px` | Sidebar listener visible |
| `≥ 1024px` | Sidebar creator visible ; pills creator masquées |

---

## 8. Validation technique

| Contrôle | Résultat |
|---|---|
| `pnpm typecheck` | ✅ 17/17 packages |
| `pnpm lint` | ✅ 0 erreur |
| `pnpm build` | ✅ 50 pages générées |
| Cache `.next` nettoyé | ✅ |
| `pnpm dev:clean` | ✅ Ready |
| Logique métier / API / SRTSP | ✅ Non modifiés |

---

## 9. Dette technique résiduelle (non bloquante)

| Item | Priorité | Note |
|---|---|---|
| CSS legacy `.cs-sidebar`, `.listener-sidebar`, `.admin-sidebar` | Basse | Classes mortes — suppression Vague J |
| `ADMIN_MODULE_CARDS` emoji dashboard | Basse | Cartes accueil admin, hors navigation |
| Wallet tabs custom `.wallet-nav` | Basse | Pattern header-tabs valide pour silo financier |
| Super Admin silo dédié | — | N'existe pas — Admin couvre gouvernance |

---

## 10. Pages vérifiées

Accueil `/listen` · Explorer `/search` · Bibliothèque `/library` · Profil `/profile` · Wallet `/wallet` · Analytics `/creator/analytics` · Publication `/creator/catalog/tracks/new` · Catalogue `/creator/catalog` · Admin `/admin/*` · Settings `/settings/*` — toutes routées via le nouveau système factorisé.

---

## 11. Décision finale

```
═══════════════════════════════════════════════
MUSIC NAVIGATION EXPERIENCE CERTIFIED
Date : 7 juillet 2026
═══════════════════════════════════════════════

✅ Langage navigation Music OS officiel
✅ Composants factorisés shared/navigation
✅ Tokens --nav-* centralisés
✅ Icônes SVG famille unique
✅ Hiérarchies musicales par rôle
✅ Enterprise Shell intégré
✅ Build · Lint · Typecheck · Dev OK
```

---

*Prochaine étape recommandée : suppression CSS legacy sidebar (Vague J) + enrichissement contextuel live admin (storyPulse depuis LDSE).*
