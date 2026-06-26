# Live Control MVP — Baseline préparation (24 juin 2026)

Mesures DB live **avant** le test fondateur (commit prep live-control).

| Métrique | Valeur |
|---|---:|
| Utilisateurs (`profiles`, non supprimés) | **188** |
| Morceaux publiés | **48** |
| Écoutes valides (90%+) | **5 524** |
| Cycles royalties | **1** |
| Entrées `wallet_ledger` | **9** |

## Environnement local requis (`apps/web/.env.local`)

| Variable | Valeur Live Control |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://cxjpburiiazzvlczzupy.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(présent)* |
| `SUPABASE_SERVICE_ROLE_KEY` | *(présent)* |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | **`true`** |
| `BYPASS_AUTH` | **`false`** |
| `NEXT_PUBLIC_BYPASS_AUTH` | **`false`** |
| `NEXT_PUBLIC_LOCAL_AUDIT_MODE` | **`false`** |

## Compte fondateur

- Email : `remygoumou55@gmail.com` — rôle **admin** accordé via migration `20260626100000_live_control_prep.sql`
- Téléphone : `+2230546508020` — même profil auditeur, admin accordé si ID distinct

## Données test

48 morceaux publiés déjà en base — **aucune seed supplémentaire nécessaire**.
