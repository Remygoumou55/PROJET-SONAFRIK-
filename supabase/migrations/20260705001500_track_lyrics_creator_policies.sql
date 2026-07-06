-- track_lyrics : policies créateur (wizard + édition brouillon pending)

BEGIN;

DROP POLICY IF EXISTS "track_lyrics_insert_own" ON public.track_lyrics;
CREATE POLICY "track_lyrics_insert_own" ON public.track_lyrics
  FOR INSERT TO authenticated
  WITH CHECK (
    submitted_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.tracks t
      INNER JOIN public.albums a ON a.id = t.album_id
      INNER JOIN public.creators c ON c.id = a.creator_id
      WHERE t.id = track_lyrics.track_id
        AND c.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "track_lyrics_creator_read_own" ON public.track_lyrics;
CREATE POLICY "track_lyrics_creator_read_own" ON public.track_lyrics
  FOR SELECT TO authenticated
  USING (
    submitted_by = auth.uid()
    AND status = 'pending'
  );

DROP POLICY IF EXISTS "track_lyrics_creator_update_own" ON public.track_lyrics;
CREATE POLICY "track_lyrics_creator_update_own" ON public.track_lyrics
  FOR UPDATE TO authenticated
  USING (
    submitted_by = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    submitted_by = auth.uid()
    AND status = 'pending'
  );

DROP POLICY IF EXISTS "track_lyrics_creator_delete_own" ON public.track_lyrics;
CREATE POLICY "track_lyrics_creator_delete_own" ON public.track_lyrics
  FOR DELETE TO authenticated
  USING (
    submitted_by = auth.uid()
    AND status = 'pending'
  );

COMMIT;
