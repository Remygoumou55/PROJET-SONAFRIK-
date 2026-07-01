# Parité mobile MVP — web vs Expo

> Dernière mise à jour : 30 juin 2026  
> Ratio actuel : ~38 fichiers TS/TSX mobile vs ~592 web

## Chemins critiques MVP (mobile)

| Parcours | Web | Mobile | Statut |
|---|---|---|---|
| Auth OTP | `/auth/connexion` | `app/auth/connexion` | ✅ |
| Écoute | `/listen` | `app/(tabs)/index` | ✅ partiel |
| Bibliothèque | `/library` | `app/(tabs)/library` | ✅ |
| Profil | `/profile` | `app/(tabs)/profile` | ✅ |
| Wallet | `/wallet` | `app/(tabs)/wallet` | ✅ |
| Upload créateur | `/creator/upload` | — | ❌ post-beta |
| Admin | `/admin` | — | ❌ web-only MVP |

## Règles MVP

- Mobile = **auditeur first** : écoute, favoris, wallet lecture
- Paiements mobile : via deep link web wallet jusqu'à intégration native opérateurs
- Profile OS / Career OS : **gelés** (flags OFF) sur web — mobile n'expose pas ces modules

## Prochaines étapes post-beta

1. Player heartbeat parity avec Session Engine web
2. Push notifications (sorties artistes suivis)
3. Offline cache bibliothèque (Expo FileSystem)
