# SONAFRIK — Music Operating System Africain

**Version CDC :** 9.0 DÉFINITIF · **Date :** 10 Juin 2026  
**Statut :** ✅ APPROUVÉ POUR DÉVELOPPEMENT

> Source unique de vérité pour les développeurs. Toute décision antérieure contradictoire est remplacée par ce document.

## Référence rapide

| Élément | Valeur |
|---------|--------|
| Slogan | **NOTRE BIEN COMMUN** |
| Fond app | `#0D0D0D` (dark natif, jamais blanc) |
| Stack | Expo RN · Next.js 15 · Supabase · Turborepo |
| Revenue Pool artistes | **65% exact** (Règle #3) |
| Lancement public | **2 000 abonnés payants** minimum (Règle #7) |

## Les 10 règles absolues

1. **REAL LISTEN V7.2** — Barre non cliquable, calcul serveur, ≥90% = écoute valide
2. **Premium Jour 1 · Gratuit Jour 8**
3. **Revenue Pool = 65%** aux artistes
4. **Beat Store commission = 0 GNF**
5. **Pourboire** — commission 5% invisible UI
6. **`audit_logs` INSERT ONLY** (trigger PostgreSQL)
7. **2 000 abonnés payants** avant lancement public
8. **Logo CA** — A × 1.45, proportions figées
9. **Français par défaut**
10. **URLs audio pré-signées côté serveur uniquement**

## Ordre de développement

`Sprint 0 → 1 → 2 → … → 13`

Critère de passage : `pnpm install` + `pnpm lint` + `pnpm typecheck` + `pnpm build` = **0 erreur**

## Hors MVP (ne pas développer avant validation)

SONAFRIK Awards · Beat Store complet · Marketplace · Fan Tribes · Podcasts · AI Music Coach · Clé USB · etc.

## Architecture monorepo

```
sonafrik/
├── apps/web/          (Next.js 15)
├── apps/mobile/       (Expo React Native)
├── packages/ui/       (@sonafrik/ui)
├── packages/database/ (@sonafrik/database)
├── packages/types/    (@sonafrik/types)
├── packages/api/      (@sonafrik/api)
├── packages/shared/   (@sonafrik/shared)
├── supabase/
└── docs/
```

## Palette officielle

| Couleur | Hex | Usage |
|---------|-----|-------|
| Vert Énergie | `#00D26A` | CTA, états actifs |
| Vert Profond | `#009B3A` | Hover |
| Or Solaire | `#FFC20E` | Premium, slogan |
| Or Profond | `#F4A300` | Hover or |
| Noir Profond | `#0D0D0D` | Fond principal |
| Surface | `#1A1A1A` | Sidebar |
| Card | `#1F1F1F` | Cartes |
| Elevated | `#2A2A2A` | Modales |
| Bordure | `#333333` | Séparateurs |
| Texte Principal | `#FFFFFF` | Titres |
| Texte Secondaire | `#A0A0A0` | Métadonnées |
| Texte Désactivé | `#555555` | Inactif |

## 37 tables MVP (6 domaines)

- **Identity OS** : profiles, roles, permissions, role_permissions, user_roles, user_sessions
- **Creator OS** : creators, creator_roles, artist_profiles, labels, studios, creator_verifications
- **Streaming OS** : genres, artists, albums, tracks, track_files, playlists, playlist_tracks, favorites, stream_sessions, stream_events
- **Rights OS** : works, contributors, ownerships, ownership_versions, contracts, rights_claims
- **Wallet OS** : wallets, wallet_ledger, transactions, withdrawals, royalty_cycles, royalty_calculations, payout_accounts
- **Admin OS** : audit_logs, notifications, system_settings, feature_flags, fraud_flags

## Règles BDD critiques

- UUID partout · Soft delete `deleted_at`
- `wallet_ledger` : INSERT ONLY
- `audit_logs` : INSERT ONLY (trigger bloque UPDATE/DELETE)
- Ownership total = 100% obligatoire

## Document complet

Le CDC intégral V9.0 (20 parties) a été validé par Mr Rémy Nyanga le 10 Juin 2026.  
Consultez l'historique Notion ou la conversation fondateur pour le texte intégral des parties 1–20.

---

*SONAFRIK · Notre Bien Commun · Mr Rémy Nyanga, Fondateur*
