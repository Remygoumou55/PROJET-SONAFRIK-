# PROMPT CURSOR — SONAFRIK LANDING PAGE V5
## Implémentation pixel-perfect · Next.js 15 · Zéro régression

---

## 🎯 MISSION

Tu vas implémenter la landing page publique de SONAFRIK (`/` ou `/home`) en Next.js 15 dans le monorepo Turborepo existant, en reproduisant **fidèlement et intégralement** la maquette de référence `sonafrik_landing_v5.html` fournie dans le projet. Aucune créativité non demandée. Aucun composant inventé. Tu reproduis ce que la maquette montre, point.

---

## ⚠️ RÈGLES ABSOLUES — À LIRE AVANT TOUT

1. **Zéro régression** : après chaque tâche, `pnpm build` + `pnpm turbo run lint typecheck` doivent passer avec **0 erreur, 0 warning TypeScript**. Si ce n'est pas le cas, tu corriges avant de passer à la tâche suivante.
2. **Zéro invention** : tu n'ajoutes aucune section, composant, animation ou texte qui n'est pas dans la maquette v5. Si quelque chose n'est pas dans la maquette, tu ne l'ajoutes pas.
3. **Zéro modification des autres pages** : tu ne touches à aucun fichier hors du scope défini ci-dessous.
4. **Lecture obligatoire avant code** : avant d'écrire la moindre ligne, tu lis les fichiers listés dans la section "Fichiers à lire en premier".
5. **Un commit par tâche** : chaque tâche terminée = un commit avec le message exact fourni + `Co-Authored-By: Claude Sonnet 4.6`.
6. **TypeScript strict** : tous les composants sont typés. Aucun `any`, aucun `// @ts-ignore`.
7. **Données dynamiques via Supabase** : le compteur de progression (`subscriberCount`) est lu depuis la table `profiles` en Supabase. Toutes les autres données de la maquette sont statiques dans le composant (elles ne changent pas souvent).
8. **Aucune librairie d'animation externe** (Framer Motion, GSAP, etc.) : les animations de la maquette (pulse du point vert, fill de la barre de progression) sont faites en CSS pur ou Tailwind uniquement.

---

## 📂 FICHIERS À LIRE EN PREMIER

Avant de commencer, lis ces fichiers dans cet ordre :

```
apps/web/app/layout.tsx          — layout racine, providers, fonts
apps/web/app/globals.css         — variables CSS globales, tokens de couleur
apps/web/lib/supabase/           — client Supabase (server + client)
apps/web/components/ui/          — composants UI existants (Button, Card…)
packages/design-tokens/          — tokens de couleur SONAFRIK si présent
sonafrik_landing_v5.html         — MAQUETTE DE RÉFÉRENCE (fournie dans le projet)
```

---

## 🗂️ SCOPE — FICHIERS À CRÉER/MODIFIER

```
apps/web/app/(public)/page.tsx                    ← page principale (CREATE ou REPLACE)
apps/web/app/(public)/layout.tsx                  ← layout public sans sidebar (CREATE si absent)
apps/web/components/landing/                      ← dossier dédié landing (CREATE)
  ├── LandingPage.tsx                             ← composant racine
  ├── LandingNav.tsx
  ├── LandingHero.tsx
  ├── LandingProgress.tsx
  ├── LandingPillars.tsx
  ├── LandingHowItWorks.tsx
  ├── LandingArtists.tsx
  ├── LandingPlans.tsx
  ├── LandingTransparencyNote.tsx
  ├── LandingComingSoon.tsx
  └── LandingFinalCTA.tsx
apps/web/lib/landing/getSubscriberCount.ts        ← fetch Supabase (CREATE)
```

**NE PAS TOUCHER** à ces chemins :
```
apps/web/app/(app)/              — espace connecté
apps/web/app/api/                — routes API
apps/web/middleware.ts           — auth middleware
supabase/migrations/             — migrations SQL
packages/                        — packages partagés
```

---

## 🎨 DESIGN SYSTEM — TOKENS OBLIGATOIRES

Ces valeurs sont **fixes et non négociables**. Elles viennent directement de la maquette v5.

### Couleurs
```
Background principal :  #0D0D0D
Vert SONAFRIK :         #00D26A
Or/Golden SONAFRIK :    #FFC20E
Blanc texte :           #ffffff
Texte secondaire :      rgba(255,255,255,0.5)
Texte tertiaire :       rgba(255,255,255,0.3)
Bordures subtiles :     rgba(255,255,255,0.08)
Bordures medium :       rgba(255,255,255,0.18)
Cards surface :         rgba(255,255,255,0.03)
Cards hover :           rgba(255,255,255,0.05)
```

### Logo — règle STRICTE (3 couleurs différentes)
```
"SON"  → color: #ffffff
"A"    → color: #FFC20E  (doré)
"FRIK" → color: #00D26A  (vert)
```

### Slogan sous le logo
```
Ligne 1 : "Notre Bien Commun"      → color: #FFC20E, font-size: 10px, letter-spacing: 2.5px, uppercase
Ligne 2 : "Écoute · Participe · Prospère" → color: rgba(255,255,255,0.3), font-size: 9px, letter-spacing: 2px, uppercase
```

### Lueurs de fond (5 glows positionnés en `position: fixed`, `z-index: 0`, `pointer-events: none`)
```
Glow 1 : top: -150px, left: -150px  | 600×600px | radial-gradient vert   rgba(0,210,106,0.07)
Glow 2 : top: 0,      right: -150px | 500×500px | radial-gradient doré   rgba(255,194,14,0.05)
Glow 3 : center center               | 900×500px | radial-gradient vert   rgba(0,210,106,0.04)  [ellipse]
Glow 4 : bottom: 0,   right: -100px | 600×400px | radial-gradient doré   rgba(255,194,14,0.04) [ellipse]
Glow 5 : bottom: 100px, left: -100px| 500×500px | radial-gradient bleu   rgba(55,138,221,0.05)
```

---

## 📋 PLAN D'IMPLÉMENTATION — 10 TÂCHES SÉQUENTIELLES

### TÂCHE 1 — Setup structure et layout public
**Objectif** : créer le layout public qui entoure la landing page sans la sidebar de l'app connectée.

- Créer `apps/web/app/(public)/layout.tsx` : layout minimal, fond `#0D0D0D`, pas de sidebar, pas de header global de l'app.
- Créer `apps/web/components/landing/` (dossier vide avec un `index.ts` barrel).
- Vérifier que la route `/` pointe bien vers `apps/web/app/(public)/page.tsx`.

**Commit** : `feat(landing): setup public layout and component structure`

---

### TÂCHE 2 — Fond et lueurs globales
**Objectif** : le fond `#0D0D0D` avec les 5 lueurs positionnées exactement comme la maquette.

- Dans `LandingPage.tsx`, créer un wrapper `<div className="relative overflow-hidden bg-[#0D0D0D] min-h-screen">`.
- Ajouter les 5 divs de lueur avec les propriétés CSS exactes (voir section Design System).
- Le contenu principal est dans un `<div className="relative z-[1] max-w-[960px] mx-auto px-6 pb-16">`.
- Les lueurs sont en `position: fixed` pour qu'elles restent visibles au scroll.

**Commit** : `feat(landing): add dark background and 5 radial glow effects`

---

### TÂCHE 3 — Navigation (`LandingNav.tsx`)
**Objectif** : reproduire exactement la barre de navigation de la maquette.

Structure exacte :
```
<nav> flex justify-between items-center | padding: 24px 0 28px | border-bottom: 0.5px solid rgba(255,255,255,0.08) | margin-bottom: 52px

  Gauche — .nav-brand (flex-col, gap: 3px)
    .nav-logo (font-size: 22px, font-weight: 600, letter-spacing: 4px)
      <span style="color:#fff">SON</span>
      <span style="color:#FFC20E">A</span>
      <span style="color:#00D26A">FRIK</span>
    .nav-slogan : "Notre Bien Commun" (10px, #FFC20E, letter-spacing 2.5px, uppercase)
    .nav-punch  : "Écoute · Participe · Prospère" (9px, rgba(255,255,255,0.3), letter-spacing 2px, uppercase)

  Droite — flex gap-3
    Bouton "Se connecter" → ghost style (border: 0.5px rgba(255,255,255,0.18), text rgba(255,255,255,0.65), padding 8px 18px, border-radius 8px)
    Bouton "Rejoindre"    → primary style (bg #00D26A, text #0D0D0D, font-weight 600, padding 8px 18px, border-radius 8px)
```

- "Se connecter" → `router.push('/login')` ou `href="/login"`.
- "Rejoindre" → `router.push('/register')` ou `href="/register"`.

**Commit** : `feat(landing): implement navigation with tricolor logo and slogan`

---

### TÂCHE 4 — Hero section (`LandingHero.tsx`)
**Objectif** : reproduire la section hero avec la pill animée, le titre, le sous-titre, les CTA et la barre de progression.

Structure exacte :
```
<section> text-center | padding-bottom: 64px

  1. PILL ANIMÉE
     display: inline-flex, items-center, gap: 6px
     bg: rgba(0,210,106,0.08), border: 0.5px solid rgba(0,210,106,0.25), color: #00D26A
     font-size: 12px, padding: 5px 14px, border-radius: 20px, margin-bottom: 28px
     Contenu : [point vert animé] + "Lancement en cours — Guinée Conakry"
     Point vert : 6×6px, border-radius: 50%, bg: #00D26A
     Animation CSS keyframes "pulse" : 0%,100%{opacity:1} 50%{opacity:0.4}, durée 2s, infinite

  2. TITRE H1
     font-size: 44px, font-weight: 600, line-height: 1.2, color: #ffffff
     "La musique guinéenne" + <br/>
     <em style="color:#00D26A; font-style:normal">mérite sa plateforme</em>

  3. SOUS-TITRE
     font-size: 16px, color: rgba(255,255,255,0.5), max-width: 500px, margin: 16px auto 36px
     "SONAFRIK rémunère directement les artistes. Chaque écoute compte. Rejoignez la communauté qui débloque le lancement."

  4. BOUTONS CTA
     flex, justify-center, gap: 12px, margin-bottom: 16px
     Bouton principal "Rejoindre comme artiste →" : bg #00D26A, text #0D0D0D, font-size 15px, font-weight 600, padding 13px 28px, border-radius 8px → href="/register?role=artist"
     Bouton secondaire "Rejoindre comme auditeur" : transparent, border 0.5px rgba(255,255,255,0.2), text #fff, même padding → href="/register?role=listener"

  5. HINT
     "Gratuit · Aucune carte requise · 2 minutes"
     font-size: 12px, color: rgba(255,255,255,0.28)
```

**Commit** : `feat(landing): implement hero section with animated pill and CTA buttons`

---

### TÂCHE 5 — Carte de progression (`LandingProgress.tsx`)
**Objectif** : la carte de compteur d'abonnés avec barre de progression et jalons.

Données dynamiques :
- `subscriberCount` : lu depuis Supabase via `getSubscriberCount()` (Server Component ou fetch côté serveur).
- `targetCount` : constante `2000`.
- Calcul automatique du pourcentage et du nombre restant.

Structure exacte :
```
Carte : bg rgba(255,255,255,0.04) | border 0.5px rgba(255,255,255,0.1) | border-radius 14px
        padding 24px 28px | max-width 520px | margin 36px auto 0

  Header (flex justify-between)
    Gauche :
      Label "OBJECTIF DE LANCEMENT" (11px, rgba(255,255,255,0.3), uppercase, letter-spacing 1px)
      Nombre "{subscriberCount}" gros (28px, font-weight 600, #fff)
        suivi " / 2 000 abonnés" (16px, rgba(255,255,255,0.35), font-weight 400)
    Droite : badge "{pct} %" (bg rgba(0,210,106,0.12), color #00D26A, 13px, font-weight 600, padding 4px 10px, border-radius 8px)

  Barre de progression :
    Track : height 6px, bg rgba(255,255,255,0.08), border-radius 3px
    Fill  : height 6px, background linear-gradient(90deg, #00D26A, #00ff88), width = pct%
    Animation CSS : la fill démarre à 0% et transite vers la vraie valeur en 1.5s ease au mount (useEffect + CSS transition)

  Message : "Plus que {remaining} abonnés pour le lancement officiel"
    font-size 13px, color rgba(255,255,255,0.4)
    {remaining} en <strong style="color:rgba(255,255,255,0.8)">

  Jalons (4 segments + labels) :
    Segment 1 : bg #00D26A (bêta déjà atteint si count>0, sinon rgba(255,255,255,0.08))
    Segments 2,3,4 : bg rgba(255,255,255,0.08) sauf si leur seuil est atteint
    Labels : "500 ✓ Bêta" | "1 000" | "1 500" | "2 000 🚀"
    font-size 10px, couleurs respectives selon état atteint ou non
```

**Commit** : `feat(landing): add live progress card with Supabase subscriber count`

---

### TÂCHE 6 — Pilliers valeur + Steps (`LandingPillars.tsx` + `LandingHowItWorks.tsx`)
**Objectif** : sections "Pourquoi SONAFRIK" (3 cartes) et "Comment ça marche" (3 étapes).

**Section Pilliers :**
```
Section label : "POURQUOI SONAFRIK" (11px, rgba(255,255,255,0.28), uppercase, letter-spacing 1.5px)
Section title : "Construit pour les artistes guinéens" (24px, font-weight 600, #fff)
Texte intro (max-width 600px, centré) :
  Ligne 1 : "En Guinée, des artistes talentueux créent chaque jour — et ne gagnent presque rien." (17px, font-weight 600, #fff)
  Ligne 2 : "SONAFRIK est né pour changer ça..." (15px, rgba(255,255,255,0.45), margin-top 10px)

3 cartes en grid (auto-fit, minmax 220px)
Chaque carte : bg rgba(255,255,255,0.03) | border 0.5px rgba(255,255,255,0.08) | border-radius 14px | padding 22px

  Carte 1 — icône fond vert rgba(0,210,106,0.12)
    Titre : "65 % des abonnements pour les artistes"
    Corps : "Sur chaque abonnement payé, 65 francs sur 100 sont reversés aux artistes — répartis entre eux selon le nombre d'écoutes réelles."
    Note   : "Plus votre musique est écoutée, plus votre part est grande. Chaque auditeur contribue à tous les artistes qu'il écoute."

  Carte 2 — icône fond amber rgba(255,194,14,0.12)
    Titre : "Beat Store sans commission"
    Corps : "Les beatmakers vendent leurs instrumentaux directement sur SONAFRIK, car ils doivent aussi vivre de leur passion et de leurs œuvres."
    Note   : "Zéro frais prélevés. Ce que l'acheteur paie vous revient intégralement."

  Carte 3 — icône fond bleu rgba(55,138,221,0.12)
    Titre : "Pourboires : 95 % à l'artiste"
    Corps : "Quand un fan vous envoie un pourboire, 95 % lui arrivent directement. SONAFRIK garde uniquement 5 % pour maintenir la plateforme."
    Note   : "Pas de délai, pas d'écran intermédiaire. Le geste du fan devient immédiatement de l'argent pour vous."

Style note : font-size 11px, rgba(255,255,255,0.28), border-top 0.5px rgba(255,255,255,0.06), padding-top 10px, margin-top 10px
```

**Section How It Works :**
```
3 colonnes (grid 3×1fr) avec ligne horizontale de connexion (::before, top:18px, height:0.5px, rgba(255,255,255,0.07))
Étape 1 : cercle VERT (bg #00D26A, text #0D0D0D) — "Vous créez votre compte" — "Artiste ou auditeur — deux minutes, numéro de téléphone guinéen suffit."
Étape 2 : cercle gris (bg rgba(255,255,255,0.04), border 0.5px rgba(255,255,255,0.14)) — "Vous écoutez ou publiez" — "Chaque écoute génère des points de royalties. Chaque upload est modéré puis mis en ligne."
Étape 3 : cercle gris — "L'argent circule" — "Les artistes retirent leurs revenus sur Orange Money ou MTN directement depuis l'app."
```

**Commit** : `feat(landing): add value pillars and how-it-works sections`

---

### TÂCHE 7 — Section Artistes (`LandingArtists.tsx`)
**Objectif** : grille des 5 premiers artistes.

```
5 cartes en flex wrap justify-center, gap 10px
Chaque carte : flex items-center, gap 10px | bg rgba(255,255,255,0.04) | border 0.5px rgba(255,255,255,0.08) | border-radius 14px | padding 12px 16px | min-width 160px

Avatar circulaire 38×38px, border-radius 50%, initiales centrées (13px, font-weight 600)
Couleurs des avatars (bg/text) :
  Alpha Diallo  → bg #0F6E56 / text #9FE1CB  — genre "Afrobeat"
  Faya          → bg #0C447C / text #B5D4F4  — genre "R&B Africain"
  Djeli Sow     → bg #3C3489 / text #CECBF6  — genre "Traditionnel"
  MC Fly        → bg #634400 / text #FAC775  — genre "Rap GN"
  SeK           → bg #3B2212 / text #F5C4B3  — genre "Gospel"

Pill de stat en dessous : "🎵 5 artistes · 30 morceaux · Guinée Conakry"
  bg rgba(255,255,255,0.04) | border 0.5px rgba(255,255,255,0.08) | padding 7px 16px | border-radius 20px
```

**Commit** : `feat(landing): add founding artists section`

---

### TÂCHE 8 — Section Abonnements (`LandingPlans.tsx`)
**Objectif** : 4 formules en grille + Pack Diaspora pleine largeur.

**Grille des 4 formules** (`grid-template-columns: repeat(4, 1fr)`, gap 14px) :

Pour chaque formule, la structure est identique :
```
badge | titre | prix | économie (si applicable) | tagline
--- divider ---
"CE QUE VOUS AVEZ" (label section)
liste des fonctionnalités avec ✓ (color #00D26A) ou ✗ (color rgba(255,255,255,0.18))
--- divider ---
"COMMENT PAYER" (label section)
liste des méthodes de paiement (chacune dans une sub-card rgba(255,255,255,0.04))
```

Données exactes par formule :
```
JOURNALIER — badge gris "Journalier"
  Prix : 5 000 GNF / jour | Pas d'économie affichée
  Tagline : "Accès complet pour une journée."
  Fonctionnalités :
    ✓ Écoute illimitée + hors ligne
    ✓ Réactions illimitées
    ✓ 1 vote Awards
    ✗ Cloud personnel
  Paiements :
    ● Orange (dot #FF6600) : "Orange Money" | "Instantané · Partout en Guinée" | "Depuis votre téléphone"
    ● MTN    (dot #FFCC00) : "MTN Mobile Money" | "Instantané · Partout en Guinée" | "Depuis votre téléphone"

HEBDOMADAIRE — badge gris "Hebdomadaire"
  Prix : 25 000 GNF / semaine | Économie : "−5 000 GNF vs journalier"
  Tagline : "Une semaine entière, sans interruption."
  Fonctionnalités :
    ✓ Écoute illimitée + hors ligne
    ✓ Réactions illimitées
    ✓ 3 votes Awards / jour
    ✓ Cloud personnel 2 GB
  Paiements : Orange Money + MTN Mobile Money (même données que Journalier)

MENSUEL — badge VERT "Le plus populaire" — carte avec border 1.5px #00D26A + bg rgba(0,210,106,0.04)
  Prix : 80 000 GNF / mois | Économie : "−70 000 GNF vs journalier"
  Tagline : "L'expérience complète, le meilleur rapport."
  Fonctionnalités :
    ✓ Écoute illimitée + hors ligne
    ✓ Réactions illimitées
    ✓ 5 votes Awards / jour
    ✓ Cloud personnel 5 GB
    ✓ Accès aux fonctions Bêta
  Paiements : Orange Money + MTN Mobile Money

ANNUEL — badge AMBER "Meilleure valeur"
  Prix : 700 000 GNF / an | Économie : "2 mois offerts vs mensuel"
  Tagline : "Engagez-vous un an, économisez deux mois."
  Fonctionnalités :
    ✓ Tout ce qu'inclut le mensuel
    ✓ Cloud personnel 10 GB
    ✓ Badge "Fidèle SONAFRIK"
    ✓ Accès prioritaire nouveautés
  Paiements :
    ● Orange : "Unique ou en 2 fois · Instantané" | "Paiement fractionné disponible"
    ● MTN    : "Unique ou en 2 fois · Instantané" | "Paiement fractionné disponible"
    ● Carte  (dot #185FA5) : "Carte bancaire" | "Visa, Mastercard · Sécurisé" | "Pour membres hors Guinée"
```

**Pack Diaspora** (sous les 4 formules, pleine largeur, `margin-bottom: 28px`) :
```
Carte : border rgba(55,138,221,0.25) | bg rgba(55,138,221,0.03) | border-radius 14px | padding 18px
Layout interne : grid 2 colonnes — [220px gauche | 1fr droite avec 2 sous-colonnes]

Colonne gauche :
  Badge BLEU "Diaspora"
  Titre : "Pack Diaspora" (16px, font-weight 600)
  Prix : "5 EUR / mois" (20px, color #00D26A)
  Tagline : "Vous vivez à l'étranger et voulez soutenir la musique guinéenne ? Ce pack est fait pour vous." (12px, max-width 200px)

Colonne droite (2 sous-colonnes égales) :
  Sub-col gauche — "CE QUE VOUS AVEZ"
    ✓ Tout ce qu'inclut le mensuel
    ✓ 10 votes Awards / jour
    ✓ Support client prioritaire
    ✓ Facturé en devise internationale
  Sub-col droite — "COMMENT PAYER"
    ● Carte (dot #185FA5) : "Carte bancaire" | "Visa, Mastercard · Sécurisé" | "Facturé en EUR depuis n'importe quel pays"
    ● PayPal (dot #7F77DD) : "PayPal / virement" | "Délai 24 à 48h selon la banque" | "Pour ceux sans carte internationale"
```

**Note de transparence** (après la section plans) :
```
Box : bg rgba(0,210,106,0.05) | border 0.5px rgba(0,210,106,0.16) | border-radius 14px | padding 20px 24px | max-width 700px | margin 0 auto 56px
Icône ℹ en vert #00D26A (font-size 20px) + texte :
  Titre (14px, font-weight 600, #fff) : "Comment votre abonnement profite aux artistes"
  Corps (13px, rgba(255,255,255,0.48), line-height 1.65) :
  "Sur chaque abonnement, 65 % sont partagés entre tous les artistes que vous écoutez, au prorata de leurs écoutes.
  Si vous passez votre mois à écouter un seul artiste, il reçoit la totalité de ces 65 %.
  Si vous en écoutez dix, chacun reçoit sa part.
  Les 35 % restants couvrent les coûts techniques et le développement de la plateforme."
  "65 %" est en <strong style="color:#fff">
```

**Commit** : `feat(landing): implement all subscription plans and transparency note`

---

### TÂCHE 9 — Section Coming Soon (`LandingComingSoon.tsx`)
**Objectif** : 5 cartes de fonctionnalités à venir.

Chaque carte a une barre colorée de 2px en top, une icône, un badge et des target pills.

```
Section label : "CE QUI ARRIVE BIENTÔT"
Section title : "SONAFRIK, c'est bien plus qu'une appli de musique"
Section sub   : "Chaque créateur — musicien, podcasteur, influenceur, vlogeur — trouvera sa place ici. Voici ce que nous construisons pour vous."

Grid : auto-fit minmax(270px, 1fr), gap 14px
Chaque carte : bg rgba(255,255,255,0.03) | border 0.5px rgba(255,255,255,0.08) | border-radius 14px | padding 22px | overflow hidden
Barre top 2px via ::before (couleur varie par carte)

--- 5 CARTES ---

1. SONAFRIK AWARDS
   Barre : #FFC20E | Icône bg: rgba(255,194,14,0.1)
   Badge : "En développement" VERT (bg rgba(0,210,106,0.1), color #00D26A, border rgba(0,210,106,0.22))
   Titre : "SONAFRIK Awards"
   Corps : "La première cérémonie de récompenses musicales guinéennes entièrement décidée par les fans. Votez, suivez les classements en direct — les lauréats reçoivent leurs prix automatiquement."
   Pills : "Artistes" · "Auditeurs" · "Fans Premium"

2. ESPACE CRÉATEURS
   Barre : #378ADD | Icône bg: rgba(55,138,221,0.1)
   Badge : "Bientôt" GRIS
   Titre : "Espace Créateurs"
   Corps : "TikTokeurs, YouTubeurs, vlogeurs, blogueurs, podcasteurs — SONAFRIK ouvre un espace dédié où vous publiez vos contenus, construisez votre audience guinéenne et monétisez vos créations."
   Pills : "TikTokeurs" · "Podcasteurs" · "Vlogeurs" · "Blogueurs" · "Influenceurs"

3. FANS TRIBU
   Barre : #00D26A | Icône bg: rgba(0,210,106,0.1)
   Badge : "Bientôt" GRIS
   Titre : "Fans Tribu"
   Corps : "Chaque artiste crée sa tribu de fans fidèles. Avant-premières, contenus exclusifs, sessions privées — les membres d'une tribu vivent l'artiste de l'intérieur."
   Pills : "Artistes" · "Fans Premium" · "Communauté"

4. MARKETPLACE SONAFRIK
   Barre : #7F77DD | Icône bg: rgba(127,119,221,0.1)
   Badge : "Bientôt" GRIS
   Titre : "Marketplace SONAFRIK"
   Corps : "Merchandising, œuvres numériques, sessions studio, formations musicales — les artistes vendent directement, sans quitter l'application."
   Pills : "Artistes" · "Beatmakers" · "Producteurs" · "Auditeurs"

5. LIVES & ÉVÉNEMENTS
   Barre : #D85A30 | Icône bg: rgba(216,90,48,0.1)
   Badge : "Bientôt" GRIS
   Titre : "Lives & Événements"
   Corps : "Concerts en direct, sessions acoustiques, interviews. Les fans regardent, réagissent et envoient des pourboires en temps réel pendant le live."
   Pills : "Artistes" · "Organisateurs" · "Médias" · "Fans"

--- ENCART CRÉATEURS (sous la grille) ---
Box : bg rgba(255,255,255,0.03) | border 0.5px rgba(255,255,255,0.08) | border-radius 14px | padding 28px | text-align center
  Titre : "Vous êtes créateur de contenu ?" (15px, font-weight 600, #fff)
  Sous-titre : "Rejoignez la liste d'attente des créateurs fondateurs. Les premiers inscrits auront un accès prioritaire et des conditions exclusives au lancement." (13px, rgba(255,255,255,0.42), margin-bottom 18px)
  Bouton : "Rejoindre la liste créateurs →" → href="/register?role=creator" (même style que btn-cta-main)
```

**Commit** : `feat(landing): add coming soon features section with 5 cards`

---

### TÂCHE 10 — Final CTA + assemblage + tests (`LandingFinalCTA.tsx` + `LandingPage.tsx`)
**Objectif** : section finale + assembler tous les composants + validation complète.

**Final CTA :**
```
Box : bg rgba(255,255,255,0.03) | border 0.5px rgba(255,255,255,0.08) | border-radius 14px | padding 48px | text-align center
H2 : "Votre place est ici." (28px, font-weight 600, #fff, margin-bottom 12px)
P  : "Chaque abonné fait avancer le compteur. Ensemble, on débloque le lancement et on change comment la musique guinéenne est valorisée." (15px, rgba(255,255,255,0.45), max-width 500px, margin: auto, line-height 1.65)
Boutons : même structure que hero (principal + secondaire)
  Bouton principal : "Rejoindre maintenant →" → href="/register"
  Bouton secondaire : "En savoir plus" → href="/about" (ou scroll vers section)
```

**Assemblage `LandingPage.tsx`** (ordre exact) :
```tsx
<div bg #0D0D0D + glows>
  <div max-w-[960px] mx-auto px-6 pb-16 relative z-[1]>
    <LandingNav />
    <LandingHero>
      <LandingProgress />   ← à l'intérieur du Hero comme dans la maquette
    </LandingHero>
    <Divider />
    <LandingPillars />
    <LandingHowItWorks />
    <Divider />
    <LandingArtists />
    <LandingPlans />
    <LandingTransparencyNote />
    <Divider />
    <LandingComingSoon />
    <LandingFinalCTA />
  </div>
</div>
```

**Responsive (tel que défini dans la maquette) :**
```
≤700px : plans-grid passe en 2 colonnes | diaspora-inner en 1 colonne | hero h1 → 30px
≤480px : plans-grid en 1 colonne | steps en 1 colonne (ligne de connexion masquée)
```

**Validation finale obligatoire :**
```bash
pnpm build                        # 0 erreur
pnpm turbo run lint typecheck     # 0 erreur, 0 warning
```

Ouvre `http://localhost:3000` et vérifie visuellement chaque section contre la maquette v5.

**Commit** : `feat(landing): assemble full landing page v5 and validate build`

---

## 🔧 DONNÉES SUPABASE — `getSubscriberCount.ts`

```typescript
// apps/web/lib/landing/getSubscriberCount.ts
import { createClient } from '@/lib/supabase/server'

export async function getSubscriberCount(): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_subscriber', true)

  if (error) {
    console.error('[getSubscriberCount]', error)
    return 0
  }
  return count ?? 0
}
```

Adapte la colonne/table si la structure réelle est différente (ex: table `subscriptions` avec `status = 'active'`). Demande-moi si tu n'es pas sûr de la structure.

---

## ✅ RAPPORT ATTENDU APRÈS CHAQUE TÂCHE

Format obligatoire :

```
## Tâche X — [Nom] ✅

**Ce qui a été fait :**
- [liste concise des fichiers créés/modifiés]

**Build status :** pnpm build ✅ | lint ✅ | typecheck ✅

**Score visuel vs maquette v5 :** X/10

**Lien de test local :** http://localhost:3000

**Commit :** [hash court]
```

---

## 🚨 COMPORTEMENTS INTERDITS

- ❌ Modifier `supabase/migrations/` sans demander
- ❌ Ajouter Framer Motion, GSAP ou autre lib d'animation
- ❌ Inventer des sections absentes de la maquette v5
- ❌ Changer les couleurs (#0D0D0D, #00D26A, #FFC20E)
- ❌ Modifier la structure du logo (3 couleurs différentes)
- ❌ Supprimer les glows ou changer leurs positions
- ❌ Regrouper plusieurs tâches en un seul commit
- ❌ Passer à la tâche suivante si le build échoue

---

*Maquette de référence absolue : `sonafrik_landing_v5.html` — en cas de doute, la maquette a toujours raison.*
