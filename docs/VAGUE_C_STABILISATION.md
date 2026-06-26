# Vague C — Nettoyage (audit forensique juin 2026)

> Ordre d'exécution : C1 → C2 → C3 → C4. Audit après chaque item.

## Statut global (re-audit — 16/16 probes)

| ID | Tâche | Statut | Notes |
|---|---|---|---|
| C1 | Séparer like vs favorite (RPC + table `likes`) | ✅ FAIT | + discovery/analytics alignés sur `likes` |
| C2 | Hex résiduels (web + mobile) | ✅ FAIT | `pnpm probe:hex-colors` 4/4 + 0 hex mobile |
| C3 | Beat store hors chemin MVP | ✅ FAIT | Flag OFF — search UI + API gated |
| C4 | Audit tables `permissions` / `rate_limits` | ✅ FAIT | `VAGUE_C_ORPHAN_TABLES.md` |

### Probe automatisé
```bash
pnpm probe:vague-c-stabilisation   # 16 checks forensique
pnpm probe:vague-c                 # certification C++ historique (admin layer)
pnpm probe:hex-colors              # Global SCS couleurs
```

---

## C1 — Like vs Favorite

**Problème :** `toggleLike()` appelait `toggle_favorite` → liker un morceau l'ajoutait à la bibliothèque.

**Solution :**
- Table `public.likes` (user_id, track_id)
- RPC `toggle_like`, `is_liked`
- `get_like_count` / `get_engagement_stats` lisent `likes`
- `social.repository.ts` : like → `toggle_like`, favori → `toggle_favorite`

Migration : `supabase/migrations/20260624160000_vague_c_likes_separation.sql`  
Discovery/analytics : `supabase/migrations/20260624170000_vague_c_discovery_likes_source.sql`

- `get_discovery_feed`, `get_suggested_albums`, `get_creator_top_tracks`, `get_creator_audience_stats` → source `likes`
- `LikeButton` : libellés a11y « Aimer » / « Retirer le like » (plus « favoris »)

---

## C2 — Hex résiduels

Web : probe `probe-hex-colors.ts` — allowlist `globals.css` + `GoogleAuthButton.tsx` uniquement.

Mobile : scan TS/TSX — 0 hex hardcodé attendu.

---

## C3 — Beat Store hors chemin critique

MVP_SCOPE_LOCK : Beat Store **POST-MVP**, flag `beat_store=false`.

| Zone | Comportement flag OFF |
|---|---|
| `/listen/beats` | `ComingSoon` |
| `/search` | Onglet Beats masqué, `includeBeats: false` |
| `streaming.service.search` | Pas d'appel `searchBeats` |

---

## C4 — Tables infrastructure

Voir `docs/VAGUE_C_ORPHAN_TABLES.md`.

---

## Prochaine vague

**A5 — LIVE CONTROL** (signature Rémy) — Vagues B, C, D et G validées.
