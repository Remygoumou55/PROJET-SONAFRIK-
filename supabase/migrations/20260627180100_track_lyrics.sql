-- Paroles synchronisées — À APPLIQUER MANUELLEMENT par Rémy (fichier préparé, non exécuté auto)
-- Format lines : [{"time": 12.5, "text": "paroles..."}, ...]

BEGIN;

CREATE TABLE IF NOT EXISTS public.track_lyrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL DEFAULT 'fr',
  lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  submitted_by UUID REFERENCES auth.users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(track_id, language)
);

CREATE INDEX IF NOT EXISTS idx_track_lyrics_track_id ON public.track_lyrics(track_id);

ALTER TABLE public.track_lyrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "track_lyrics_read_approved" ON public.track_lyrics;
CREATE POLICY "track_lyrics_read_approved" ON public.track_lyrics
  FOR SELECT TO authenticated
  USING (status = 'approved');

DROP POLICY IF EXISTS "track_lyrics_insert_own" ON public.track_lyrics;
CREATE POLICY "track_lyrics_insert_own" ON public.track_lyrics
  FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid());

DROP POLICY IF EXISTS "track_lyrics_admin_all" ON public.track_lyrics;
CREATE POLICY "track_lyrics_admin_all" ON public.track_lyrics
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.track_lyrics IS
  'Paroles synchronisées SONAFRIK. lines = [{"time": secondes, "text": "..."}]';

COMMIT;
