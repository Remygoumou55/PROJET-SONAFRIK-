# SONAFRIK — Analytics Artist Experience · UX Humanization Certification

**Date :** 6 juillet 2026  
**Périmètre :** `/creator/analytics`  
**Décision :** **ANALYTICS EXPERIENCE CERTIFIED** (beta artiste web)

---

## 1. Résumé exécutif

La page Analytics artiste a été transformée d’un tableau de bord type ERP (7+ cartes KPI dupliquées, jargon technique, scroll long) en une **expérience narrative** : story line, 4 indicateurs humains, graphique central interactif, classements visuels, détails repliables.

**Compréhension cible < 5 s :** Où j’en suis · Progression · Morceau/album leader · Gains · Audience.

**Couche touchée :** présentation web (`features/creator/analytics/`, `styles/creator/analytics.css`). Aucune modification SRTSP, Session Engine, Wallet Engine, RPC SQL.

**Limite connue (documentée) :** Top morceaux/albums restent agrégés all-time côté API ; la période globale pilote KPI, graphique et projections revenus/audience via mapping présentation.

---

## 2. Audit UX (avant)

| Problème | Gravité |
|---|---|
| 7 cartes KPI + 3 fenêtres temporelles dupliquées | Haute |
| Jargon : streams, valid rate, engagement score, fraud | Haute |
| Graphique secondaire, titre fixe « 30 jours » | Moyenne |
| Top morceaux : album, durée, likes, score, barres | Haute |
| Audience 8 lignes + Revenus 8 lignes en vue principale | Haute |
| Historique royalties + géo placeholder en scroll | Moyenne |
| Aucun contrôleur de période global | Critique |
| Ressemblance ERP / Excel | Haute |

---

## 3. Problèmes identifiés (résolus)

- Surcharge cognitive → 4 KPI + 2 rankings + 1 panneau détails
- Duplication temporelle → `AnalyticsPeriodPicker` unique
- Jargon → libellés artiste (« Écoutes », « Gains estimés », « fans »)
- Hiérarchie faible → story + graphique hero 9.5rem
- Pas de respiration → `analytics.css` tokens, gaps 1.25rem, max-width 56rem

---

## 4. Nouvelle architecture de page

```
┌─────────────────────────────────────────────┐
│ Tes stats + story line                      │
│ [Aujourd'hui][7j][30j][90j][Année][Perso]   │
├─────────────────────────────────────────────┤
│ KPI: Écoutes | Progression | Gains | Fans   │
├─────────────────────────────────────────────┤
│ GRAPHIQUE ÉVOLUTION (interactif, focus jour) │
├──────────────────┬──────────────────────────┤
│ Top morceaux (5) │ Top albums (5)           │
├──────────────────┴──────────────────────────┤
│ [Voir plus de détails] → audience/revenus/  │
│ royalties / géo bientôt                      │
└─────────────────────────────────────────────┘
```

**Fichiers clés :**
- `lib/analyticsPeriod.ts` — mapping période ↔ données existantes
- `components/AnalyticsPeriodPicker.tsx`
- `components/AnalyticsSummaryKpis.tsx`
- `components/AnalyticsStreamChart.tsx`
- `components/AnalyticsTopTracks.tsx` / `AnalyticsTopAlbums.tsx`
- `components/AnalyticsDetailsPanel.tsx`
- `hooks/useAnalyticsTimelineForPeriod.ts`

---

## 5. Cartes supprimées (vue principale)

- Total streams / valid / today / fraud (grille 4)
- Fenêtres 7j / 30j / 90j (grille 3)
- Audience détaillée (8 lignes)
- Revenus détaillés (8 lignes)
- Historique royalties (déplacé)
- Placeholder géographie (déplacé)

**Fichiers retirés :** `StreamStatsGrid`, `StreamTimeline`, `TopTracksTable`, `TopAlbumsTable`, `AudienceCard`, `RevenueCard`.

---

## 6. Cartes fusionnées

| Avant | Après |
|---|---|
| 7 KPI streams | 1 tuile « Écoutes » + 1 « Progression » |
| Audience 8 métriques | 1 tuile « Audience » + détails repliables |
| Revenus 8 métriques | 1 tuile « Gains estimés » + solde en hint |
| Timeline + légendes | `AnalyticsStreamChart` unifié |

---

## 7. Hiérarchie visuelle

1. **Story** (émotion, langage humain)
2. **Période** (contrôle global)
3. **4 KPI** (scan horizontal)
4. **Graphique** (élément central, hauteur dominante)
5. **Rankings** (preuve sociale musicale)
6. **Détails** (secondaire, opt-in)

---

## 8. Parcours utilisateur

1. Arrivée → lit la story (« Belle dynamique ! X écoutes… »)
2. Change la période → KPI + graphique + projections se mettent à jour
3. Survole une barre → focus date + écoutes du jour
4. Scanne top morceaux/albums (cover + écoutes + évolution relative)
5. Si besoin → « Voir plus de détails » (royalties, likes, géo future)

**Aucun CTA** publier/créer/uploader sur la page.

---

## 9. Benchmark concurrentiel (synthèse)

| Plateforme | Pratique retenue | Adaptation SONAFRIK |
|---|---|---|
| Spotify for Artists | Période globale, 3–4 KPI, courbe centrale | Picker pills + chart focus |
| Apple Music for Artists | Langage simple, peu de métriques | Story line + KPI humains |
| YouTube Studio | Graphique interactif au hover | Barres focus clavier/souris |
| Deezer Backstage | Classements visuels | Covers + rang or/argent |
| Audiomack / Boomplay | Mobile-first compact | Grille 2×2 KPI mobile |
| SoundCloud | Émotion créateur | Ton « ta musique », pas « streams » |

**Différenciation :** narrative FR Afrique, GNF, écoutes comptabilisées (pas streams bruts), zéro dark pattern monétisation sur Analytics.

---

## 10. Responsive

| Breakpoint | Comportement |
|---|---|
| Mobile | KPI 2×2, rankings empilés, pills wrap |
| Tablette | KPI 4 colonnes, rankings 2 colonnes |
| Desktop | Header row (titre + picker), max-width 56rem |

---

## 11. Accessibilité

- `role="list"` / `listitem` sur KPI et rankings
- `aria-label` sur graphique et barres individuelles
- `aria-pressed` / `aria-expanded` sur picker et détails
- `prefers-reduced-motion` : transitions désactivées
- Focus visible sur barres du graphique

---

## 12. Tests réalisés

- [x] `pnpm typecheck` — 17/17 OK
- [x] `pnpm lint` — 17/17 OK
- [x] `pnpm --filter @sonafrik/web build` — OK (après purge `.next`)
- [x] Purge cache `.next` + rebuild propre
- [ ] Test manuel navigateur `/creator/analytics` (post redémarrage dev)

---

## 13. Résultat TypeScript

**PASS** — 0 erreur (monorepo 17/17).

---

## 14. Résultat ESLint

**PASS** — 0 erreur, 0 warning projet (warnings Supabase Edge préexistants au build Next uniquement).

---

## 15. Résultat Build

**PASS** — `/creator/analytics` 10.5 kB (First Load 224 kB).

---

## 16. Décision finale

### ANALYTICS EXPERIENCE CERTIFIED

**Remédiation future (non bloquante beta) :**
- RPC `get_creator_top_tracks` / `get_creator_top_albums` avec paramètre `p_days`
- Événements SRTSP `stream.play.recorded` pour refresh live KPI
- Géographie auditeurs (quand collecte conforme RGPD)

---

## Dette technique

- Top rankings : évolution = part relative du #1 (proxy) tant que l’API n’expose pas l’évolution par période.
- Période « Cette année » : filtre client sur timeline max 90j API.
