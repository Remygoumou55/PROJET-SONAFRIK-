# Audio Pipeline Certification Program — SONAFRIK

> Programme officiel MVP · Juin 2026

## Objectif

Certifier de bout en bout le pipeline audio sans modifier les moteurs gelés (Session Engine, Playback Runtime enterprise, Wallet, Royalties, Ledger).

---

## Phases et critères

| Phase | Nom | Vérification | Automatisé |
|---|---|---|---|
| A | Discovery | Fichiers pipeline présents | `probe:audio-certification` |
| B | Mapping | `AUDIO_PIPELINE.md` | probe |
| C | Upload | MP3/M4A, 50Mo, durée, PUT | probe + policy tests |
| D | Storage | bucket, RLS, track_files | probe |
| E | Signed URL | TTL, serveur-only, cache | probe + live HEAD |
| F | Codec | mp3/m4a/aac web, magic bytes | policy tests |
| G | Player | errors, seek, volume, recovery | probe |
| H | Playback | 3 edge functions, heartbeat | probe |
| I | Session | RPCs, sessionId | probe |
| J | Observability | sessionId/trackId (gaps documentés) | probe |
| K | Performance | heartbeat interval, preload | probe |
| L | Security | CORS, auth, ownership | probe + `probe:cors` |
| M | Tests | vitest policy + signed-url-cache | `pnpm test:audio-pipeline` |
| N | Live Control | humain Rémy | checklist ci-dessous |
| O | Documentation | ce fichier + PIPELINE | probe |

---

## Commandes obligatoires

```bash
pnpm test:audio-pipeline
pnpm probe:audio-certification
pnpm probe:cors
pnpm build && pnpm lint && pnpm typecheck
```

Tous doivent être **PASS** avant Live Control.

---

## Live Control Rémy (Phase N — obligatoire)

**Prérequis :**
- URL = `http://localhost:3000` (pas IP réseau)
- Connecté (OTP)
- Fichier test = `.mp3` ou `.m4a` < 50 Mo

### Checklist (cocher)

| # | Action | Critère succès |
|---|---|---|
| 1 | Créer/publier un morceau (ou utiliser existant) | Track `published` |
| 2 | Upload MP3 via AudioUploader | Barre 100%, pas d'erreur CORS |
| 3 | Ouvrir `/listen`, jouer le morceau | Audio audible < 5s |
| 4 | Pause / reprise | Position conservée |
| 5 | Seek milieu piste | Lecture continue |
| 6 | Écouter jusqu'à 90%+ | Pas d'erreur console |
| 7 | DevTools Network | `stream-start` 200, `stream-progress` périodique |
| 8 | DevTools Network | Pas de rouge sur `functions/v1/` ni `storage/v1/` |
| 9 | `/admin/live-control` | Écoutes valides augmentées |
| 10 | Console | 0× `MEDIA_ERR_SRC_NOT_SUPPORTED` |

### Diagnostic erreurs

| Symptôme | Couche | Action |
|---|---|---|
| CORS `functions/v1/catalog-asset` | Edge CORS | `pnpm probe:cors` |
| CORS `storage/v1/` | Storage PUT | vérifier signed URL valide |
| `MEDIA_ERR_SRC_NOT_SUPPORTED` | Codec | fichier doit être MP3/M4A |
| 401 stream-start | Auth | reconnecter OTP |
| 404 stream-start | Catalog | track non publié ou sans `track_files` |

---

## Matrice certification

| Domaine | Statut automatisé | Live Control |
|---|---|---|
| Upload | probe Phase C | Rémy étape 2 |
| Storage | probe Phase D | Rémy étape 2 |
| Signed URL | probe E + live HEAD | Rémy étape 3 |
| Codec | policy tests | Rémy étape 3 |
| Player | probe Phase G | Rémy étapes 3-6 |
| Playback | probe Phase H | Rémy étape 7 |
| Session | probe Phase I | Rémy étape 9 |
| CORS | `probe:cors` | Rémy étape 8 |

---

## Décision certification

### Automatisé (CI)

```
✅ AUDIO PIPELINE CERTIFICATION PROGRAM CERTIFIÉ (automatisé)
```

si `pnpm probe:audio-certification` = 100% ET tests PASS.

### Final (produit)

```
✅ AUDIO PIPELINE CERTIFICATION PROGRAM CERTIFIÉ
```

uniquement si automatisé **+** Live Control Rémy checklist 10/10.

```
❌ AUDIO PIPELINE CERTIFICATION PROGRAM REFUSÉ
```

si un check automatisé échoue OU Live Control bloqué.

---

## Fichiers du programme

| Fichier | Rôle |
|---|---|
| `scripts/lib/audio-pipeline-policy.ts` | Politique MIME/codec/TTL |
| `scripts/lib/audio-pipeline-policy.test.ts` | Tests unitaires |
| `scripts/probe-audio-pipeline-certification.ts` | Probe principal |
| `scripts/probe-browser-audio.ts` | Test Playwright codec (manuel) |
| `docs/audio/AUDIO_PIPELINE.md` | Cartographie |

---

*Architecture freeze respectée — aucune modification des moteurs gelés.*
