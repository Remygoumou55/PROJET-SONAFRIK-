# Audio Pipeline Remediation — SONAFRIK

> Programme officiel MVP · Juin 2026 · Suite du Certification Program

## Résumé exécutif

Le Certification Program a validé l'infrastructure (build, probes, CORS, runtime). Des **anomalies données** subsistaient : assets Storage corrompus, références orphelines, `track_files` créés avant confirmation PUT, absence de garde-fou publication.

Ce programme ajoute **intégrité bout-en-bout** sans modifier les moteurs gelés (Session, Playback Runtime enterprise, Wallet, Royalties, Ledger).

---

## Phase A — Root Cause Analysis

| Symptôme | Cause racine | Impact | Criticité | Correction |
|---|---|---|---|---|
| `stream-start` 500 | Objet Storage absent ou stub < 64o | Lecture impossible | P0 | Scan + `integrity_status=invalid` |
| `MEDIA_ERR_SRC_NOT_SUPPORTED` | Fichier non-MP3/M4A ou corrompu | Player bloqué | P0 | Validation magic bytes + message clair |
| `track_files` avant PUT | `persistAsset()` synchrone pré-upload | Références fantômes | P0 | `pending` → `confirm` post-PUT |
| Publication sans audio valide | RPC submit sans check intégrité | Catalogue pollué | P1 | Gate `integrity_status` |
| WAV/FLAC legacy | Bucket autorise, web non | Codec navigateur | P2 | `needs_review` + bloc stream-start |

---

## Phases B→K — Actions

| Phase | Livrable |
|---|---|
| B Storage | `scripts/remediate-audio-storage.ts` (dry-run / `--apply`) |
| C Metadata | Colonnes `integrity_status`, `content_hash`, `validated_at` |
| D Signed URL | Action `confirm` dans `catalog-asset-signed-url` |
| E Codec | `@sonafrik/shared` `audio-integrity.ts` + edge mirror |
| F Player | Messages explicites corrompu/incompatible |
| G Upload | AudioUploader : magic bytes + SHA-256 + confirm |
| H Self-healing | Remediation script idempotent + rapport JSON |
| I Observability | `content_hash`, `validated_at` (traceId = post-MVP) |
| J Tests | `packages/shared` vitest + probes |
| K Data | `docs/audio/remediation-report.json` généré |

---

## Commandes

```bash
pnpm probe:audio-remediation      # probe statique remediation
pnpm remediate:audio --dry-run    # scan sans écriture
pnpm remediate:audio              # applique integrity_status
pnpm test:audio                   # policy + shared integrity
pnpm probe:audio-certification    # certification pipeline
```

---

## Migration

`supabase/migrations/20260626140000_audio_integrity_remediation.sql`

---

## Rollback

Les scripts **ne suppriment jamais** de fichiers Storage. Rollback DB :

```sql
UPDATE track_files SET integrity_status = 'pending' WHERE validated_at > '<timestamp remediation>';
```

---

## Certification

🟢 **AUDIO PIPELINE REMEDIATION PRÊT** — en attente du LIVE CONTROL de Rémy.

Voir `AUDIO_HARDENING.md` pour la checklist humaine.
