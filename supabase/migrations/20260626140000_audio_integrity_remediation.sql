-- Audio Pipeline Remediation — colonnes intégrité track_files + garde-fou publication
BEGIN;

ALTER TABLE public.track_files
  ADD COLUMN IF NOT EXISTS integrity_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (integrity_status IN ('pending', 'valid', 'invalid', 'needs_review')),
  ADD COLUMN IF NOT EXISTS integrity_message TEXT,
  ADD COLUMN IF NOT EXISTS content_hash TEXT,
  ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_track_files_integrity_primary
  ON public.track_files (integrity_status)
  WHERE is_primary = true;

COMMENT ON COLUMN public.track_files.integrity_status IS
  'pending=upload non confirmé; valid=lecture OK; invalid=corrompu; needs_review=admin requis';

-- Soumission : fichier primaire validé obligatoire
CREATE OR REPLACE FUNCTION public.submit_track_for_review(p_track_id UUID)
RETURNS VOID AS $$
DECLARE
  v_creator_id UUID;
  v_integrity TEXT;
BEGIN
  SELECT creator_id INTO v_creator_id FROM public.tracks WHERE id = p_track_id AND deleted_at IS NULL;
  IF v_creator_id IS NULL THEN RAISE EXCEPTION 'Morceau introuvable.'; END IF;
  IF NOT public.can_edit_creator(v_creator_id) THEN RAISE EXCEPTION 'Accès non autorisé.'; END IF;

  SELECT tf.integrity_status INTO v_integrity
  FROM public.track_files tf
  WHERE tf.track_id = p_track_id AND tf.is_primary = true
  LIMIT 1;

  IF v_integrity IS NULL THEN
    RAISE EXCEPTION 'Fichier audio principal requis avant soumission.';
  END IF;

  IF v_integrity NOT IN ('valid', 'pending') THEN
    RAISE EXCEPTION 'Fichier audio invalide ou en révision. Remplacez le fichier avant soumission.';
  END IF;

  UPDATE public.tracks
  SET publication_status = 'pending_review', submitted_at = now(), updated_by = auth.uid()
  WHERE id = p_track_id AND publication_status IN ('draft', 'rejected');

  IF NOT FOUND THEN RAISE EXCEPTION 'Impossible de soumettre ce morceau.'; END IF;

  PERFORM public.log_audit_event_authenticated('catalog.track.submitted', 'tracks', p_track_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
