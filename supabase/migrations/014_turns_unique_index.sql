-- =============================================================================
-- rag_turns: Unique-Constraint auf (talk_id, turn_index)
--
-- Vorher: ragrun-Bug `max_idx or -1` (0 ist falsy) → jeder Folge-Turn bekommt
-- erneut turn_index = 0. Duplikate wurden nicht abgewiesen (kein Constraint).
-- Der Bug in app_talks_repository.py ist gefixt; diese Migration sichert die
-- DB-Ebene ab.
--
-- Vorgehen:
--   1. Bestehende Duplikate bereinigen: pro (talk_id, turn_index) nur den
--      neuesten Turn (höchste updated_at / größte turn_id bei Gleichstand)
--      behalten, alle älteren löschen.
--   2. Unique-Index anlegen.
-- =============================================================================

-- 1. Duplikate entfernen (CTE vermeidet NOT IN-Probleme mit Self-Join)
WITH to_keep AS (
  SELECT DISTINCT ON (talk_id, turn_index) turn_id
  FROM rag_turns
  WHERE turn_index IS NOT NULL
  ORDER BY talk_id, turn_index, updated_at DESC, turn_id DESC
)
DELETE FROM rag_turns
WHERE turn_index IS NOT NULL
  AND turn_id NOT IN (SELECT turn_id FROM to_keep);

-- 2. Unique-Index (partial: nur für Zeilen mit gesetztem turn_index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_rag_turns_talk_turn_index
  ON rag_turns (talk_id, turn_index)
  WHERE turn_index IS NOT NULL;
