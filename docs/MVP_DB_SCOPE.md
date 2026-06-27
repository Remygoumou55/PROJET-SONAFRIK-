# Périmètre tables DB — MVP SONAFRIK

> **Problèmes audit #5–6, #21–22** — 31/65 tables vides en prod (27 juin 2026)  
> **Règle :** ne pas DROP sans confirmation Rémy. Gel documenté = hors MVP actif.

---

## Tables MVP actives (données > 0 ou flux critique)

| Domaine | Tables |
|---|---|
| Identity | `profiles`, `user_roles`, `roles`, `permissions`, `artist_profiles` |
| Catalog | `tracks`, `albums`, `genres`, `track_genres`, `album_genres`, `track_files` |
| Streaming | `stream_sessions`, `stream_events` |
| Social | `follows`, `favorites` |
| Wallet | `wallets`, `wallet_ledger`, `payment_intents`, `transactions`, `subscription_plans` |
| Rights | `ownerships`, `royalty_cycles`, `royalty_calculations` |
| Admin | `audit_logs`, `feature_flags`, `system_settings` |

---

## Tables vides — gel post-MVP (ne pas implémenter avant beta validée)

### Metadata / ISRC (9 tables `metadata_*`)

`metadata_works`, `metadata_recordings`, `metadata_releases`, `metadata_parties`, `metadata_rights`, `metadata_identifiers`, `metadata_contributions`, `metadata_audit`, `metadata_sync_jobs`

**Statut :** packages `metadata` / `persistence` gelés — voir `docs/MVP_PACKAGE_FREEZE.md`.

### Features roadmap

| Table | Raison gel |
|---|---|
| `beats`, `beat_purchases` | Beat Store hors MVP (`beat_store` flag off) |
| `studios`, `creators`, `creator_roles` | RBAC créateur v2 |
| `label_members` | Équipes label Phase 2 |
| `contracts` | Contrats avancés |
| `tips` | Tips live post-MVP |
| `contributors`, `works` | Droits avancés |
| `ownership_versions`, `rights_claims` | Workflow claims v2 |

### Tables prêtes code, usage prod en attente

| Table | Code existant | Bloquant |
|---|---|---|
| `withdrawals` | wallet + admin finance | Credentials opérateurs + sandbox E2E |
| `payout_batches` | admin Finance Center | Premier lot créé après sandbox |
| `payout_audit_logs` | RPC payout engine | Lié aux retraits |
| `playback_positions` | `save_playback_position` RPC + `pauseAndSave` player | Usage utilisateur réel |
| `notifications` | service notifications | Push/email post-beta |
| `user_preferences` | partiel | Settings v2 |
| `user_sessions` | analytics | Non branché UI |
| `creator_verifications` | flow KYC | Manuel admin |
| `payout_accounts` | wallet payout form | Lié retraits |

---

## Validation

```powershell
npx tsx scripts/probe-withdrawal-sandbox.ts
pnpm probe:certification
```
