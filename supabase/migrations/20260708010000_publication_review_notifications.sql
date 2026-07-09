-- Notifications persistantes après approbation / refus admin (publication workflow)
BEGIN;

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'publication_review';

CREATE OR REPLACE FUNCTION public._notify_publication_review(
  p_track_id UUID,
  p_status TEXT,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_title TEXT;
  v_action_url TEXT;
  v_action_label TEXT;
  v_notif_title TEXT;
  v_notif_body TEXT;
BEGIN
  SELECT t.title, c.owner_id
  INTO v_title, v_owner_id
  FROM public.tracks t
  JOIN public.creators c ON c.id = t.creator_id
  WHERE t.id = p_track_id;

  IF v_owner_id IS NULL THEN
    RETURN;
  END IF;

  IF p_status = 'published' THEN
    v_notif_title := 'Publication approuvée';
    v_notif_body := format(
      'Votre morceau « %s » a été approuvé. Votre musique est maintenant publiée officiellement sur SONAFRIK.',
      v_title
    );
    v_action_url := '/creator/catalog/tracks/' || p_track_id::text;
    v_action_label := 'Voir la publication';
  ELSIF p_status = 'rejected' THEN
    v_notif_title := 'Modifications demandées';
    v_notif_body := COALESCE(
      NULLIF(trim(p_rejection_reason), ''),
      'Votre publication nécessite quelques corrections avant sa mise en ligne.'
    );
    v_action_url := '/creator/catalog/tracks/' || p_track_id::text || '/edit';
    v_action_label := 'Corriger';
  ELSE
    RETURN;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    v_owner_id,
    'publication_review'::public.notification_type,
    v_notif_title,
    v_notif_body,
    jsonb_build_object(
      'track_id', p_track_id,
      'review_status', p_status,
      'action_url', v_action_url,
      'action_label', v_action_label
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public._notify_publication_review(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._notify_publication_review(UUID, TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.review_album_publication(
  p_album_id UUID,
  p_status TEXT,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_track_id UUID;
BEGIN
  PERFORM public._assert_admin();

  IF p_status NOT IN ('published', 'rejected') THEN
    RAISE EXCEPTION 'Statut invalide.' USING ERRCODE = '22023';
  END IF;

  PERFORM set_config('app.catalog_review_publish', 'on', true);

  UPDATE public.albums
  SET publication_status = p_status,
      rejection_reason = CASE WHEN p_status = 'rejected' THEN p_rejection_reason ELSE NULL END,
      published_at = CASE WHEN p_status = 'published' THEN now() ELSE published_at END,
      updated_by = auth.uid()
  WHERE id = p_album_id AND publication_status = 'pending_review';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Album non éligible à la revue.' USING ERRCODE = 'P0002';
  END IF;

  IF p_status = 'published' THEN
    UPDATE public.tracks
    SET publication_status = 'published',
        published_at = now(),
        updated_by = auth.uid()
    WHERE album_id = p_album_id
      AND publication_status IN ('draft', 'pending_review', 'published');
  END IF;

  SELECT id INTO v_track_id
  FROM public.tracks
  WHERE album_id = p_album_id
  ORDER BY track_number NULLS LAST, created_at ASC
  LIMIT 1;

  IF v_track_id IS NOT NULL THEN
    PERFORM public._notify_publication_review(v_track_id, p_status, p_rejection_reason);
  END IF;

  PERFORM public.log_audit_event_authenticated(
    'catalog.album.reviewed', 'albums', p_album_id, jsonb_build_object('status', p_status)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.review_track_publication(
  p_track_id UUID,
  p_status TEXT,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._assert_admin();

  IF p_status NOT IN ('published', 'rejected') THEN
    RAISE EXCEPTION 'Statut invalide.' USING ERRCODE = '22023';
  END IF;

  PERFORM set_config('app.catalog_review_publish', 'on', true);

  UPDATE public.tracks
  SET publication_status = p_status,
      rejection_reason = CASE WHEN p_status = 'rejected' THEN p_rejection_reason ELSE NULL END,
      published_at = CASE WHEN p_status = 'published' THEN now() ELSE published_at END,
      updated_by = auth.uid()
  WHERE id = p_track_id AND publication_status = 'pending_review';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Morceau non éligible à la revue.' USING ERRCODE = 'P0002';
  END IF;

  PERFORM public._notify_publication_review(p_track_id, p_status, p_rejection_reason);

  PERFORM public.log_audit_event_authenticated(
    'catalog.track.reviewed', 'tracks', p_track_id, jsonb_build_object('status', p_status)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_album_publication(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_album_publication(UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.review_track_publication(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_track_publication(UUID, TEXT, TEXT) TO service_role;

COMMIT;
