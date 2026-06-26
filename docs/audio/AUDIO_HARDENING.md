# Audio Pipeline Hardening — Garde-fous SONAFRIK

> Référence technique · `docs/audio/AUDIO_REMEDIATION.md`

## Upload (Phase G)

### Client (`AudioUploader.tsx`)

1. MIME MP3/M4A uniquement  
2. Taille ≤ 50 Mo  
3. Magic bytes (`validateAudioAsset`)  
4. Durée via Web Audio API (rejet si 0)  
5. PUT Storage signé  
6. `confirmAssetUpload` : hash SHA-256 + validation serveur  

### Edge (`catalog-asset-signed-url`)

| Action | Comportement |
|---|---|
| `upload` | Signed PUT URL + `track_files` en `pending` |
| `confirm` | Download Storage, magic bytes, mise à jour `valid`/`invalid` |
| `read` | Refuse assets `invalid` |

---

## Lecture (Phase D/F)

### `stream-start`

- Refuse `integrity_status = invalid | needs_review`  
- Refuse blob < 64 octets  
- Formats web uniquement : mp3, aac (pas de fallback WAV/FLAC)  

### Player

| Erreur | Message | Retry |
|---|---|---|
| `MEDIA_ERR_SRC_NOT_SUPPORTED` | Fichier corrompu/incompatible | Non |
| `MEDIA_ERR_NETWORK` | Erreur réseau | Oui (1×) |
| Expired URL | Nouvelle tentative | Oui (1×) |

---

## Publication

`submit_track_for_review` exige fichier primaire avec `integrity_status` ∈ `{valid, pending}`.

Après remediation, seuls les assets `valid` devraient être soumis.

---

## Transcodage (préparé, non implémenté)

Architecture future :

```
Upload WAV/FLAC → integrity needs_review → queue transcode → MP3 master → valid
```

Module `audio-integrity.ts` : `needs_review` pour WAV/FLAC.

---

## LIVE CONTROL Rémy (obligatoire)

| # | Test | Critère |
|---|---|---|
| 1 | Upload MP3 | Barre 100% + « Fichier audio validé » |
| 2 | Upload M4A | Idem |
| 3 | Upload WAV | **Rejeté** côté client |
| 4 | Lecture | Audio < 5s, pas d'erreur console |
| 5 | Pause / reprise / seek | OK |
| 6 | Network | `stream-start` 200, pas de CORS rouge |
| 7 | Storage | PUT + confirm sans 422 |
| 8 | Session | `stream-progress` périodique |
| 9 | Piste S12B cert | Lecture OK |
| 10 | Console | 0× `MEDIA_ERR_SRC_NOT_SUPPORTED` |

**URL :** `http://localhost:3000` uniquement.

---

## Tests automatisés

```bash
pnpm test:audio
pnpm test:audio-pipeline
pnpm probe:audio-remediation
pnpm probe:audio-certification
pnpm build && pnpm lint && pnpm typecheck
```

---

*Architecture freeze respectée.*
