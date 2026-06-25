# ADR-002 — Stream Ledger comme source de vérité financière des écoutes

**Statut :** Accepté  
**Date :** 2026-06-25  
**Contexte :** SPRING 2.6 — chaîne écoute → royalties

## Contexte

Aujourd'hui :
- `stream_sessions.is_valid_listen = true` alimente directement les RPC analytics et le royalty engine SQL
- Pas de journal immuable **financier** intermédiaire
- Risque : recalcul royalties sans trace d'événement source, double comptage, audit impossible

La chaîne MVP exige : **écoute validée → royalties → wallet → retrait** (`MVP_SCOPE_LOCK.md`).

## Décision

Introduire une table **`stream_ledger_entries`** (nom proposé, migration en 2.6) :

| Propriété | Valeur |
|---|---|
| Mutabilité | INSERT ONLY (triggers comme `stream_events`) |
| Granularité | 1 entrée par écoute validée idempotente |
| Clé idempotence | `idempotency_key` = `session_id` (ou hash session+track+user) |
| Contenu | `session_id`, `track_id`, `user_id`, `artist_id`, `listen_percentage`, `revenue_pool_basis_gnf`, `recorded_at` |
| Émission | Uniquement par Session Engine après `complete` validé |

Le **Royalty Engine existant** lira le ledger en **lecture** (nouvelle RPC ou vue matérialisée) — modification hors périmètre SPRING 2.

## Conséquences

**Positives**
- Audit trail financier indépendant de `stream_sessions`
- Réconciliation royalties ↔ écoutes possible
- Anti-fraude peut invalider session **sans** écrire au ledger

**Négatives**
- Nouvelle table + RLS + migration
- Backfill historique optionnel (hors scope 2.6 initial)

## Invariants

1. Jamais d'entrée ledger si `is_valid_listen = false`
2. Jamais de double entrée (contrainte UNIQUE sur `idempotency_key`)
3. Jamais UPDATE/DELETE sur ledger
4. Wallet **ne lit pas** directement `stream_sessions` après 2.8 — passe par ledger ou vue certifiée

## Alternatives rejetées

| Alternative | Raison |
|---|---|
| Réutiliser `stream_events` comme ledger | Événements techniques ≠ événements financiers |
| Écrire direct dans `wallet_ledger` | Couplage fort, viole isolation domaines |
| Calcul royalties temps réel par écoute | Complexité règlementaire — cycles batch conservés |
