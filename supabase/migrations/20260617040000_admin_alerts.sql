-- SONAFRIK — Sprint 13 · Alertes admin + vue stats
-- Fichier : supabase/migrations/20260617040000_admin_alerts.sql

-- ---------------------------------------------------------------------------
-- Table : admin_notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type       TEXT NOT NULL,
  message    TEXT NOT NULL,
  metadata   JSONB NOT NULL DEFAULT '{}',
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_notif_unread
  ON public.admin_notifications(is_read, created_at DESC)
  WHERE is_read = false;

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin uniquement"
  ON public.admin_notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- FONCTION : check_provider_failure_rate (trigger)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_provider_failure_rate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fail_count INTEGER;
BEGIN
  IF NEW.status <> 'failed' OR OLD.status = 'failed' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_fail_count
  FROM public.payment_intents
  WHERE provider  = NEW.provider
    AND status    = 'failed'
    AND failed_at >= now() - INTERVAL '1 hour';

  IF v_fail_count >= 5 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.admin_notifications
      WHERE type                     = 'provider_failure_rate'
        AND metadata->>'provider'    = NEW.provider
        AND created_at              >= now() - INTERVAL '30 minutes'
    ) THEN
      INSERT INTO public.admin_notifications (type, message, metadata)
      VALUES (
        'provider_failure_rate',
        format('Alerte : %s — %s echecs de paiement en 1 heure. Verifier l''operateur.',
               NEW.provider, v_fail_count),
        jsonb_build_object(
          'provider',   NEW.provider,
          'fail_count', v_fail_count,
          'intent_id',  NEW.id
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payment_intents_check_failure_rate ON public.payment_intents;

CREATE TRIGGER payment_intents_check_failure_rate
  AFTER UPDATE OF status ON public.payment_intents
  FOR EACH ROW
  EXECUTE FUNCTION public.check_provider_failure_rate();

-- ---------------------------------------------------------------------------
-- VUE : admin_dashboard_stats
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.admin_dashboard_stats AS
SELECT
  (SELECT COUNT(DISTINCT user_id) FROM public.stream_sessions
   WHERE started_at >= now() - INTERVAL '30 days')       AS active_users_30d,

  (SELECT COUNT(*) FROM public.stream_sessions
   WHERE started_at >= CURRENT_DATE
     AND total_duration_seconds > 30)                     AS valid_streams_today,

  (SELECT COUNT(*) FROM public.payment_intents
   WHERE status = 'confirmed'
     AND confirmed_at >= CURRENT_DATE)                    AS payments_confirmed_today,

  (SELECT COALESCE(SUM(amount_gnf), 0) FROM public.payment_intents
   WHERE status = 'confirmed'
     AND confirmed_at >= CURRENT_DATE)                    AS amount_recharged_today_gnf,

  (SELECT COALESCE(SUM(balance_gnf), 0) FROM public.wallets) AS total_wallet_balance_gnf,

  (SELECT COUNT(*) FROM public.payment_intents
   WHERE status IN ('failed', 'expired')
     AND created_at >= CURRENT_DATE)                      AS payments_failed_today,

  (SELECT COUNT(*) FROM public.admin_notifications
   WHERE is_read = false)                                 AS unread_alerts;

GRANT SELECT ON public.admin_dashboard_stats TO authenticated;
