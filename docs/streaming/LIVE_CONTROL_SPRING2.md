# LIVE CONTROL — SPRING 2 Runtime Integration
## Protocole de validation manuelle (Rémy)

> **Prérequis :** couche bridge implémentée + au moins `streaming_runtime_enabled` activable  
> **URL :** http://localhost:3000/listen  
> **Compte dev :** `dev@sonafrik.local` (voir `docs/DEV_LOGIN.md`)  
> **Rollback :** `/admin/flags` → désactiver le flag testé

---

## Préparation environnement

```powershell
# Terminal 1
cd "e:\PROJET SONAFRIK\apps\web"
pnpm dev

# Vérifier flags (tous OFF au départ)
# http://localhost:3000/admin/flags
```

Ouvrir DevTools : **Console** + **Network** (filtrer `stream-`).

---

## Scénario A — Baseline Legacy (flags OFF)

| # | Action | Critère succès | ✓ |
|---|---|---|---|
| A1 | Ouvrir `/listen` | Page charge, sections DB visibles | |
| A2 | Lancer un morceau | Audio joue < 5s | |
| A3 | Pause | Audio stop, pas d'erreur console | |
| A4 | Reprise | Audio reprend même position | |
| A5 | Seek milieu piste | Position saute, lecture continue | |
| A6 | Volume | Audible change | |
| A7 | Next (si queue) | Nouveau morceau, nouvelle session | |
| A8 | Previous | Comportement queue OK | |
| A9 | Network | `stream-start` 200, `stream-progress` périodique | |
| A10 | Attendre 30s+ | Heartbeats continus | |

**Capturer :** screenshot console + HAR si échec.

---

## Scénario B — Runtime (après bridge + flag actif)

Répéter A1–A10 avec le flag de l'étape en cours activé.

| Étape programme | Flag à activer |
|---|---|
| Coordinator observe | `streaming_runtime_enabled` + foundation flags |
| Session | + `streaming_session_engine_enabled` |
| Playback | + `streaming_playback_engine_enabled` |
| Signed URL | + `streaming_playback_signed_url_enabled` |
| Buffer | + `streaming_playback_buffer_enabled` |
| Recovery | + `streaming_playback_recovery_enabled` |

| # | Action | Critère succès | ✓ |
|---|---|---|---|
| B1 | Console log `[StreamingBridge] mode=runtime` | Visible au play | |
| B2 | Comparer temps démarrage vs Scénario A | ≤ +10 % | |
| B3 | Couper réseau 5s (recovery flag ON) | Reprise ou message erreur propre | |
| B4 | Désactiver flag en cours de lecture | Prochain play = legacy | |

---

## Scénario C — Rollback urgence (< 30s)

| # | Action | Critère | ✓ |
|---|---|---|---|
| C1 | Tous flags streaming/runtime → OFF | < 30s via admin | |
| C2 | Recharger `/listen`, jouer | Legacy fonctionne identique Scénario A | |

---

## Signature

| Champ | Valeur |
|---|---|
| Date | |
| Validateur | Rémy Goumou |
| Mode testé | Legacy / Runtime étape ___ |
| Résultat global | 🟢 PASS / 🔴 FAIL |
| Notes | |

**Sans signature :** programme reste `❌ MVP INTEGRATION REFUSÉ`.

---

## Rapport attendu post-LIVE CONTROL

```markdown
## LIVE CONTROL SPRING 2 — [DATE]
- Legacy baseline : PASS/FAIL
- Runtime étape N : PASS/FAIL
- Rollback : PASS/FAIL
- Régression UX : aucune / décrite
- Décision : autoriser étape N+1 / bloquer
```
