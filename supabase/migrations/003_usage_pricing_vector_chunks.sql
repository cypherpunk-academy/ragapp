-- =============================================================================
-- ragapp — Usage, Pricing & Vector Chunks
--
-- Tables used by ragrun/ragprep that are NOT synced to WatermelonDB:
--   vector_chunks  — SQL mirror of Qdrant payloads (ragrun IngestionService writes)
--   rag_usage      — LLM billing data per API call
--   llm_pricing    — Model prices for on-demand cost calculation
--   rag_usage_costs — View: rag_usage joined with llm_pricing
-- =============================================================================

-- ---------------------------------------------------------------------------
-- vector_chunks  — Qdrant SQL mirror (ragrun IngestionService writes here)
-- PK: (collection, chunk_id)  — uses 'collection' (not rag_partition)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vector_chunks (
  collection     varchar(128)  NOT NULL,
  chunk_id       varchar(256)  NOT NULL,
  source_id      varchar(256)  NOT NULL,
  chunk_type     varchar(64)   NOT NULL,
  language       varchar(8)    NOT NULL,
  worldviews     text[],
  importance     integer,
  content_hash   varchar(128)  NOT NULL,
  text           text,
  metadata       jsonb         NOT NULL DEFAULT '{}',
  "references"   jsonb,
  created_at     timestamptz   NOT NULL DEFAULT now(),
  updated_at     timestamptz   NOT NULL DEFAULT now(),
  PRIMARY KEY (collection, chunk_id)
);

CREATE INDEX IF NOT EXISTS idx_vector_chunks_source_id  ON vector_chunks (source_id);
CREATE INDEX IF NOT EXISTS idx_vector_chunks_collection ON vector_chunks (collection);
CREATE INDEX IF NOT EXISTS idx_vector_chunks_updated    ON vector_chunks (updated_at);

-- ---------------------------------------------------------------------------
-- rag_usage  — LLM billing data per API call
-- Written by ragrun; account_id = Supabase auth.uid() of the caller
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rag_usage (
  id                 bigserial     PRIMARY KEY,
  account_id         varchar(128)  NOT NULL DEFAULT 'anonymous',
  thread_id          varchar(64),
  endpoint           varchar(256),
  model              varchar(128),
  provider           varchar(64)   NOT NULL DEFAULT 'deepseek',
  prompt_tokens      integer,
  completion_tokens  integer,
  total_tokens       integer,
  turn_id            uuid          REFERENCES rag_turns (turn_id) ON DELETE SET NULL,
  talk_id            uuid          REFERENCES rag_talks (talk_id) ON DELETE SET NULL,
  created_at         timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rag_usage_account_id ON rag_usage (account_id);
CREATE INDEX IF NOT EXISTS idx_rag_usage_created_at ON rag_usage (created_at);
CREATE INDEX IF NOT EXISTS idx_rag_usage_turn_id    ON rag_usage (turn_id);
CREATE INDEX IF NOT EXISTS idx_rag_usage_talk_id    ON rag_usage (talk_id);

-- ---------------------------------------------------------------------------
-- llm_pricing  — Model prices (reference data, managed manually / by ragrun)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS llm_pricing (
  model                  varchar(128)   PRIMARY KEY,
  provider               varchar(64)    NOT NULL DEFAULT 'deepseek',
  prompt_per_1m_usd      numeric(12,6)  NOT NULL,
  completion_per_1m_usd  numeric(12,6)  NOT NULL,
  updated_at             timestamptz    NOT NULL DEFAULT now(),
  note                   text
);

-- Seed data (as of May 2026)
INSERT INTO llm_pricing (model, provider, prompt_per_1m_usd, completion_per_1m_usd, note) VALUES
  ('deepseek-chat',            'deepseek',  0.270000,  1.100000, 'DeepSeek V3, cache miss'),
  ('deepseek-reasoner',        'deepseek',  0.550000,  2.190000, 'DeepSeek R1, cache miss'),
  ('claude-opus-4-6',          'anthropic', 15.000000, 75.000000, 'Claude Opus 4.6'),
  ('claude-sonnet-4-6',        'anthropic',  3.000000, 15.000000, 'Claude Sonnet 4.6'),
  ('claude-haiku-4-5-20251001','anthropic',  0.800000,  4.000000, 'Claude Haiku 4.5')
ON CONFLICT (model) DO NOTHING;

-- ---------------------------------------------------------------------------
-- rag_usage_costs  — View: on-demand cost calculation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW rag_usage_costs AS
SELECT
  u.id,
  u.account_id,
  u.thread_id,
  u.turn_id,
  u.talk_id,
  u.endpoint,
  u.model,
  u.provider,
  u.prompt_tokens,
  u.completion_tokens,
  u.total_tokens,
  u.created_at,
  ROUND(
    (  COALESCE(u.prompt_tokens,     0) / 1000000.0 * COALESCE(p.prompt_per_1m_usd,     0)
     + COALESCE(u.completion_tokens, 0) / 1000000.0 * COALESCE(p.completion_per_1m_usd, 0)
    )::numeric,
    6
  ) AS cost_usd
FROM rag_usage u
LEFT JOIN llm_pricing p ON p.model = u.model;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE vector_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_usage     ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_pricing   ENABLE ROW LEVEL SECURITY;

-- vector_chunks: service role only (ragrun writes; app does not read directly)
-- No authenticated policy → only service_role (bypasses RLS) can access

-- rag_usage: users can read their own rows; service role writes
DROP POLICY IF EXISTS "usage_select_own" ON rag_usage;
CREATE POLICY "usage_select_own" ON rag_usage
  FOR SELECT TO authenticated
  USING (account_id = auth.uid()::text);

-- llm_pricing: all authenticated users can read
DROP POLICY IF EXISTS "pricing_select" ON llm_pricing;
CREATE POLICY "pricing_select" ON llm_pricing
  FOR SELECT TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- updated_at trigger for vector_chunks
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_vector_chunks_updated ON vector_chunks;
CREATE TRIGGER trg_vector_chunks_updated
  BEFORE UPDATE ON vector_chunks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
