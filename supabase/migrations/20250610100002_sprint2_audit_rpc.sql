-- RPC audit pour utilisateurs authentifiés
CREATE OR REPLACE FUNCTION public.log_audit_event_authenticated(
  p_action TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
BEGIN
  RETURN public.log_audit_event(
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_metadata,
    NULL,
    NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.log_audit_event_authenticated TO authenticated;
