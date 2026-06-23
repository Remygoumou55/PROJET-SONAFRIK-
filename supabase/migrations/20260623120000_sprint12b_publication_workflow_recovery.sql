-- Sprint 1.2-B — Publication Workflow Recovery
-- ---------------------------------------------------------------------------
-- P0 : Empêcher tout passage à publication_status = 'published' hors RPC admin.
-- P0 : review_track_publication() pour les morceaux soumis seuls.
-- P0 : review_album_publication() utilise un bypass transactionnel contrôlé.
-- P1 : bootstrap_admin_if_none() pour le premier compte admin (env test / prod).
-- ---------------------------------------------------------------------------

-- ── Garde métier : transitions de publication catalogue ─────────────────────

CREATE OR REPLACE FUNCTION public.guard_catalog_publication_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.publication_status IS NOT DISTINCT FROM OLD.publication_status THEN
    RETURN NEW;
  END IF;

  -- Publication : uniquement via review_* (SECURITY DEFINER + GUC transactionnel)
  IF NEW.publication_status = 'published' THEN
    IF current_setting('app.catalog_review_publish', true) IS DISTINCT FROM 'on' THEN
      RAISE EXCEPTION 'catalog_publish_forbidden: admin review workflow required'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  -- Rejet : admin uniquement (RPC review ou is_admin direct)
  IF NEW.publication_status = 'rejected' THEN
    IF current_setting('app.catalog_review_publish', true) IS DISTINCT FROM 'on'
       AND NOT public.is_admin(auth.uid()) THEN
      RAISE EXCEPTION 'catalog_reject_forbidden: admin review required'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS albums_guard_publication ON public.albums;
CREATE TRIGGER albums_guard_publication
  BEFORE UPDATE OF publication_status ON public.albums
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_catalog_publication_transition();

DROP TRIGGER IF EXISTS tracks_guard_publication ON public.tracks;
CREATE TRIGGER tracks_guard_publication
  BEFORE UPDATE OF publication_status ON public.tracks
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_catalog_publication_transition();

-- ── RPC admin : revue album (mise à jour) ───────────────────────────────────

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
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Accès administrateur requis.' USING ERRCODE = '42501';
  END IF;
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

  PERFORM public.log_audit_event_authenticated(
    'catalog.album.reviewed', 'albums', p_album_id, jsonb_build_object('status', p_status)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.review_album_publication(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_album_publication(UUID, TEXT, TEXT) TO authenticated;

-- ── RPC admin : revue morceau (standalone) ──────────────────────────────────

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
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Accès administrateur requis.' USING ERRCODE = '42501';
  END IF;
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

  PERFORM public.log_audit_event_authenticated(
    'catalog.track.reviewed', 'tracks', p_track_id, jsonb_build_object('status', p_status)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.review_track_publication(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_track_publication(UUID, TEXT, TEXT) TO authenticated;

-- ── Bootstrap premier admin (aucun admin en base) ───────────────────────────

CREATE OR REPLACE FUNCTION public.bootstrap_admin_if_none(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_id UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id_required' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE r.name = 'admin' AND r.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'admin_already_exists' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = p_user_id AND p.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'profile_not_found' USING ERRCODE = 'P0002';
  END IF;

  SELECT id INTO v_role_id
  FROM public.roles
  WHERE name = 'admin' AND deleted_at IS NULL
  LIMIT 1;

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'admin_role_not_found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.user_roles (user_id, role_id, assigned_by)
  VALUES (p_user_id, v_role_id, p_user_id)
  ON CONFLICT DO NOTHING;

  PERFORM public.log_audit_event(
    p_user_id,
    'auth.admin.bootstrapped',
    'user_roles',
    p_user_id,
    jsonb_build_object('role', 'admin')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_admin_if_none(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_admin_if_none(UUID) TO service_role;

-- f_unaccent requis lors des UPDATE publication (index GIN partiels)
GRANT EXECUTE ON FUNCTION public.f_unaccent(TEXT) TO service_role;
