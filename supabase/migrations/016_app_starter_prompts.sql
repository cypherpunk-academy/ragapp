-- =============================================================================
-- Starter prompts shown on empty free-chat ("Was möchtest du mit Philo besprechen?").
-- Read-only catalogue for clients (prompt + sort_order via pull_changes).
-- clicks is server-only analytics, incremented via RPC.
-- =============================================================================

CREATE TABLE IF NOT EXISTS app_starter_prompts (
  id          uuid PRIMARY KEY,
  prompt      text NOT NULL,
  clicks      integer NOT NULL DEFAULT 0,
  sort_order  integer NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_app_starter_prompts_sort
  ON app_starter_prompts (sort_order);

ALTER TABLE app_starter_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "starter_prompts readable by authenticated" ON app_starter_prompts;
CREATE POLICY "starter_prompts readable by authenticated" ON app_starter_prompts
  FOR SELECT TO authenticated USING (true);

-- Deterministic UUIDv5 (namespace a7c3e1d0-4b8f-4e2a-9c1d-6f5e8b0a2d14 + "app_starter_prompts:{n}")
INSERT INTO app_starter_prompts (id, prompt, sort_order) VALUES
  ('20fe8ae4-37f3-56dc-9ac0-110899275361', 'Was meint Steiner mit sozialer Dreigliederung?', 1),
  ('1a39b884-490b-5be5-9bcb-f0589337645f', 'Wie hängt Freiheit mit Verantwortung zusammen?', 2),
  ('ab953ad3-c1ea-5827-a590-536a69860977', 'Was ist der Unterschied zwischen Rechtsleben und Wirtschaftsleben bei Steiner?', 3),
  ('f3c4d411-739c-568d-87d1-a4750754df50', 'Was schreibt Steiner über Gefühle — und was können wir mit ihnen machen?', 4),
  ('89730b79-094f-5a1e-b41f-489d79efa111', 'Warum quälen sich Menschen mit Selbstvorwürfen, wenn sie Fehler gemacht haben?', 5),
  ('41aeb93a-1ee8-5b4b-950d-274c445d14ba', 'Was ist sinnlichkeitsfreies Denken und welche Bedeutung hat es heute im Leben?', 6),
  ('97959873-29fb-588e-90e5-afdbb52e98f4', 'Ist Wahlfreiheit nur eine Illusion?', 7),
  ('669feada-8927-5c9b-a1f8-b75930e6e4f3', 'Warum fällt es so schwer, meine Impulse zu leben?', 8),
  ('3349cf3a-6e64-5777-92be-4e9ff1606444', 'Traurigkeit und Schwere: Was sind das für Gefühle, und was kann ich mit ihnen tun?', 9),
  ('633bf17e-780c-5f6b-a36b-fd20261376bb', 'Gibt mir eine Liste aller 12 Weltanschauungen und sag mir welche davon deine ist.', 10),
  ('1103c320-bff9-581c-b8b8-a689f34efccf', 'Welche Verbindungen gibt es zwischen Menschen, die wir nicht sehen, weil sie uns nicht direkt ersichtlich sind?', 11),
  ('e0b7ebbf-82ce-587d-ab6d-d9bf61ef393d', 'Wie gehe ich mit einem Schmerz um, der mich überwältigt?', 12),
  ('f84df6fb-ba54-5a32-a75d-f68c1be29bac', 'Steiner sagt, die meisten Menschen haben keine Gedanken, nur Worte — was meint er damit?', 13),
  ('eb4aa923-cb05-52cb-b7fa-269be67c4784', 'Hilf mir, Gedanken zu sortieren, ohne vorschnelle Annahmen.', 14)
ON CONFLICT (id) DO UPDATE SET
  prompt     = EXCLUDED.prompt,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

CREATE OR REPLACE FUNCTION increment_starter_prompt_click(prompt_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  UPDATE app_starter_prompts
     SET clicks = clicks + 1
   WHERE id = prompt_id;
END $$;

GRANT EXECUTE ON FUNCTION increment_starter_prompt_click(uuid) TO authenticated;

-- =============================================================================
-- pull_changes — include starter_prompts (prompt + sort_order, not clicks)
-- =============================================================================
CREATE OR REPLACE FUNCTION pull_changes(
  last_pulled_at  bigint  DEFAULT 0,
  schema_version  int     DEFAULT 1
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET statement_timeout TO 0
AS $$
DECLARE
  v_uid       uuid        := auth.uid();
  v_since     timestamptz := ms_to_ts(last_pulled_at);
  v_now_ms    bigint      := ts_to_ms(now());

  v_src_created  json;  v_src_updated  json;
  v_par_created  json;  v_par_updated  json;
  v_tlk_created  json;  v_tlk_updated  json;  v_tlk_deleted json;
  v_trn_created  json;  v_trn_updated  json;  v_trn_deleted json;
  v_ref_created  json;
  v_nte_created  json;  v_nte_updated  json;  v_nte_deleted json;
  v_bkm_created  json;  v_bkm_updated  json;  v_bkm_deleted json;
  v_stp_created  json;  v_stp_updated  json;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- rag_sources
  SELECT json_agg(row_to_json(r)) INTO v_src_created FROM (
    SELECT
      id::text AS id,
      title, author, language, year, book_index, is_primary, sort_order,
      ts_to_ms(created_at) AS created_at,
      ts_to_ms(updated_at) AS updated_at
    FROM rag_sources
    WHERE created_at > v_since
  ) r;

  SELECT json_agg(row_to_json(r)) INTO v_src_updated FROM (
    SELECT
      id::text AS id,
      title, author, language, year, book_index, is_primary, sort_order,
      ts_to_ms(created_at) AS created_at,
      ts_to_ms(updated_at) AS updated_at
    FROM rag_sources
    WHERE updated_at > v_since AND created_at <= v_since
  ) r;

  -- rag_paragraphs
  SELECT json_agg(row_to_json(r)) INTO v_par_created FROM (
    SELECT
      id::text AS id, source_id, language,
      segment_index, segment_slug, segment_title, paragraph_number,
      text_raw, annotations::text AS annotations,
      ts_to_ms(deprecated_at) AS deprecated_at,
      ts_to_ms(created_at)    AS created_at,
      ts_to_ms(updated_at)    AS updated_at
    FROM rag_paragraphs
    WHERE created_at > v_since
  ) r;

  SELECT json_agg(row_to_json(r)) INTO v_par_updated FROM (
    SELECT
      id::text AS id, source_id, language,
      segment_index, segment_slug, segment_title, paragraph_number,
      text_raw, annotations::text AS annotations,
      ts_to_ms(deprecated_at) AS deprecated_at,
      ts_to_ms(created_at)    AS created_at,
      ts_to_ms(updated_at)    AS updated_at
    FROM rag_paragraphs
    WHERE updated_at > v_since AND created_at <= v_since
  ) r;

  -- rag_talks
  SELECT json_agg(row_to_json(r)) INTO v_tlk_created FROM (
    SELECT
      talk_id::text AS id,
      collection, user_id, user_name, title, personality,
      summary, usage::text AS usage, kontext_meta::text AS kontext_meta,
      publishing_status, pinned, mode,
      compressed_up_to_turn_index, compressed_summary,
      kontext_source_id, kontext_paragraph_id, kontext_paragraph,
      ts_to_ms(created_at) AS created_at,
      ts_to_ms(updated_at) AS updated_at
    FROM rag_talks
    WHERE created_at > v_since
      AND (user_id = v_uid::text OR publishing_status IN ('peers', 'candidate', 'staged', 'published'))
  ) r;

  SELECT json_agg(row_to_json(r)) INTO v_tlk_updated FROM (
    SELECT
      talk_id::text AS id,
      collection, user_id, user_name, title, personality,
      summary, usage::text AS usage, kontext_meta::text AS kontext_meta,
      publishing_status, pinned, mode,
      compressed_up_to_turn_index, compressed_summary,
      kontext_source_id, kontext_paragraph_id, kontext_paragraph,
      ts_to_ms(created_at) AS created_at,
      ts_to_ms(updated_at) AS updated_at
    FROM rag_talks
    WHERE updated_at > v_since AND created_at <= v_since
      AND (user_id = v_uid::text OR publishing_status IN ('peers', 'candidate', 'staged', 'published'))
  ) r;

  SELECT json_agg(talk_id::text) INTO v_tlk_deleted
  FROM rag_talks
  WHERE updated_at > v_since
    AND user_id <> v_uid::text
    AND publishing_status NOT IN ('peers', 'candidate', 'staged', 'published');

  -- rag_turns
  SELECT json_agg(row_to_json(r)) INTO v_trn_created FROM (
    SELECT
      t.turn_id::text AS id, t.talk_id::text AS talk_id,
      t.turn_index, t.personality,
      t.user_message, t.assistant_message,
      t.usage::text AS usage, t.collection,
      t.chunk_index_map::text AS chunk_index_map,
      t.kontext_meta::text AS kontext_meta,
      ts_to_ms(t.created_at) AS created_at,
      ts_to_ms(t.updated_at) AS updated_at
    FROM rag_turns t
    JOIN rag_talks tk ON tk.talk_id = t.talk_id
    WHERE t.created_at > v_since
      AND (tk.user_id = v_uid::text OR tk.publishing_status IN ('peers', 'candidate', 'staged', 'published'))
  ) r;

  SELECT json_agg(row_to_json(r)) INTO v_trn_updated FROM (
    SELECT
      t.turn_id::text AS id, t.talk_id::text AS talk_id,
      t.turn_index, t.personality,
      t.user_message, t.assistant_message,
      t.usage::text AS usage, t.collection,
      t.chunk_index_map::text AS chunk_index_map,
      t.kontext_meta::text AS kontext_meta,
      ts_to_ms(t.created_at) AS created_at,
      ts_to_ms(t.updated_at) AS updated_at
    FROM rag_turns t
    JOIN rag_talks tk ON tk.talk_id = t.talk_id
    WHERE t.updated_at > v_since AND t.created_at <= v_since
      AND (tk.user_id = v_uid::text OR tk.publishing_status IN ('peers', 'candidate', 'staged', 'published'))
  ) r;

  SELECT json_agg(t.turn_id::text) INTO v_trn_deleted
  FROM rag_turns t
  JOIN rag_talks tk ON tk.talk_id = t.talk_id
  WHERE t.updated_at > v_since
    AND tk.user_id <> v_uid::text
    AND tk.publishing_status NOT IN ('peers', 'candidate', 'staged', 'published');

  -- rag_references
  SELECT json_agg(row_to_json(r)) INTO v_ref_created FROM (
    SELECT
      r.ref_id::text AS id, r.turn_id::text AS turn_id,
      r.ref_index, r.chunk_id, r.relevance, r.source_title, r.segment_title,
      ts_to_ms(r.created_at) AS created_at,
      ts_to_ms(r.created_at) AS updated_at
    FROM rag_references r
    JOIN rag_turns t  ON t.turn_id  = r.turn_id
    JOIN rag_talks tk ON tk.talk_id = t.talk_id
    WHERE r.created_at > v_since AND tk.user_id = v_uid::text
  ) r;

  -- app_notes
  SELECT json_agg(row_to_json(r)) INTO v_nte_created FROM (
    SELECT id, user_id::text AS user_id, paragraph_id, source_id, segment_slug,
      turn_id, talk_id,
      content, is_public,
      ts_to_ms(created_at) AS created_at, ts_to_ms(updated_at) AS updated_at
    FROM app_notes
    WHERE user_id = v_uid AND created_at > v_since AND deleted_at IS NULL
  ) r;

  SELECT json_agg(row_to_json(r)) INTO v_nte_updated FROM (
    SELECT id, user_id::text AS user_id, paragraph_id, source_id, segment_slug,
      turn_id, talk_id,
      content, is_public,
      ts_to_ms(created_at) AS created_at, ts_to_ms(updated_at) AS updated_at
    FROM app_notes
    WHERE user_id = v_uid AND updated_at > v_since AND created_at <= v_since AND deleted_at IS NULL
  ) r;

  SELECT json_agg(id) INTO v_nte_deleted FROM app_notes
  WHERE user_id = v_uid AND deleted_at > v_since;

  -- app_bookmarks
  SELECT json_agg(row_to_json(r)) INTO v_bkm_created FROM (
    SELECT id, user_id::text AS user_id, paragraph_id, source_id, is_last_read, is_manual,
      ts_to_ms(created_at) AS created_at, ts_to_ms(updated_at) AS updated_at
    FROM app_bookmarks
    WHERE user_id = v_uid AND created_at > v_since AND deleted_at IS NULL
  ) r;

  SELECT json_agg(row_to_json(r)) INTO v_bkm_updated FROM (
    SELECT id, user_id::text AS user_id, paragraph_id, source_id, is_last_read, is_manual,
      ts_to_ms(created_at) AS created_at, ts_to_ms(updated_at) AS updated_at
    FROM app_bookmarks
    WHERE user_id = v_uid AND updated_at > v_since AND created_at <= v_since AND deleted_at IS NULL
  ) r;

  SELECT json_agg(id) INTO v_bkm_deleted FROM app_bookmarks
  WHERE user_id = v_uid AND deleted_at > v_since;

  -- app_starter_prompts (read-only catalogue; clicks stay server-side)
  SELECT json_agg(row_to_json(r)) INTO v_stp_created FROM (
    SELECT
      id::text AS id, prompt, sort_order,
      ts_to_ms(created_at) AS created_at,
      ts_to_ms(updated_at) AS updated_at
    FROM app_starter_prompts
    WHERE created_at > v_since
  ) r;

  SELECT json_agg(row_to_json(r)) INTO v_stp_updated FROM (
    SELECT
      id::text AS id, prompt, sort_order,
      ts_to_ms(created_at) AS created_at,
      ts_to_ms(updated_at) AS updated_at
    FROM app_starter_prompts
    WHERE updated_at > v_since AND created_at <= v_since
  ) r;

  RETURN json_build_object(
    'timestamp', v_now_ms,
    'changes', json_build_object(
      'sources', json_build_object(
        'created', COALESCE(v_src_created, '[]'::json),
        'updated', COALESCE(v_src_updated, '[]'::json),
        'deleted', '[]'::json
      ),
      'paragraphs', json_build_object(
        'created', COALESCE(v_par_created, '[]'::json),
        'updated', COALESCE(v_par_updated, '[]'::json),
        'deleted', '[]'::json
      ),
      'talks', json_build_object(
        'created', COALESCE(v_tlk_created, '[]'::json),
        'updated', COALESCE(v_tlk_updated, '[]'::json),
        'deleted', COALESCE(v_tlk_deleted, '[]'::json)
      ),
      'turns', json_build_object(
        'created', COALESCE(v_trn_created, '[]'::json),
        'updated', COALESCE(v_trn_updated, '[]'::json),
        'deleted', COALESCE(v_trn_deleted, '[]'::json)
      ),
      'references', json_build_object(
        'created', COALESCE(v_ref_created, '[]'::json),
        'updated', '[]'::json,
        'deleted', '[]'::json
      ),
      'notes', json_build_object(
        'created', COALESCE(v_nte_created, '[]'::json),
        'updated', COALESCE(v_nte_updated, '[]'::json),
        'deleted', COALESCE(v_nte_deleted, '[]'::json)
      ),
      'bookmarks', json_build_object(
        'created', COALESCE(v_bkm_created, '[]'::json),
        'updated', COALESCE(v_bkm_updated, '[]'::json),
        'deleted', COALESCE(v_bkm_deleted, '[]'::json)
      ),
      'starter_prompts', json_build_object(
        'created', COALESCE(v_stp_created, '[]'::json),
        'updated', COALESCE(v_stp_updated, '[]'::json),
        'deleted', '[]'::json
      )
    )
  );
END $$;

GRANT EXECUTE ON FUNCTION pull_changes(bigint, int) TO authenticated;
