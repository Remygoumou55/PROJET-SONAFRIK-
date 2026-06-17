# SONAFRIK — Checklist Go/No-Go Lancement Public

**À remplir manuellement par M. Rémy Goumou avant toute annonce publique.**
Date de validation : ___________________

---

## TECHNIQUE (vérifiable par dev)

- [ ] `pnpm build` 7/7 vert (0 erreur TypeScript)
- [ ] `pnpm turbo run lint typecheck` 19/19 vert
- [ ] `pnpm smoke` → 8/8 checks verts
- [ ] `pnpm check-env` → toutes les variables obligatoires OK
- [ ] `/admin/health` : tous les composants ✅ (DB, Storage, Wallets, Paiements)
- [ ] `/listen` affiche du contenu (tendances, artistes, sections)
- [ ] Lecture d'un morceau (même si fichier démo = erreur audio attendue)
- [ ] Inscription d'un nouvel utilisateur (formulaire complet + email de confirmation)
- [ ] Connexion / déconnexion fonctionnent
- [ ] Page `/profile` accessible et affiche les données
- [ ] Page `/wallet` affiche le solde (même 0 GNF)
- [ ] Historique des paiements visible (même vide)
- [ ] Skeleton loaders visibles sur réseau lent (tester en throttling Chrome DevTools)

---

## PAIEMENTS (tests manuels)

- [ ] TopupModal s'ouvre et affiche les 4 opérateurs (Orange, MTN, Wave, Soutra)
- [ ] Mode sandbox : créer un intent → confirmer via SQL Editor
  ```sql
  SELECT public.confirm_payment_intent('<intent-id>', 'SANDBOX-TEST-001');
  ```
- [ ] Wallet se recharge après `confirm_payment_intent` manuel
- [ ] Bouton "Soutenir" visible dans le player audio
- [ ] Message de confirmation pourboire sans mention de 5% ou commission
- [ ] Au moins 1 opérateur sandbox actif avec variable `{PROVIDER}_SANDBOX=true`

---

## SÉCURITÉ

- [ ] BYPASS_AUTH bloqué en production (vérifier : VERCEL=1 dans les logs Vercel)
- [ ] URL `/admin` redirige vers connexion sans compte admin
- [ ] Headers HTTP vérifiés sur https://securityheaders.com (score A ou A+)
- [ ] Aucune clé secrète visible dans les DevTools (onglet Sources / Network)
- [ ] RLS vérifié : créer un compte test, vérifier qu'il ne voit pas les données d'un autre
- [ ] Sentry : recevoir une erreur test dans le Dashboard (erreur simulée sur error.tsx)

---

## LÉGAL ET CONTENU

- [ ] CGU (Conditions Générales d'Utilisation) publiées et accessibles
- [ ] Politique de confidentialité publiée (conformité RGPD)
- [ ] Mentions légales présentes (société, RCCM Guinée, adresse, contact)
- [ ] Tous les artistes démo sont clairement fictifs (noms inventés)
- [ ] Aucune vraie musique protégée par droit d'auteur dans la plateforme
- [ ] Contact support visible (email ou WhatsApp Business)

---

## OPÉRATEURS DE PAIEMENT

- [ ] Au moins 1 opérateur (MTN sandbox minimum) actif et testé
- [ ] URL webhook enregistrée dans le portail développeur de l'opérateur
- [ ] Test de paiement réel effectué (même 1 000 GNF)
- [ ] Confirmation reçue via webhook → wallet rechargé automatiquement

---

## BUSINESS ET INFRASTRUCTURE

- [ ] Compte Vercel Pro actif (Custom Domain + Edge Network)
- [ ] Supabase Pro actif (PITR, Row Level Security, Edge Functions)
- [ ] Nom de domaine propre configuré et SSL actif (si applicable)
- [ ] Email de support configuré et fonctionnel (réponse en < 48h)
- [ ] Supabase Auth : provider email configuré avec template personnalisé
- [ ] Sauvegarde PITR testée au moins une fois (restauration de test)

---

## VERDICT

| Catégorie | Statut |
|---|---|
| Technique | ☐ OK / ☐ BLOQUANT |
| Paiements | ☐ OK / ☐ BLOQUANT |
| Sécurité | ☐ OK / ☐ BLOQUANT |
| Légal | ☐ OK / ☐ BLOQUANT |
| Opérateurs | ☐ OK / ☐ BLOQUANT |
| Business | ☐ OK / ☐ BLOQUANT |

**DÉCISION FINALE :** ☐ **PRÊT AU LANCEMENT** / ☐ **EN ATTENTE — items bloquants à résoudre**

Signé : ___________________  Date : ___________________
