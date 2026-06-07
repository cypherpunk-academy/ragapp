-- =============================================================================
-- Add rag_sources table — book/source catalogue synced to every device.
-- pull_changes updated to include rag_sources (read-only, no push).
-- =============================================================================

CREATE TABLE IF NOT EXISTS rag_sources (
  id          uuid PRIMARY KEY,
  title       text NOT NULL,
  author      text NOT NULL,
  language    text NOT NULL DEFAULT 'de',
  year        int,
  book_index  int,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Populate from book manifests
INSERT INTO rag_sources (id, title, author, language, year, book_index) VALUES
  ('005fbe89-4f29-484e-bf6c-ba242c1e30c4', 'Zwölf Wege die Welt zu verstehen', 'Mario Betti', 'de', NULL, 1),
  ('0c20163d-b14e-4750-988b-3b58c0fa3126', 'Code Version 2.0', 'Lawrence Lessig', 'en', NULL, 1),
  ('123ef8cb-a442-4bbc-9570-e8681dd67f9f', 'Rebel Code', 'Glyn Moody', 'en', NULL, 1),
  ('21b19e7c-27d2-4ad4-8071-60de13db9c58', 'Soziale Ideen (GA 337b)', 'Rudolf Steiner', 'de', NULL, 337),
  ('29aca7eb-3d15-4d0d-bd9b-3ecc8c2f7e43', 'Neugestaltung des sozialen Organismus', 'Rudolf Steiner', 'de', NULL, 330),
  ('2bf67f53-281c-4d3b-9649-5e0360704953', 'Über das Wesen des Gelehrten', 'Johann Gottlieb Fichte', 'de', NULL, 1),
  ('2d75487c-a7a2-4849-abdd-4c7a33fbd6de', 'Geisteswissenschaft als Erkenntnis der Grundimpulse sozialer Gestaltung', 'Rudolf Steiner', 'de', NULL, 199),
  ('2ef8ebbd-02e2-4c7a-a2d5-d379acfeb717', 'Die Krisis der Gegenwart und der Weg zu gesundem Denken', 'Rudolf Steiner', 'de', NULL, 335),
  ('2f5760e1-2dd1-4df7-b8c8-b215bedb5509', 'Wie wirkt man für den Impuls der Dreigliederung des sozialen Organismus?', 'Rudolf Steiner', 'de', NULL, 338),
  ('36371313-0400-4c90-9656-67d54052cf89', 'Julian Assange in his own words', 'Julian Assange', 'en', NULL, 1),
  ('3805bf5e-fd9f-456b-968a-8a4a561796e1', 'Die Befreiung des Menschenwesens als Grundlage für eine soziale Neugestaltung', 'Rudolf Steiner', 'de', NULL, 329),
  ('3a9a436b-21ff-4bc6-ba5c-21c3da401318', 'Damit der Mensch ganz Mensch werde', 'Rudolf Steiner', 'de', NULL, 82),
  ('3b38df84-e9bc-4e70-9032-d3fa65517cfd', 'Aufsätze über die Dreigliederung des sozialen Organismus und zur Zeitlage', 'Rudolf Steiner', 'de', 1921, 24),
  ('44217040-65bf-4150-9fa8-bac9c57cd1b1', 'Grundlinien einer Erkenntnistheorie der Goetheschen Weltanschauung', 'Rudolf Steiner', 'de', 1924, 2),
  ('4765da17-446f-4221-a16f-9e2e515e6d8e', 'Nationalökonomischer Kurs', 'Rudolf Steiner', 'de', NULL, 340),
  ('47b137d3-f414-406f-b142-ed72c7e8989c', 'Einleitungen zu Goethes Naturwissenschaftlichen Schriften', 'Rudolf Steiner', 'de', 1926, 1),
  ('4a8c567f-cb31-45ca-a5bf-4317a8473d00', 'Anthroposophie, soziale Dreigliederung und Redekunst', 'Rudolf Steiner', 'de', NULL, 339),
  ('4b8e4c2a-3f1b-4d2e-9c4a-8e4f4b2c3a1d', 'Die Philosophie der Freiheit', 'Rudolf Steiner', 'de', 1918, 4),
  ('4c09f3d5-3f5c-42b7-beba-f12fc46594bc', 'Free Software, Free Society', 'Richard M. Stallman', 'en', NULL, 1),
  ('5e6303e1-a4a4-4be4-bafd-c4c575024b8e', 'Friedrich Nietzsche. Ein Kämpfer gegen seine Zeit', 'Rudolf Steiner', 'de', NULL, 5),
  ('64e881df-0501-4815-9b0c-6cf545c383b6', 'Goethes Weltanschauung', 'Rudolf Steiner', 'de', 1921, 6),
  ('668db14e-8432-4852-a3be-4efc174b42fe', 'Über die Bestimmung des Gelehrten', 'Johann Gottlieb Fichte', 'de', NULL, 1),
  ('688c7418-44d2-45ae-aea5-c9546711ad22', 'Nationalökonomisches Seminar', 'Rudolf Steiner', 'de', NULL, 341),
  ('6af8dcc5-5f8c-44ed-beae-dc647b3eb912', 'Philosophie der Mathematik', 'Thomas Bedürftig & Roman Murawski', 'de', NULL, 1),
  ('6d308d55-9578-4772-9198-87b33e11c652', 'Betriebsräte und Sozialisierung', 'Rudolf Steiner', 'de', NULL, 331),
  ('7158a6fa-012b-4623-b82a-65ccf761c5f0', 'Grundlage der gesamten Wissenschaftslehre', 'Johann Gottlieb Fichte', 'de', NULL, 1),
  ('7758c53c-72bd-41f1-ae51-843eb2a0f718', 'Various Interviews and Articles', 'Julian Assange', 'en', NULL, 1),
  ('7da60fa4-9281-4643-80e8-612f511e755d', 'A Brief History of Hackerdom', 'Eric S. Raymond', 'en', NULL, 1),
  ('7e2b8c1a-4f3d-4e2a-9b1c-2f4e6d7a8b9c', 'Der menschliche und der kosmische Gedanke', 'Rudolf Steiner', 'de', 1914, 151),
  ('80a679d7-244c-421e-9a73-56cd24a6a386', 'Geschichtliche Symptomatologie', 'Rudolf Steiner', 'de', NULL, 185),
  ('82e6a1e7-c8ba-44a8-b16e-dc2aa1a95c41', 'Fünf Vorlesungen über die Bestimmung des Gelehrten', 'Johann Gottlieb Fichte', 'de', NULL, 1),
  ('837193ab-505b-43b6-9ab7-bec8c3ed95dc', 'How to Become a Hacker', 'Eric S. Raymond', 'en', NULL, 1),
  ('86dbe642-d481-46fe-8a4d-8b78b0128b4f', 'Vom Einheitsstaat zum dreigliedrigen sozialen Organismus', 'Rudolf Steiner', 'de', NULL, 334),
  ('908fc041-096e-4440-8593-b3267b712bf5', 'Die Wahrheit als Gesamtumfang aller Weltansichten', 'Sigismund von Gleich', 'de', NULL, 1),
  ('92b225b2-8d03-4cef-ac5c-387deb4536b7', 'Soziale Ideen (GA 337a)', 'Rudolf Steiner', 'de', NULL, 337),
  ('955866ef-1ef9-48ef-8ea5-546b6e4530fb', 'Allgemeine Menschenkunde als Grundlage der Pädagogik', 'Rudolf Steiner', 'de', NULL, 293),
  ('9ccf55bf-3de4-4339-8cbb-612ac4da24e5', 'Entsprechungen zwischen Mikrokosmos und Makrokosmos. Der Mensch — eine Hieroglyphe des Weltenalls', 'Rudolf Steiner', 'de', NULL, 201),
  ('9e72faf7-5e6e-40cc-8305-82633e0dc5af', 'Soziale Zukunft', 'Rudolf Steiner', 'de', NULL, 332),
  ('a0c25990-26bb-433d-924e-2a4ce646cc99', 'Fachwissenschaften und Anthroposophie', 'Rudolf Steiner', 'de', NULL, 73),
  ('a0d59b59-4188-4ca3-9b41-bcd986ebd889', 'Gedankenfreiheit und soziale Kräfte', 'Rudolf Steiner', 'de', NULL, 333),
  ('a1fa8d65-911c-4adc-b11f-2c8a4e3866c7', 'The Cathedral and the Bazaar', 'Eric S. Raymond', 'en', NULL, 1),
  ('a3c25e9c-bcf5-4577-bdf5-c5bf9bec9f59', 'Erziehungskunst. Seminarbesprechungen und Lehrplanvorträge', 'Rudolf Steiner', 'de', NULL, 295),
  ('ad02c6c1-1783-4f81-89ae-aa6dec253862', 'Erziehungskunst. Methodisch-Didaktisches', 'Rudolf Steiner', 'de', NULL, 294),
  ('aea38cf0-885a-48ba-a976-d479fcb0e9db', 'Hackers. Heroes of the Computer Revolution', 'Steven Levy', 'en', NULL, 1),
  ('c110a9d4-2c35-4a92-8b97-978a3b5263b0', 'Die Wirklichkeit der höheren Welten', 'Rudolf Steiner', 'de', NULL, 79),
  ('c279f098-901f-4121-a160-bb0c6b44fad1', 'System der Ethik', 'Imanuel Hermann Fichte', 'de', NULL, 1),
  ('c2a4e407-cdf7-4802-be84-010cc485ef00', 'Methodische Grundlagen der Anthroposophie', 'Rudolf Steiner', 'de', NULL, 30),
  ('d630933a-1bb2-4de7-9ce2-b64066211483', 'Die soziale Frage', 'Rudolf Steiner', 'de', NULL, 328),
  ('d64fa532-6040-4fc2-9c43-ed4e5368bb92', 'Die Rätsel der Philosophie', 'Rudolf Steiner', 'de', NULL, 18),
  ('e58f6369-f7a7-4213-845f-c5b9bf82ffe5', 'Wahrheit und Wissenschaft', 'Rudolf Steiner', 'de', 1925, 3),
  ('f287d43a-5108-4e0c-baa8-5e7d3badfef7', 'Gesammelte Aufsätze zur Kultur- und Zeitgeschichte', 'Rudolf Steiner', 'de', NULL, 31),
  ('f3b36ec2-031d-4715-ad66-dfc7f43cc491', 'Cypherpunks', 'Julian Assange', 'de', NULL, 1),
  ('f78a79d5-8e8f-435e-bb58-ef6577312f57', 'Lucifer-Gnosis. Grundlegende Aufsätze zur Anthroposophie und Berichte aus den Zeitschriften «Luzifer» und «Lucifer-Gnosis»', 'Rudolf Steiner', 'de', NULL, 34),
  ('f8e6c475-a0e5-4081-b265-61a7536a183e', 'Die Kernpunkte der sozialen Frage', 'Rudolf Steiner', 'de', 1920, 23),
  ('fb464839-f044-4a77-8198-001e5f4e95fa', 'Die befruchtende Wirkung der Anthroposophie auf die Fachwissenschaften', 'Rudolf Steiner', 'de', NULL, 76)
ON CONFLICT (id) DO UPDATE SET
  title      = EXCLUDED.title,
  author     = EXCLUDED.author,
  language   = EXCLUDED.language,
  year       = EXCLUDED.year,
  book_index = EXCLUDED.book_index,
  updated_at = now();

-- Enable RLS (read-only for authenticated users)
ALTER TABLE rag_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rag_sources readable by authenticated" ON rag_sources
  FOR SELECT TO authenticated USING (true);

-- =============================================================================
-- Update pull_changes to include rag_sources
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
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- -------------------------------------------------------------------------
  -- rag_sources  (read-only catalogue)
  -- -------------------------------------------------------------------------
  SELECT json_agg(row_to_json(r)) INTO v_src_created FROM (
    SELECT
      id::text AS id,
      title, author, language, year, book_index,
      ts_to_ms(created_at) AS created_at,
      ts_to_ms(updated_at) AS updated_at
    FROM rag_sources
    WHERE created_at > v_since
  ) r;

  SELECT json_agg(row_to_json(r)) INTO v_src_updated FROM (
    SELECT
      id::text AS id,
      title, author, language, year, book_index,
      ts_to_ms(created_at) AS created_at,
      ts_to_ms(updated_at) AS updated_at
    FROM rag_sources
    WHERE updated_at > v_since AND created_at <= v_since
  ) r;

  -- -------------------------------------------------------------------------
  -- rag_paragraphs  (read-only, no deletes surfaced)
  -- -------------------------------------------------------------------------
  SELECT json_agg(row_to_json(r)) INTO v_par_created FROM (
    SELECT
      id, source_id, language,
      segment_index, segment_title, paragraph_number,
      text_raw, annotations::text AS annotations,
      ts_to_ms(deprecated_at) AS deprecated_at,
      ts_to_ms(created_at)    AS created_at,
      ts_to_ms(updated_at)    AS updated_at
    FROM rag_paragraphs
    WHERE created_at > v_since
  ) r;

  SELECT json_agg(row_to_json(r)) INTO v_par_updated FROM (
    SELECT
      id, source_id, language,
      segment_index, segment_title, paragraph_number,
      text_raw, annotations::text AS annotations,
      ts_to_ms(deprecated_at) AS deprecated_at,
      ts_to_ms(created_at)    AS created_at,
      ts_to_ms(updated_at)    AS updated_at
    FROM rag_paragraphs
    WHERE updated_at > v_since AND created_at <= v_since
  ) r;

  -- -------------------------------------------------------------------------
  -- rag_talks  (own + publicly shared)
  -- -------------------------------------------------------------------------
  SELECT json_agg(row_to_json(r)) INTO v_tlk_created FROM (
    SELECT
      talk_id::text AS id,
      collection, user_id, user_name, title, personality,
      summary, usage::text AS usage, kontext_meta::text AS kontext_meta,
      publishing_status,
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
      publishing_status,
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

  -- -------------------------------------------------------------------------
  -- rag_turns
  -- -------------------------------------------------------------------------
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

  -- -------------------------------------------------------------------------
  -- rag_references  (read-only, filtered to own talks' turns)
  -- -------------------------------------------------------------------------
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

  -- -------------------------------------------------------------------------
  -- app_notes  (own rows only)
  -- -------------------------------------------------------------------------
  SELECT json_agg(row_to_json(r)) INTO v_nte_created FROM (
    SELECT id, user_id::text AS user_id, paragraph_id, source_id, content, is_public,
      ts_to_ms(created_at) AS created_at, ts_to_ms(updated_at) AS updated_at
    FROM app_notes
    WHERE user_id = v_uid AND created_at > v_since AND deleted_at IS NULL
  ) r;

  SELECT json_agg(row_to_json(r)) INTO v_nte_updated FROM (
    SELECT id, user_id::text AS user_id, paragraph_id, source_id, content, is_public,
      ts_to_ms(created_at) AS created_at, ts_to_ms(updated_at) AS updated_at
    FROM app_notes
    WHERE user_id = v_uid AND updated_at > v_since AND created_at <= v_since AND deleted_at IS NULL
  ) r;

  SELECT json_agg(id) INTO v_nte_deleted FROM app_notes
  WHERE user_id = v_uid AND deleted_at > v_since;

  -- -------------------------------------------------------------------------
  -- app_bookmarks  (own rows only)
  -- -------------------------------------------------------------------------
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

  -- -------------------------------------------------------------------------
  -- Assemble response
  -- -------------------------------------------------------------------------
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
      )
    )
  );
END $$;

GRANT EXECUTE ON FUNCTION pull_changes(bigint, int) TO authenticated;
