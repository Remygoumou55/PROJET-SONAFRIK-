# ENTERPRISE UI CONSISTENCY — Certification SONAFRIK

**Date :** 7 juillet 2026  
**Programme :** Enterprise UI Consistency & Design Governance  
**Décision :** ✅ **ENTERPRISE UI CONSISTENCY CERTIFIED**

---

## 1. Résumé exécutif

SONAFRIK dispose d'une **gouvernance visuelle Enterprise unifiée** : logo officiel factorisé, texte contexte blanc standardisé, sidebar pleine hauteur, header/cartes/tokens centralisés. Toute modification des composants partagés se propage automatiquement aux silos Auditeur, Artiste, Admin et Wallet.

---

## 2. Audit — incohérences détectées

| Zone | Incohérence | Gravité |
|---|---|---|
| Logo sidebar | Image directe dans `MusicSidebarBrand` + texte SONAFRIK admin séparé | Haute |
| Sous-titre logo | Or/doré sur artiste/listener, badge or sur admin | Haute |
| Libellés contexte | « Notre Bien Commun » vs « Espace Artiste » vs texte admin | Moyenne |
| Sidebar hauteur | `align-self: flex-start` + `max-height` — aspect coupé | Moyenne |
| Cartes | Règles dupliquées `enterprise-shell.css` + domaines | Moyenne |
| Typographie | Pas de hiérarchie tokenisée globale | Moyenne |
| Wallet header | Header ad-hoc hors `MusicHeader` | Moyenne |
| Skeleton listener | Classes legacy `listener-sidebar` / `ls-logo` | Basse |
| CSS legacy | `.cs-logo`, `.admin-logo-brand`, `.ls-logo-slogan` morts | Basse |

---

## 3. Incohérences corrigées

| Correction | Fichiers |
|---|---|
| Composant `SonafrikBrandLockup` officiel | `features/shared/design-system/SonafrikBrandLockup.tsx` |
| Logo unique via `SonafrikLogo` partout (sidebar incl. admin) | `MusicSidebarBrand.tsx` |
| Texte contexte **blanc** uniforme | `--ds-brand-context-color: #ffffff` |
| Libellés officiels : ESPACE AUDITEUR / ARTISTE / BACK-OFFICE / SUPER ADMIN | `BRAND_CONTEXT_LABELS` |
| Tokens `--ds-*` (couleurs, typo, espacements, rayons, ombres) | `globals.css` |
| Feuille DS Enterprise | `enterprise-design-system.css` |
| Sidebar pleine hauteur viewport | `enterprise-design-system.css`, `enterprise-shell.css` |
| Carte officielle `EnterpriseCard` | `features/shared/design-system/EnterpriseCard.tsx` |
| Header wallet → `MusicHeader` | `WalletLayoutClient.tsx` |
| Skeleton listener aligné Music OS | `ListenerSidebarAsync.tsx` |
| Suppression logo texte admin | `MusicSidebarBrand.tsx`, `music-navigation.css` |

---

## 4. Composants factorisés officiels

| Composant | Chemin | Usage |
|---|---|---|
| **Logo** | `@/components/shared/SonafrikLogo` | Seule source image/logo |
| **Brand lockup** | `@/features/shared/design-system/SonafrikBrandLockup` | Logo + contexte sidebar |
| **Sidebar** | `@/features/shared/navigation/MusicSidebar` | Tous silos |
| **Header** | `@/features/shared/navigation/MusicHeader` | Creator, Admin, Identity, Wallet |
| **Carte** | `@/features/shared/design-system/EnterpriseCard` | Bibliothèque officielle |
| **Navigation** | `@/features/shared/navigation/*` | Items, icônes, bottom nav |

---

## 5. Règle texte sous logo

```
Logo officiel (SonafrikLogo size sm, height 1.55rem)
↓ gap 0.25rem
Contexte (blanc #fff, 9px, bold 700, tracking 0.12em, uppercase)
```

Contenu variable · style **immuable**.

---

## 6. Design Tokens (`--ds-*`)

### Couleurs sémantiques
`--ds-color-bg` · `--ds-color-sidebar` · `--ds-color-header` · `--ds-color-content` · `--ds-color-card` · `--ds-color-border` · `--ds-color-primary` · `--ds-color-secondary` · `--ds-color-success` · `--ds-color-warning` · `--ds-color-danger` · `--ds-color-info` · `--ds-color-neutral`

### Typographie
H1 · H2 · H3 · section · card-title · kpi · body · secondary · muted — classes `.ds-h1` … `.ds-body-muted`

### Grille espacements
`--ds-space-xs` → `--ds-space-xl` · `--ds-gap-xs` → `--ds-gap-xl` · `--ds-padding-card`

### Rayons · ombres · motion
`--ds-radius-control` · `--ds-radius-card` · `--ds-radius-shell` · `--ds-shadow-card` · `--ds-transition-base` · `--ds-z-sidebar`

---

## 7. Silos vérifiés

| Silo | Logo | Contexte blanc | Sidebar | Header | Cartes DS |
|---|---|---|---|---|---|
| Auditeur | ✅ | ✅ ESPACE AUDITEUR | ✅ MusicSidebar | — | ✅ tokens |
| Artiste | ✅ | ✅ ESPACE ARTISTE | ✅ MusicSidebar | ✅ MusicHeader | ✅ tokens |
| Admin | ✅ | ✅ BACK-OFFICE | ✅ pleine hauteur | ✅ MusicHeader | ✅ tokens |
| Identity | ✅ | ✅ | ✅ | ✅ MusicHeader | ✅ tokens |
| Wallet | — | ✅ eyebrow | — | ✅ MusicHeader | ✅ tokens |

---

## 8. Accessibilité & responsive

- Logo : `alt` SONAFRIK via `SonafrikLogo`
- Contexte : texte lisible blanc sur fond jungle
- Sidebar : `min-height: 100dvh - marges`, sticky, marges extérieures shell
- Touch targets wallet nav conservés

---

## 9. Validation technique

| Contrôle | Résultat |
|---|---|
| `pnpm typecheck` | ✅ 17/17 |
| `pnpm lint` | ✅ 0 erreur |
| `pnpm build` | ✅ 50 pages |
| Logique métier / API / engines | ✅ Non modifiés |

---

## 10. Dette résiduelle (non bloquante)

| Item | Priorité |
|---|---|
| CSS mort `.cs-logo`, `.ls-logo`, `.admin-logo-*` | Basse — Vague J |
| Migration progressive vers `EnterpriseCard` dans domaines | Basse |
| Classes `.ds-h*` pas encore appliquées partout | Basse — adoption progressive |

---

## 11. Décision finale

```
═══════════════════════════════════════════════
ENTERPRISE UI CONSISTENCY CERTIFIED
Date : 7 juillet 2026
═══════════════════════════════════════════════
```

---

*Hard refresh recommandé après pull (`Ctrl+Shift+R`) pour synchroniser bundles client.*
