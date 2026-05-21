-- =============================================================================
-- ragapp — initial Supabase schema
-- Run once against a fresh (or reset) Supabase project.
--
-- rag_* tables mirror ragrun's exact Postgres schema so that ragrun can use
-- the same Supabase instance as its database without any column mismatches.
-- rag_paragraphs is app-only (does not exist in ragrun yet).
-- app_* tables are app-only user data synced via WatermelonDB.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Helper: millisecond-epoch ↔ timestamptz  (used by sync functions)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION ms_to_ts(ms bigint) RETURNS timestamptz
  LANGUAGE sql IMMUTABLE AS $$ SELECT to_timestamp(ms / 1000.0) $$;

CREATE OR REPLACE FUNCTION ts_to_ms(ts timestamptz) RETURNS bigint
  LANGUAGE sql IMMUTABLE AS $$ SELECT floor(extract(epoch FROM ts) * 1000)::bigint $$;

-- =============================================================================
-- READ-ONLY content tables (populated by ragprep / ragrun backend)
-- The app only reads these; ragrun writes via the service role (bypasses RLS).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- rag_paragraphs  (app-only, does not exist in ragrun Postgres yet)
-- Stable paragraph identifier: "{source_id}:{segment_index}:{paragraph_number}"
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rag_paragraphs (
  id               text        PRIMARY KEY,   -- paragraph_id
  source_id        text        NOT NULL,
  book_id          text,
  language         text,
  segment_type     text        NOT NULL,
  segment_index    integer     NOT NULL,
  segment_title    text        NOT NULL,
  paragraph_number integer     NOT NULL,
  text_raw         text        NOT NULL,
  annotations      jsonb,
  deprecated_at    timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rag_paragraphs_source  ON rag_paragraphs (source_id);
CREATE INDEX IF NOT EXISTS idx_rag_paragraphs_seg     ON rag_paragraphs (source_id, segment_index);
CREATE INDEX IF NOT EXISTS idx_rag_paragraphs_updated ON rag_paragraphs (updated_at);

-- ---------------------------------------------------------------------------
-- rag_chunks  — exact ragrun schema (migration 0016 + 0018 + 0019)
-- Composite PK: (rag_partition, chunk_id)
-- WatermelonDB id = rag_partition || ':' || chunk_id  (assembled in pull_changes)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rag_chunks (
  rag_partition  varchar(128)  NOT NULL,
  chunk_id       varchar(256)  NOT NULL,
  source_id      varchar(256),
  chunk_type     varchar(64),
  language       varchar(8),
  worldviews     text[],
  importance     integer,
  content_hash   varchar(128),
  text           text,
  metadata       jsonb,
  "references"   jsonb,
  scope          varchar(64),
  embedded_at    timestamptz,
  deprecated_at  timestamptz,
  created_at     timestamptz   NOT NULL DEFAULT now(),
  updated_at     timestamptz   NOT NULL DEFAULT now(),
  PRIMARY KEY (rag_partition, chunk_id)
);

CREATE INDEX IF NOT EXISTS idx_rag_chunks_partition ON rag_chunks (rag_partition);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_source    ON rag_chunks (source_id);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_updated   ON rag_chunks (updated_at);

-- ---------------------------------------------------------------------------
-- rag_talks  — exact ragrun schema (migrations 0010 + 0011 + 0012 + 0021)
-- mensch_id stores the Supabase auth.uid()::text of the owner.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rag_talks (
  talk_id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  collection         varchar(128),
  mensch_id          varchar(128),   -- Supabase auth.uid()::text
  mensch_name        varchar(256),
  slug               varchar(256),
  title              text,
  action_id          varchar(128),
  summary            text,
  usage              jsonb,
  kontext_meta       jsonb,
  publishing_status  varchar(16)   NOT NULL DEFAULT 'draft'
                       CHECK (publishing_status IN (
                         'draft','personal','peers','candidate',
                         'staged','archive','published','bug'
                       )),
  bug_description    text,
  kontext_source_id  text,
  kontext_segment_id text,
  kontext_paragraph  text,
  created_at         timestamptz   NOT NULL DEFAULT now(),
  updated_at         timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rag_talks_mensch  ON rag_talks (mensch_id);
CREATE INDEX IF NOT EXISTS idx_rag_talks_updated ON rag_talks (updated_at);

-- ---------------------------------------------------------------------------
-- rag_turns  — exact ragrun schema (migration 0010)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rag_turns (
  turn_id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  talk_id              uuid          NOT NULL REFERENCES rag_talks (talk_id) ON DELETE CASCADE,
  turn_index           integer,
  action_id            varchar(128),
  assistant_personality varchar(128),
  user_message         text,
  assistant_message    text,
  usage                jsonb,
  collection           varchar(128),
  is_relay             boolean       NOT NULL DEFAULT false,
  chunk_index_map      jsonb,
  kontext_meta         jsonb,
  created_at           timestamptz   NOT NULL DEFAULT now(),
  updated_at           timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rag_turns_talk    ON rag_turns (talk_id);
CREATE INDEX IF NOT EXISTS idx_rag_turns_updated ON rag_turns (updated_at);

-- ---------------------------------------------------------------------------
-- rag_references  — exact ragrun schema (migration 0013)
-- No updated_at — ragrun never updates these rows.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rag_references (
  ref_id        uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  turn_id       uuid    NOT NULL REFERENCES rag_turns (turn_id) ON DELETE CASCADE,
  ref_index     integer,
  chunk_id      varchar(64),
  relevance     float,
  source_title  text,
  segment_title text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rag_refs_turn    ON rag_references (turn_id);
CREATE INDEX IF NOT EXISTS idx_rag_refs_created ON rag_references (created_at);

-- ---------------------------------------------------------------------------
-- app_paragraph_chunk  (join table: paragraph ↔ chunk, managed by ragprep)
-- Not synced to WatermelonDB — server-side only.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_paragraph_chunk (
  paragraph_id  text        NOT NULL,
  chunk_id      text        NOT NULL,
  rag_partition text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (paragraph_id, chunk_id, rag_partition)
);

CREATE INDEX IF NOT EXISTS idx_apc_paragraph  ON app_paragraph_chunk (paragraph_id);
CREATE INDEX IF NOT EXISTS idx_apc_chunk      ON app_paragraph_chunk (chunk_id);

-- =============================================================================
-- USER-WRITABLE tables (synced bidirectionally via WatermelonDB)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- app_notes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_notes (
  id            text        PRIMARY KEY,   -- WatermelonDB UUID
  user_id       uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  paragraph_id  text,
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

ALTER TABLE rag_paragraphs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_chunks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_talks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_turns          ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_references     ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_paragraph_chunk ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_notes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_bookmarks      ENABLE ROW LEVEL SECURITY;

-- rag_paragraphs: all authenticated users can read
CREATE POLICY "paragraphs_select" ON rag_paragraphs
  FOR SELECT TO authenticated USING (true);

-- rag_chunks: all authenticated users can read
CREATE POLICY "chunks_select" ON rag_chunks
  FOR SELECT TO authenticated USING (true);

-- rag_talks: own talks + publicly shared talks
-- Publicly accessible statuses: peers, candidate, staged, published
CREATE POLICY "talks_select" ON rag_talks
  FOR SELECT TO authenticated
  USING (
    mensch_id = auth.uid()::text
    OR publishing_status IN ('peers', 'candidate', 'staged', 'published')
  );

-- rag_talks: users can create their own talks (ragrun also inserts via service role)
CREATE POLICY "talks_insert" ON rag_talks
  FOR INSERT TO authenticated
  WITH CHECK (mensch_id = auth.uid()::text);

-- rag_talks: users can update their own talks
CREATE POLICY "talks_update" ON rag_talks
  FOR UPDATE TO authenticated
  USING (mensch_id = auth.uid()::text);

-- rag_turns: readable when the parent talk is accessible
CREATE POLICY "turns_select" ON rag_turns
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rag_talks t
      WHERE t.talk_id = rag_turns.talk_id
        AND (
          t.mensch_id = auth.uid()::text
          OR t.publishing_status IN ('peers', 'candidate', 'staged', 'published')
        )
    )
  );

-- rag_references: all authenticated users can read
CREATE POLICY "references_select" ON rag_references
  FOR SELECT TO authenticated USING (true);

-- app_paragraph_chunk: all authenticated users can read
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

CREATE TRIGGER trg_rag_paragraphs_updated  BEFORE UPDATE ON rag_paragraphs  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_rag_chunks_updated      BEFORE UPDATE ON rag_chunks       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_rag_talks_updated       BEFORE UPDATE ON rag_talks        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_rag_turns_updated       BEFORE UPDATE ON rag_turns        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_app_notes_updated       BEFORE UPDATE ON app_notes        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_app_bookmarks_updated   BEFORE UPDATE ON app_bookmarks    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
