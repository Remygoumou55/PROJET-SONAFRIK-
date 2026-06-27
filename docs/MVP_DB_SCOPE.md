# Périmètre tables DB — MVP SONAFRIK

> **Audit 360 v4** — 65 tables · ~26 vides en prod (27 juin 2026)  
> **Règle :** ne pas DROP sans confirmation Rémy. Gel documenté = hors MVP actif.

---

## Tables MVP actives (données > 0 ou flux critique)

| Domaine | Tables |
|---|---|
| Identity | `profiles`, `user_roles`, `roles`, `permissions`, `artist_profiles`, `creator_verifications` |
| Catalog | `tracks`, `albums`, `genres`, `track_genres`, `album_genres`, `track_files` |
| Streaming | `stream_sessions`, `stream_events`, `playback_positions` |
| Social | `follows`, `favorites`, `likes` |
| Library | `playlists`, `playlist_tracks` |
| Wallet | `wallets`, `wallet_ledger`, `payment_intents`, `transactions`, `subscription_plans`, `withdrawals`, `payout_accounts`, `payout_audit_logs` |
| Rights | `royalty_cycles`, `royalty_calculations` |
| Admin | `audit_logs`, `feature_flags`, `system_settings` |

**Note :** `ownerships` — schéma actif, 0 rows prod (droits en attente de saisie créateur).

---

## Tables vides — gel post-MVP (ne pas implémenter avant beta validée)

### Metadata / ISRC (10 tables — migration `20260624220000`)

`metadata_platform_health`, `metadata_records`, `metadata_isrc_registry`, `metadata_isrc_sequence`, `metadata_upc_registry`, `metadata_registry_index`, `metadata_audit_log`, `metadata_version_snapshots`, `metadata_release_records`, `metadata_fingerprint_records`

**Statut :** packages `metadata` / `persistence` gelés — voir `docs/MVP_PACKAGE_FREEZE.md`.

### Features roadmap

| Table | Raison gel |
|---|---|
| `beats`, `beat_purchases` | Beat Store hors MVP (`beat_store` flag off) |
| `studios`, `creators`, `creator_roles` | RBAC créateur v2 |
| `label_members` | Équipes label Phase 2 |
| `contracts` | Contrats avancés |
| `contributors`, `works` | Droits avancés (UI partielle) |
| `ownership_versions`, `rights_claims`, `ownerships` | Workflow claims v2 |
| `tips` | Table présente, 0 rows — flux tip via wallet RPC |
| `track_credits` | Éditeur crédits présent, 0 rows prod |

### Tables prêtes code, usage prod en attente

| Table | Code existant | Bloquant |
|---|---|---|
| `payout_batches` | admin Finance Center | Premier lot admin après sandbox validé |
| `notifications` | service notifications | Push/email post-beta |
| `user_preferences` | partiel | Settings v2 |
| `user_sessions` | analytics | Non branché UI |
| `admin_notifications` | admin alerts | Usage admin |
| `rate_limits` | edge rate limit | Interne |

---

## Comptages live (27 juin 2026)

| Table | Rows |
|---|---|
| `profiles` | 189 |
| `tracks` | 73 |
| `stream_sessions` | 5 874 |
| `payment_intents` | 86 |
| `wallet_ledger` | 15 |
| `withdrawals` | 4 |
| `payout_accounts` | 1 |
| `likes` | 13 |
| `playlists` | 5 |

---

## Validation

```powershell
pnpm probe:withdrawal-sandbox
pnpm probe:certification
```
