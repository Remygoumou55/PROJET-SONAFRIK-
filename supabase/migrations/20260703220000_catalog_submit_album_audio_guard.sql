-- Publication & Catalog R1 — garde-fou audio sur submit_album_for_review
BEGIN;

CREATE OR REPLACE FUNCTION public.submit_album_for_review(p_album_id UUID)
RETURNS VOID AS $$
DECLARE
  v_creator_id UUID;
  v_track_count INT;
  v_ready_count INT;
BEGIN
  SELECT creator_id INTO v_creator_id
  FROM public.albums
  WHERE id = p_album_id AND deleted_at IS NULL;

  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'Album introuvable.';
  END IF;

  IF NOT public.can_edit_creator(v_creator_id) THEN
    RAISE EXCEPTION 'Accès non autorisé.';
  END IF;

  SELECT COUNT(*) INTO v_track_count
  FROM public.tracks t
  WHERE t.album_id = p_album_id AND t.deleted_at IS NULL;

  IF v_track_count = 0 THEN
    RAISE EXCEPTION 'Au moins un morceau est requis avant soumission.';
  END IF;

  SELECT COUNT(*) INTO v_ready_count
  FROM public.tracks t
  INNER JOIN public.track_files tf
    ON tf.track_id = t.id AND tf.is_primary = true
  WHERE t.album_id = p_album_id
    AND t.deleted_at IS NULL
    AND tf.integrity_status IN ('valid', 'pending');

  IF v_ready_count < v_track_count THEN
    RAISE EXCEPTION 'Chaque morceau doit avoir un fichier audio principal validé avant soumission.';
  END IF;

  UPDATE public.albums
  SET publication_status = 'pending_review', submitted_at = now(), updated_by = auth.uid()
  WHERE id = p_album_id AND publication_status IN ('draft', 'rejected');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Impossible de soumettre cet album.';
  END IF;

  PERFORM public.log_audit_event_authenticated('catalog.album.submitted', 'albums', p_album_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
