-- =============================================================================
-- ragapp — initial Supabase schema
-- Run once against a fresh Supabase project.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Helper: millisecond-epoch ↔ timestamptz
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION ms_to_ts(ms bigint) RETURNS timestamptz
  LANGUAGE sql IMMUTABLE AS $$ SELECT to_timestamp(ms / 1000.0) $$;

CREATE OR REPLACE FUNCTION ts_to_ms(ts timestamptz) RETURNS bigint
  LANGUAGE sql IMMUTABLE AS $$ SELECT floor(extract(epoch FROM ts) * 1000)::bigint $$;

-- =============================================================================
-- READ-ONLY content tables (populated by ragprep / ragrun backend)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- rag_paragraphs
-- Maps to WatermelonDB table: paragraphs
-- id = paragraph_id  e.g. "philosophie-der-freiheit:1:3"
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rag_paragraphs (
  id                 text        PRIMARY KEY,   -- paragraph_id
  source_id          text        NOT NULL,
  book_id            text,
  language           text,
  segment_type       text        NOT NULL,
  segment_index      integer     NOT NULL,
  segment_title      text        NOT NULL,
  paragraph_number   integer     NOT NULL,
  text_raw           text        NOT NULL,
  annotations        jsonb,
  deprecated_at      timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rag_paragraphs_source   ON rag_paragraphs (source_id);
CREATE INDEX IF NOT EXISTS idx_rag_paragraphs_seg      ON rag_paragraphs (source_id, segment_index);
CREATE INDEX IF NOT EXISTS idx_rag_paragraphs_updated  ON rag_paragraphs (updated_at);

-- ---------------------------------------------------------------------------
-- rag_chunks
-- Maps to WatermelonDB table: chunks
-- id = chunk_id
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rag_chunks (
  id             text        PRIMARY KEY,   -- chunk_id
  collection     text        NOT NULL,
  source_id      text        NOT NULL,
  segment_id     text,
  chunk_type     text        NOT NULL,
  text           text        NOT NULL,
  deprecated_at  timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rag_chunks_collection ON rag_chunks (collection);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_source     ON rag_chunks (source_id);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_updated    ON rag_chunks (updated_at);

-- ---------------------------------------------------------------------------
-- rag_talks
-- Maps to WatermelonDB table: talks
-- id = talk_id  (uuid, set by ragrun)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rag_talks (
  id                   text        PRIMARY KEY,   -- talk_id
  user_id              uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  collection           text,
  title                text,
  summary              text,
  context_mode         text,                       -- 'free' | 'paragraph' | 'segment'
  context_ids          jsonb,
  context_paragraph_id text,
  publishing_status    text        NOT NULL DEFAULT 'private',  -- 'private'|'link'|'friends'|'public'
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rag_talks_user    ON rag_talks (user_id);
CREATE INDEX IF NOT EXISTS idx_rag_talks_ctx_par ON rag_talks (context_paragraph_id);
CREATE INDEX IF NOT EXISTS idx_rag_talks_updated ON rag_talks (updated_at);

-- ---------------------------------------------------------------------------
-- rag_turns
-- Maps to WatermelonDB table: turns
-- id = turn_id  (uuid, set by ragrun)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rag_turns (
  id                    text        PRIMARY KEY,   -- turn_id
  talk_id               text        NOT NULL REFERENCES rag_talks (id) ON DELETE CASCADE,
  turn_index            integer     NOT NULL,
  assistant_personality text,
  user_message          text        NOT NULL,
  assistant_message     text,
  chunk_index_map       jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rag_turns_talk    ON rag_turns (talk_id);
CREATE INDEX IF NOT EXISTS idx_rag_turns_updated ON rag_turns (updated_at);

-- ---------------------------------------------------------------------------
-- rag_references
-- Maps to WatermelonDB table: references
-- id = ref_id
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rag_references (
  id             text        PRIMARY KEY,   -- ref_id
  paragraph_id   text        NOT NULL,
  turn_id        text        REFERENCES rag_turns (id) ON DELETE SET NULL,
  chunk_id       text,
  ref_index      integer     NOT NULL,
  ref_kind       text,                       -- 'begriff' | 'zitat' | 'buch' | 'vortrag'
  relevance      real,
  source_title   text,
  segment_title  text,
  snippet        text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rag_refs_paragraph ON rag_references (paragraph_id);
CREATE INDEX IF NOT EXISTS idx_rag_refs_turn       ON rag_references (turn_id);
CREATE INDEX IF NOT EXISTS idx_rag_refs_updated    ON rag_references (updated_at);

-- ---------------------------------------------------------------------------
-- app_paragraph_chunk  (join table, managed by ragprep)
-- Not synced to WatermelonDB — used server-side for RAG retrieval
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_paragraph_chunk (
  paragraph_id  text        NOT NULL,
  chunk_id      text        NOT NULL,
  collection    text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (paragraph_id, chunk_id)
);

CREATE INDEX IF NOT EXISTS idx_apc_paragraph  ON app_paragraph_chunk (paragraph_id);
CREATE INDEX IF NOT EXISTS idx_apc_chunk      ON app_paragraph_chunk (chunk_id);

-- =============================================================================
-- USER-WRITABLE tables (synced bidirectionally via WatermelonDB)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- app_notes
-- Maps to WatermelonDB table: notes
-- id = WatermelonDB local UUID (stable across devices after first sync)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_notes (
  id            text        PRIMARY KEY,   -- WatermelonDB UUID
  user_id       uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  paragraph_id  text,
  segment_id    text,
  source_id     text,
  content       text        NOT NULL DEFAULT '',
  is_public     boolean     NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz                          -- soft-delete for sync tombstones
);

CREATE INDEX IF NOT EXISTS idx_app_notes_user      ON app_notes (user_id);
CREATE INDEX IF NOT EXISTS idx_app_notes_paragraph ON app_notes (paragraph_id);
CREATE INDEX IF NOT EXISTS idx_app_notes_updated   ON app_notes (updated_at);

-- ---------------------------------------------------------------------------
-- app_bookmarks
-- Maps to WatermelonDB table: bookmarks
-- id = WatermelonDB local UUID
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_bookmarks (
  id            text        PRIMARY KEY,   -- WatermelonDB UUID
  user_id       uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  paragraph_id  text        NOT NULL,
  source_id     text        NOT NULL,
  is_last_read  boolean     NOT NULL DEFAULT false,
  is_manual     boolean     NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

CREATE INDEX IF NOT EXISTS idx_app_bookmarks_user      ON app_bookmarks (user_id);
CREATE INDEX IF NOT EXISTS idx_app_bookmarks_source    ON app_bookmarks (source_id);
CREATE INDEX IF NOT EXISTS idx_app_bookmarks_paragraph ON app_bookmarks (paragraph_id);
CREATE INDEX IF NOT EXISTS idx_app_bookmarks_updated   ON app_bookmarks (updated_at);

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE rag_paragraphs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_chunks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_talks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_turns         ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_references    ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_paragraph_chunk ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_notes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_bookmarks     ENABLE ROW LEVEL SECURITY;

-- rag_paragraphs: readable by all authenticated users
CREATE POLICY "paragraphs_select" ON rag_paragraphs
  FOR SELECT TO authenticated USING (true);

-- rag_chunks: readable by all authenticated users
CREATE POLICY "chunks_select" ON rag_chunks
  FOR SELECT TO authenticated USING (true);

-- rag_talks: own talks + non-private talks of others
CREATE POLICY "talks_select" ON rag_talks
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR publishing_status <> 'private');

-- rag_turns: readable if the parent talk is readable
CREATE POLICY "turns_select" ON rag_turns
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rag_talks t
      WHERE t.id = talk_id
        AND (t.user_id = auth.uid() OR t.publishing_status <> 'private')
    )
  );

-- rag_references: readable by all authenticated users
CREATE POLICY "references_select" ON rag_references
  FOR SELECT TO authenticated USING (true);

-- app_paragraph_chunk: readable by all authenticated users
CREATE POLICY "apc_select" ON app_paragraph_chunk
  FOR SELECT TO authenticated USING (true);

-- app_notes: full CRUD on own rows
CREATE POLICY "notes_select" ON app_notes
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notes_insert" ON app_notes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "notes_update" ON app_notes
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notes_delete" ON app_notes
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- app_bookmarks: full CRUD on own rows
CREATE POLICY "bookmarks_select" ON app_bookmarks
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "bookmarks_insert" ON app_bookmarks
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "bookmarks_update" ON app_bookmarks
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "bookmarks_delete" ON app_bookmarks
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- =============================================================================
-- updated_at auto-update trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_rag_paragraphs_updated   BEFORE UPDATE ON rag_paragraphs   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_rag_chunks_updated       BEFORE UPDATE ON rag_chunks        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_rag_talks_updated        BEFORE UPDATE ON rag_talks         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_rag_turns_updated        BEFORE UPDATE ON rag_turns         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_rag_references_updated   BEFORE UPDATE ON rag_references    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_app_notes_updated        BEFORE UPDATE ON app_notes         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_app_bookmarks_updated    BEFORE UPDATE ON app_bookmarks     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
