-- Fix : GRANT table-level manquants pour le rôle authenticated / anon
-- ---------------------------------------------------------------------------
-- Sans GRANT, PostgreSQL retourne "permission denied for table X" même si
-- les politiques RLS sont correctes. RLS contrôle QUELLES lignes sont
-- accessibles ; GRANT contrôle SI la table est accessible du tout.
-- Seules les tables réellement créées dans les migrations sont listées ici.
-- ---------------------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Profils (upsert onboarding → INSERT + UPDATE requis)
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Sessions et audit
GRANT SELECT, INSERT ON public.user_sessions TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;

-- Wallet (écritures via RPCs SECURITY DEFINER uniquement)
GRANT SELECT ON public.wallets TO authenticated;
GRANT SELECT ON public.wallet_ledger TO authenticated;
GRANT SELECT ON public.transactions TO authenticated;

-- Withdrawals + payout (écritures via RPCs uniquement)
GRANT SELECT ON public.withdrawals TO authenticated;
GRANT SELECT ON public.payout_accounts TO authenticated;
GRANT SELECT ON public.payout_batches TO authenticated;
GRANT SELECT ON public.payout_audit_logs TO authenticated;

-- Royalties (lecture seule côté client)
GRANT SELECT ON public.royalty_cycles TO authenticated;
GRANT SELECT ON public.royalty_calculations TO authenticated;

-- Catalogue public (anon + authenticated)
GRANT SELECT ON public.creators TO anon, authenticated;
GRANT SELECT ON public.creator_verifications TO anon, authenticated;
GRANT SELECT ON public.creator_roles TO authenticated;
GRANT SELECT ON public.artist_profiles TO anon, authenticated;
GRANT SELECT ON public.studios TO anon, authenticated;
GRANT SELECT ON public.albums TO anon, authenticated;
GRANT SELECT ON public.album_genres TO anon, authenticated;
GRANT SELECT ON public.tracks TO anon, authenticated;
GRANT SELECT ON public.track_files TO authenticated;
GRANT SELECT ON public.track_genres TO anon, authenticated;
GRANT SELECT ON public.genres TO anon, authenticated;
GRANT SELECT ON public.labels TO anon, authenticated;
GRANT SELECT ON public.label_members TO authenticated;

-- Social (INSERT/DELETE contraints par RLS — own rows only)
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.playlists TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.playlist_tracks TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.playback_positions TO authenticated;

-- Streaming
GRANT SELECT, INSERT ON public.stream_sessions TO authenticated;
GRANT SELECT, INSERT ON public.stream_events TO authenticated;

-- Rôles / permissions (lecture seule)
GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT ON public.permissions TO authenticated;
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

-- DEFAULT PRIVILEGES : futures tables dans public héritent automatiquement
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
