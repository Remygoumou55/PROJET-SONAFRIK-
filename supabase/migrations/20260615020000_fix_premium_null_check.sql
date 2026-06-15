-- ============================================================
-- Fix P3-02 : is_premium_user + has_streaming_permission
-- Sémantique correcte : premium_expires_at IS NULL = jamais acheté (non premium)
-- Avant : IS NULL OR expires_at > now() → null traité comme "illimité" (BUG)
-- Après : IS NOT NULL AND expires_at > now() → null = pas premium (CORRECT)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_premium_user(
  p_user_id UUID DEFAULT auth.uid()
) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id
      AND is_premium = true
      AND premium_expires_at IS NOT NULL
      AND premium_expires_at > now()
  );
$$;

CREATE OR REPLACE FUNCTION public.has_streaming_permission(
  p_user_id UUID DEFAULT auth.uid()
) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id
      AND deleted_at IS NULL
      AND (
        -- Accès premium actif (date d'expiration obligatoire)
        (is_premium = true AND premium_expires_at IS NOT NULL AND premium_expires_at > now())
        OR
        -- Période d'essai gratuite (7 jours après inscription — Règle CDC #2)
        (created_at + INTERVAL '7 days' > now())
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_premium_user        TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_streaming_permission TO authenticated, anon;
