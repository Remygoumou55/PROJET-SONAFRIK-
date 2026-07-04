-- Phase 2.2 — Alignement Storage buckets sur Upload Policy Enterprise v1.1.0
-- catalog-audio : 100 Mo · avatars : 10 Mo · creator-assets : 20 Mo

BEGIN;

UPDATE storage.buckets
SET
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY[
    'audio/mpeg',
    'audio/mp3',
    'audio/mp4',
    'audio/m4a',
    'audio/x-m4a',
    'audio/aac',
    'audio/wav',
    'audio/wave',
    'audio/x-wav'
  ]::text[]
WHERE id = 'catalog-audio';

UPDATE storage.buckets
SET file_size_limit = 10485760
WHERE id = 'avatars';

UPDATE storage.buckets
SET file_size_limit = 20971520
WHERE id = 'creator-assets';

-- Bucket legacy "audio" (Sprint 6) — aligné si présent
UPDATE storage.buckets
SET file_size_limit = 104857600
WHERE id = 'audio';

COMMIT;
