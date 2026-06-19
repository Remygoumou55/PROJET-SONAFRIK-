-- Migration : privacy_defaults_private
-- Corrige les DEFAULT des colonnes de confidentialité dans user_preferences.
-- CONTEXTE : les colonnes show_listening_activity et profile_visibility avaient
-- des valeurs par défaut publiques. Cette migration corrige uniquement le DEFAULT
-- pour les futures lignes — aucune donnée existante n'est modifiée.
-- À exécuter manuellement dans Supabase SQL Editor par Mr Rémy.

ALTER TABLE public.user_preferences
  ALTER COLUMN show_listening_activity SET DEFAULT false,
  ALTER COLUMN profile_visibility      SET DEFAULT 'private';

COMMENT ON COLUMN public.user_preferences.show_listening_activity IS
  'Visibilité de l''activité d''écoute. FALSE par défaut conformément au principe de confidentialité SONAFRIK.';

COMMENT ON COLUMN public.user_preferences.profile_visibility IS
  'Visibilité du profil. private par défaut conformément au principe de confidentialité SONAFRIK.';
