# Artist Profile Hub — SRTSP Event Consumption (Phase 3.7)

## Événements actifs (registry + alias)

| Événement | Effet Profil |
|---|---|
| `creator.artist.updated` | Identité / hero synchronisés |
| `artist.profile.updated` | Nom, bio, genres |
| `artist.avatar.updated` | Avatar |
| `artist.cover.updated` | Bannière |
| `artist.social.updated` | Réseaux sociaux |
| `artist.verification.updated` | Badge vérification |
| `artist.badges.updated` | Badges |
| `artist.level.updated` | Niveau carrière |
| `artist.statistics.updated` | Stats publiques |
| `profile.invalidate` | Refresh ciblé |
| `identity.profile.updated` | LDSE → bridge SRTSP |
| `identity.invalidate` | Invalidation profil |

## Préparation (sans consommation active)

| Événement | Statut |
|---|---|
| `wallet.balance.updated` | Indicateurs wallet autorisés futurs |
| `creator.analytics.invalidate` | Stats publiques futures |
| `wallet.royalty.generated` | Revenus futurs |
| `stream.play.recorded` | Streaming futur |

## Ignorés

- `publication.draft.*` · upload wizard · metadata form

**Hooks :** `useArtistProfileSrtspLive` · `useArtistVerificationsSrtspLive`  
**Adaptateur :** `artist-profile-hub-consumer.ts`
