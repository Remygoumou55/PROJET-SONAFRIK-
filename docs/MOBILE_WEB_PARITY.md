# Parité Mobile vs Web (juin 2026)

## Web — Beta fermée ✅

| Domaine | Statut |
|---|---|
| Auth OTP / Google | ✅ |
| Onboarding auditeur + artiste | ✅ |
| Streaming + player | ✅ |
| Catalog créateur | ✅ |
| Wallet + abonnements | ✅ |
| Royalties + payout (staging) | ✅ |
| Admin | ✅ |

## Mobile — Pré-beta ⚠️

| Domaine | Statut |
|---|---|
| Auth | Connexion basique · SecureStore ✅ |
| Guard tabs | ✅ Redirect si pas session |
| Onboarding complet | ❌ Partiel |
| Streaming edge | Mini player basique |
| Catalog upload | ❌ |
| Wallet | Écran shell |
| Paiements opérateurs | ❌ |

## Règle produit

**MVP public = web first.** Mobile suit après validation LIVE CONTROL + credentials prod (voir `docs/ROADMAP_BLOCKERS.md`).

## Stack mobile

- Expo Router + `@sonafrik/ui` tokens
- `expo-secure-store` pour tokens auth
- Pas de parité feature avant Sprint mobile dédié (post-beta web)
