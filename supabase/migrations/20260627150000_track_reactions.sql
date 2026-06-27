BEGIN;

-- Compteurs agrégés par morceau + emoji (Realtime)
CREATE TABLE IF NOT EXISTS track_reaction_counts (
  track_id uuid NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  count integer NOT NULL DEFAULT 0 CHECK (count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (track_id, emoji),
  CONSTRAINT track_reaction_counts_emoji_check CHECK (
    emoji IN ('❤️', '🔥', '😢', '🕺', '😮')
  )
);

-- Réactions individuelles (anti-doublon par utilisateur)
CREATE TABLE IF NOT EXISTS track_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT track_reactions_emoji_check CHECK (
    emoji IN ('❤️', '🔥', '😢', '🕺', '😮')
  ),
  UNIQUE (track_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_track_reactions_track_id ON track_reactions(track_id);
CREATE INDEX IF NOT EXISTS idx_track_reaction_counts_track_id ON track_reaction_counts(track_id);

ALTER TABLE track_reaction_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY track_reaction_counts_select_all
  ON track_reaction_counts FOR SELECT
  USING (true);

CREATE POLICY track_reactions_select_own
  ON track_reactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY track_reactions_insert_own
  ON track_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION add_track_reaction(p_track_id uuid, p_emoji text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_inserted integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  IF p_emoji NOT IN ('❤️', '🔥', '😢', '🕺', '😮') THEN
    RAISE EXCEPTION 'invalid emoji';
  END IF;

  INSERT INTO track_reactions (track_id, user_id, emoji)
  VALUES (p_track_id, v_user_id, p_emoji)
  ON CONFLICT (track_id, user_id, emoji) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted = 0 THEN
    RETURN;
  END IF;

  INSERT INTO track_reaction_counts (track_id, emoji, count, updated_at)
  VALUES (p_track_id, p_emoji, 1, now())
  ON CONFLICT (track_id, emoji)
  DO UPDATE SET
    count = track_reaction_counts.count + 1,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION add_track_reaction(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION add_track_reaction(uuid, text) TO authenticated;

-- Realtime sur les compteurs agrégés
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'track_reaction_counts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE track_reaction_counts;
  END IF;
END $$;

COMMIT;
