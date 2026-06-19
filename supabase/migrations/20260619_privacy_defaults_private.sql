-- Migration : privacy_defaults_private
-- Corrige les DEFAULT des colonnes de confidentialité dans user_preferences.
-- N'affecte PAS les comptes existants — seules les nouvelles lignes utilisent le DEFAULT.
-- À exécuter manuellement dans Supabase SQL Editor par Mr Rémy.

ALTER TABLE public.user_preferences
  ALTER COLUMN profile_visibility     SET DEFAULT 'private',
  ALTER COLUMN show_listening_activity SET DEFAULT false;
