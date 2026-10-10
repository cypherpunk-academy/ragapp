-- Block C / Schritt 14: Herkunft der MCP-Verbindung
-- client_kind + redirect_host on connector_grants (see filo-naechste-schritte §8.2).
-- Numbering: 020 is note content max length; this is 021.

ALTER TABLE connector_grants
  ADD COLUMN IF NOT EXISTS client_kind varchar(32) NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS redirect_host text;

COMMENT ON COLUMN connector_grants.client_kind IS
  'Mapped AI client: claude | chatgpt | cursor | unknown (from redirect host via config/ai_clients.yaml)';
COMMENT ON COLUMN connector_grants.redirect_host IS
  'Hostname from the OAuth client redirect_uri used to resolve client_kind';
