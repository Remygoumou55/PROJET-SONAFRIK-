# Liens de contrôle local — SONAFRIK

> Base : **http://localhost:3000** · Dev : `cd apps/web && pnpm dev:clean`  
> Dernière mise à jour : **27 juin 2026** (IDs vérifiés en DB live)

---

## 4 routes dynamiques — prêtes pour le contrôle

| Route | Lien direct | Donnée |
|---|---|---|
| Artiste public | http://localhost:3000/listen/artist/c1000001-0000-4000-8000-000000000001 | **Alpha Diallo** (seed public) |
| Artiste RMG (ton compte) | http://localhost:3000/listen/artist/8f55a13e-eae7-473c-85f3-505bdee4e6e7 | **RMG** |
| Album | http://localhost:3000/listen/album/a0b00001-0000-4000-8000-000000000001 | **Conakry Vibes** (published) |
| Playlist | http://localhost:3000/library/playlist/f1000001-0000-4000-8000-000000000001 | **Top Guinée Juillet 2026** (publique) |
| Droits créateur | http://localhost:3000/creator/rights/01000001-0000-4000-8000-000000000001 | **RMG — Morceau de contrôle** (workId) |

> **Important :** `/creator/rights/[id]` attend un **`workId`** (table `works`), pas un `contractId`.

Connexion requise pour : playlist perso, droits créateur (`/creator/rights/*`), wallet, admin.

---

## Albums seed (published)

- http://localhost:3000/listen/album/a0b00001-0000-4000-8000-000000000002 — Nuits Africaines
- http://localhost:3000/listen/album/a0b00002-0000-4000-8000-000000000001 — Cœur de Fouta
- http://localhost:3000/listen/album/a0b00003-0000-4000-8000-000000000001 — Griot Électrique
- http://localhost:3000/listen/album/a0b00004-0000-4000-8000-000000000001 — Rue Kaloum

---

## Playlists

| Titre | URL |
|---|---|
| Top Guinée Juillet 2026 (publique) | http://localhost:3000/library/playlist/f1000001-0000-4000-8000-000000000001 |
| Gospel du Dimanche (publique) | http://localhost:3000/library/playlist/f1000002-0000-4000-8000-000000000002 |
| Afro Vibes GN (publique) | http://localhost:3000/library/playlist/f1000003-0000-4000-8000-000000000003 |
| RMG (perso — login RMG) | http://localhost:3000/library/playlist/9b22cd8f-2a81-45bf-91b6-63cd8e8e0c0e |

---

## Artistes publics

- http://localhost:3000/listen/artist/c1000001-0000-4000-8000-000000000001 — Alpha Diallo
- http://localhost:3000/listen/artist/c1000002-0000-4000-8000-000000000002 — Faya
- http://localhost:3000/listen/artist/c1000003-0000-4000-8000-000000000003 — Djeli Sow
- http://localhost:3000/listen/artist/c1000004-0000-4000-8000-000000000004 — MC Fly
- http://localhost:3000/listen/artist/8f55a13e-eae7-473c-85f3-505bdee4e6e7 — RMG

---

## Régénérer les liens

```powershell
cd apps/web
node scripts/fetch-control-links.mjs
```

Pour les playlists / works (RLS anon), utiliser Supabase CLI :

```powershell
supabase db query --linked "SELECT id, title FROM playlists WHERE deleted_at IS NULL LIMIT 5;"
supabase db query --linked "SELECT id, title, creator_id FROM works WHERE deleted_at IS NULL LIMIT 5;"
```
