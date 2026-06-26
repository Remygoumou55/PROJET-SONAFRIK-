# LIVE CONTROL — Performance & UX
## Protocole de validation manuelle (Rémy)

> **Prérequis :** `pnpm dev` · compte `dev@sonafrik.local` ([`DEV_LOGIN.md`](../DEV_LOGIN.md))  
> **Parcours complet :** Accueil → Recherche → Artiste → Lecture → Dashboard → Profil  
> **Rollback flags perf :** `/admin/flags` → désactiver `performance_*`

---

## Préparation

```powershell
cd "e:\PROJET SONAFRIK\apps\web"
pnpm dev
```

Ouvrir DevTools :

- **Performance** (enregistrement 10s par étape)
- **Network** (throttling : Fast 3G ou Slow 3G)
- **Console** (filtrer `StreamingBridge`, erreurs)
- **Lighthouse** (mobile, navigation)

Optionnel : Chrome DevTools → **Sensors** → CPU 4x slowdown (téléphone entrée de gamme).

---

## Parcours obligatoire

### 1. Accueil `/listen`

| # | Action | Critère | Temps cible | ✓ |
|---|---|---|---|---|
| L1 | Charger page (3G) | Contenu visible, skeletons disparaissent | LCP ≤4s 3G | |
| L2 | Scroll sections | Pas de jank visible | FPS ≥50 | |
| L3 | Network | ≤8 requêtes initiales hors assets | | |

### 2. Recherche `/search`

| # | Action | Critère | ✓ |
|---|---|---|---|
| S1 | Taper 3 caractères | Debounce ~300ms avant requête | |
| S2 | Résultats | Affichage <1s après debounce (4G) | |
| S3 | Effacer / retaper | Pas de résultats fantômes (stale guard) | |

### 3. Page artiste `/listen/artist/[id]`

| # | Action | Critère | ✓ |
|---|---|---|---|
| A1 | Ouvrir depuis recherche | Covers chargent (blur → image) | |
| A2 | Liste morceaux | Clic play sur 1 track | |

### 4. Lecture audio

| # | Action | Critère | ✓ |
|---|---|---|---|
| P1 | Play | Audio audible ≤3s (4G) · ≤8s (3G) | |
| P2 | Pause | Stop immédiat | |
| P3 | Resume | Reprend même position | |
| P4 | Seek milieu | Position correcte | |
| P5 | Volume | Changement audible | |
| P6 | Network | `stream-start` 200, `stream-progress` périodique | |
| P7 | 30s+ lecture | Heartbeats stables | |
| P8 | Console | `[StreamingBridge] mode=legacy` (flags OFF) | |

### 5. Dashboard artiste `/creator`

| # | Action | Critère | ✓ |
|---|---|---|---|
| D1 | Ouvrir dashboard | KPIs visibles <3s | |
| D2 | Scroll widgets | Pas de freeze >500ms | |
| D3 | `/creator/analytics` | Page charge (noter nb requêtes Network) | |

### 6. Publication (catalogue)

| # | Action | Critère | ✓ |
|---|---|---|---|
| C1 | `/creator/catalog/tracks` | Liste charge | |
| C2 | Navigation releases | Transitions fluides | |

### 7. Profil `/profile`

| # | Action | Critère | ✓ |
|---|---|---|---|
| PR1 | Ouvrir profil | Avatar + infos <2s | |
| PR2 | `/settings/preferences` | Formulaire réactif | |

---

## Mesures à capturer

| Métrique | Outil | Noter ici |
|---|---|---|
| LCP `/listen` | Lighthouse | |
| INP interaction play | Lighthouse / Performance | |
| CLS navigation | Lighthouse | |
| Time to play | Chronomètre clic→audio | |
| Requêtes réseau parcours | Network HAR export | |
| Mémoire JS heap | Performance monitor | |
| FPS scroll homepage | Performance recording | |

---

## Scénario Africa Mode (après activation flag)

Activer `performance_africa_mode_enabled` dans `/admin/flags`.

| # | Action | Critère | ✓ |
|---|---|---|---|
| AF1 | Throttle Slow 3G | Badge qualité économique visible player | |
| AF2 | Play morceau | Lecture démarre (même si plus lent) | |
| AF3 | Couper réseau 5s | Message erreur propre ou recovery | |
| AF4 | Désactiver flag | Comportement standard restauré | |

---

## Scénario rollback (<30s)

| # | Action | Critère | ✓ |
|---|---|---|---|
| R1 | Tous `performance_*` → OFF | Admin flags | |
| R2 | Recharger `/listen` | Identique baseline | |

---

## Signature

| Champ | Valeur |
|---|---|
| Date | |
| Testeur | Rémy Goumou |
| Desktop (navigateur) | |
| Mobile (navigateur / device) | |
| Throttling utilisé | |
| LCP `/listen` mesuré | |
| Time to play mesuré | |
| Bugs bloquants | |
| **Décision** | 🟢 VALIDÉ / 🔴 REFUSÉ |

---

## Après signature

1. Mettre à jour [`reports/CORE_WEB_VITALS_REPORT.md`](./reports/CORE_WEB_VITALS_REPORT.md) avec mesures réelles
2. Mettre à jour [`reports/UX_CERTIFICATION_REPORT.md`](./reports/UX_CERTIFICATION_REPORT.md)
3. Entrée dans [`EXECUTION_LOG.md`](../EXECUTION_LOG.md)
4. Si tous critères OK → décision `✅ PERFORMANCE & UX CERTIFICATION PROGRAM CERTIFIÉ`

---

*Complément streaming runtime : [`streaming/LIVE_CONTROL_SPRING2.md`](../streaming/LIVE_CONTROL_SPRING2.md)*
