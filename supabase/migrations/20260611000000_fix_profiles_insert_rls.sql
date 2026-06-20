-- Fix: authenticated users can INSERT their own profile row.
-- Requis pour le UPSERT d'onboarding (Google OAuth : le trigger handle_new_user
-- peut être absent ou avoir échoué silencieusement en preview deploy).
-- Sans cette politique, la partie INSERT du UPSERT est bloquée par RLS.

CREATE POLICY IF NOT EXISTS profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
