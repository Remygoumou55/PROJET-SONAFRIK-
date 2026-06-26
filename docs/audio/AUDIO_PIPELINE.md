# Pipeline Audio SONAFRIK — Cartographie officielle

> Référence : `docs/audio/AUDIO_CERTIFICATION.md` · Juin 2026

## Chaîne économique

```
Écoute fiable → Session valide → Analytics → Royalties → Wallet → Ledger
```

Une rupture à n'importe quelle étape invalide toute la chaîne financière.

---

## Parcours complet (Phase B)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ CRÉATION                                                                │
│  Creator UI → packages/api/catalog → tracks + albums (DB)               │
└───────────────────────────────┬─────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ UPLOAD (Phase C)                                                        │
│  AudioUploader.tsx → catalog.service.requestAssetUploadUrl()            │
│  → Edge: catalog-asset-signed-url (action=upload)                       │
│  → Storage PUT signedUrl → bucket catalog-audio                         │
│  → track_files INSERT (format, file_path, is_primary)                  │
└───────────────────────────────┬─────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ VALIDATION / PUBLICATION                                                │
│  publication_status: draft → pending_review → published                 │
│  Admin catalog review (hors pipeline audio direct)                      │
└───────────────────────────────┬─────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ LECTURE — SIGNED URL (Phase E)                                          │
│  usePlayer → streaming.service.startStream()                            │
│  → Edge: stream-start                                                   │
│     • auth JWT                                                          │
│     • track published + track_files web-safe (mp3/m4a/aac)              │
│     • createSignedUrl catalog-audio (TTL 1800s)                         │
│     • RPC start_stream_session → sessionId                              │
└───────────────────────────────┬─────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ PLAYER (Phase G)                                                        │
│  playerContext.tsx → HTMLAudioElement                                 │
│  • play / pause / seek / volume                                         │
│  • audioError visible (codec / network / expired)                       │
│  • recovery URL expirée (usePlayer.ts)                                  │
└───────────────────────────────┬─────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ PLAYBACK RUNTIME (Phase H) — Legacy actif                               │
│  Heartbeat → stream-progress (STREAM_HEARTBEAT_INTERVAL_MS)             │
│  Fin morceau → stream-complete → is_valid_listen (90%+)                 │
│  Bridge: useStreamingPlaybackBridge (runtime enterprise = flags OFF)    │
└───────────────────────────────┬─────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ SESSION (Phase I) — STATE_MACHINE.md                                    │
│  Created → Authenticated → Active → Heartbeat → Completed / Expired     │
└───────────────────────────────┬─────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ ANALYTICS → ROYALTIES → WALLET (hors scope modification)                │
│  stream_sessions → royalty_cycles → wallet_ledger                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Points d'entrée / sortie

| Étape | Entrée | Sortie | Fichier clé |
|---|---|---|---|
| Upload MIME | `File` navigateur | `signedUrl` + `path` | `AudioUploader.tsx` |
| Storage | PUT bytes | Objet `catalog-audio` | Supabase Storage |
| Metadata fichier | upload | `track_files` row | `catalog-asset-signed-url` |
| Stream start | `trackId` | `sessionId` + `signedUrl` | `stream-start/index.ts` |
| Player | `signedUrl` | audio joué / `audioError` | `playerContext.tsx` |
| Session complete | `positionSeconds` | `is_valid_listen` | `stream-complete` |

---

## Formats MVP

| Format | Upload client | Storage bucket | Lecture web |
|---|---|---|---|
| MP3 | ✅ | ✅ | ✅ |
| M4A/AAC | ✅ | ✅ | ✅ |
| WAV | ❌ (rejeté UI) | ✅ (legacy) | ❌ |
| FLAC | ❌ | ✅ (legacy) | ❌ |

---

## Infrastructure transverse

| Couche | Module | Rôle |
|---|---|---|
| CORS | `_shared/cors.ts` | Edge Functions depuis localhost/prod |
| Signed URL cache | `signed-url-cache.ts` | Renouvellement mémoire (runtime partiel) |
| Politique certification | `scripts/lib/audio-pipeline-policy.ts` | MIME, magic bytes, TTL |

---

## Gaps observabilité (Phase J — post-MVP)

Présents MVP : `sessionId`, `trackId`, `userId` (via auth)

Absents MVP (documentés, non bloquants certification) :
- `playbackId`
- `correlationId`
- `traceId`

---

## Commandes certification

```bash
pnpm test:audio-pipeline      # unitaires policy
pnpm probe:audio-certification  # probe phases A→N
pnpm probe:cors                 # CORS edge (prérequis upload)
```

---

*Ne modifie pas Session Engine, Playback Runtime enterprise, Wallet, Royalties.*
