-- =============================================================================
-- Add segment_slug to rag_paragraphs.
-- This column is added by ragrun alembic migration 0023, but may not have been
-- applied to Supabase yet. The pull_changes function (migration 010) queries
-- this column — without it every sync fails with "column does not exist".
-- =============================================================================
ALTER TABLE rag_paragraphs
  ADD COLUMN IF NOT EXISTS segment_slug TEXT;
