-- ============================================================
-- track_credits : crédits d'affichage par morceau
-- Distinct de contributors/works (droits SOCAN/BSDA) — ce système
-- concerne l'affichage public des contributeurs côté streaming.
-- À exécuter manuellement dans Supabase SQL Editor par Mr Rémy.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.track_credits (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id               UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  -- Profil SONAFRIK du contributeur (cliquable si renseigné)
  contributor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- Nom toujours rempli, même si contributor_profile_id existe (snapshot au moment du crédit)
  contributor_name       TEXT NOT NULL CHECK (char_length(contributor_name) BETWEEN 1 AND 100),
  role                   TEXT NOT NULL CHECK (role IN (
    'artiste_principal',
    'featuring',
    'auteur',
    'compositeur',
    'producteur',
    'beatmaker',
    'mixage',
    'mastering'
  )),
  display_order          INTEGER NOT NULL DEFAULT 0,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_track_credits_track
  ON public.track_credits(track_id, display_order);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_track_credits_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_track_credits_updated_at ON public.track_credits;
CREATE TRIGGER trg_track_credits_updated_at
  BEFORE UPDATE ON public.track_credits
  FOR EACH ROW EXECUTE FUNCTION public.set_track_credits_updated_at();

ALTER TABLE public.track_credits ENABLE ROW LEVEL SECURITY;

-- Lecture publique (information non sensible, visible par tous les visiteurs)
DROP POLICY IF EXISTS "track_credits_select_public" ON public.track_credits;
CREATE POLICY IF NOT EXISTS "track_credits_select_public"
  ON public.track_credits FOR SELECT
  USING (true);

-- INSERT : uniquement le propriétaire du morceau
DROP POLICY IF EXISTS "track_credits_insert_owner" ON public.track_credits;
CREATE POLICY IF NOT EXISTS "track_credits_insert_owner"
  ON public.track_credits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tracks t
      JOIN public.creators c ON c.id = t.creator_id
      WHERE t.id = track_id AND c.owner_id = auth.uid()
    )
  );

-- UPDATE : uniquement le propriétaire du morceau
DROP POLICY IF EXISTS "track_credits_update_owner" ON public.track_credits;
CREATE POLICY IF NOT EXISTS "track_credits_update_owner"
  ON public.track_credits FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks t
      JOIN public.creators c ON c.id = t.creator_id
      WHERE t.id = track_id AND c.owner_id = auth.uid()
    )
  );

-- DELETE : uniquement le propriétaire du morceau
DROP POLICY IF EXISTS "track_credits_delete_owner" ON public.track_credits;
CREATE POLICY IF NOT EXISTS "track_credits_delete_owner"
  ON public.track_credits FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks t
      JOIN public.creators c ON c.id = t.creator_id
      WHERE t.id = track_id AND c.owner_id = auth.uid()
    )
  );

GRANT SELECT ON public.track_credits TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.track_credits TO authenticated;
