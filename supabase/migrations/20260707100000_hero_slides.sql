-- Hero Carousel — table hero_slides
-- Slides diffusées sur la page d'accueil /listen
-- Lecture publique (actives + dans la fenêtre temporelle) ; écriture admin uniquement

BEGIN;

CREATE TABLE IF NOT EXISTS public.hero_slides (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL CHECK (char_length(title) <= 100),
  subtitle      TEXT        CHECK (char_length(subtitle) <= 200),
  cover_url     TEXT,
  track_id      UUID        REFERENCES public.tracks(id) ON DELETE SET NULL,
  display_order INT         NOT NULL DEFAULT 0,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  starts_at     TIMESTAMPTZ,
  ends_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hero_slides_read_public"  ON public.hero_slides;
DROP POLICY IF EXISTS "hero_slides_write_admin"  ON public.hero_slides;

-- Lecture publique : slide active dont la fenêtre de programmation est valide
-- (starts_at NULL = pas de début imposé ; ends_at NULL = pas de fin imposée)
CREATE POLICY "hero_slides_read_public" ON public.hero_slides
  FOR SELECT
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at   IS NULL OR ends_at   >= now())
  );

-- Écriture réservée aux administrateurs
CREATE POLICY "hero_slides_write_admin" ON public.hero_slides
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP TRIGGER IF EXISTS set_updated_at_hero_slides ON public.hero_slides;
CREATE TRIGGER set_updated_at_hero_slides
  BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed : 3 slides démo pour valider le carousel
INSERT INTO public.hero_slides (title, subtitle, display_order, is_active) VALUES
  ('Bienvenue sur SONAFRIK',  'La musique africaine en streaming',      0, true),
  ('Découvrez les artistes',  'Explorez les talents de Guinée et plus', 1, true),
  ('Soutenez vos créateurs',  'Devenez mécène avec des pourboires GNF', 2, true)
ON CONFLICT DO NOTHING;

COMMIT;
