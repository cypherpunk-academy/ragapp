# Supabase Setup

## Voraussetzungen

1. Account auf [supabase.com](https://supabase.com) anlegen
2. Neues Projekt erstellen (Region: **eu-central-1 Frankfurt**)
3. Projekt-URL und Anon-Key aus *Settings → API* kopieren

## Umgebungsvariablen setzen

In `.env.local` (oder Expo-Secrets für CI):

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Migrations ausführen

Im Supabase SQL-Editor oder via CLI:

```bash
# 1. Tabellen, Indizes, RLS
psql "$DATABASE_URL" -f supabase/migrations/001_initial_schema.sql

# 2. Sync-RPC-Funktionen
psql "$DATABASE_URL" -f supabase/migrations/002_sync_functions.sql
```

Oder alles auf einmal im SQL-Editor einfügen (die Dateien sind idempotent — `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`).

## Tabellen-Übersicht

| Supabase-Tabelle      | WatermelonDB-Tabelle | Richtung       |
|-----------------------|----------------------|----------------|
| `rag_paragraphs`      | `paragraphs`         | Pull only      |
| `rag_chunks`          | `chunks`             | Pull only      |
| `rag_talks`           | `talks`              | Pull only      |
| `rag_turns`           | `turns`              | Pull only      |
| `rag_references`      | `references`         | Pull only      |
| `app_notes`           | `notes`              | Bidirektional  |
| `app_bookmarks`       | `bookmarks`          | Bidirektional  |
| `app_paragraph_chunk` | —                    | Server-intern  |

## Auth

- Magic Link: aktiviert im Supabase Dashboard unter *Auth → Providers → Email*
- Apple Sign-In: aktiviert unter *Auth → Providers → Apple* (benötigt Apple Developer-Konto + Services ID)
- **Deep Link**: In *Auth → URL Configuration* folgende Redirect-URL eintragen:
  ```
  ragapp://auth/callback
  ```

## Daten laden (ragprep)

Paragraphen und Chunks werden von `ragprep` befüllt — nicht von der App selbst.
Laufreihenfolge:

1. Supabase-Projekt aufsetzen (diese Anleitung)
2. `ragprep` mit Supabase-Connection-String konfigurieren und laufen lassen
3. App-Sync startet beim ersten Login automatisch

## RPC-Funktionen

- `pull_changes(last_pulled_at bigint, schema_version int)` — gibt alle Änderungen seit dem letzten Sync zurück
- `push_changes(changes jsonb, last_pulled_at bigint)` — schreibt Notizen und Lesezeichen des eingeloggten Users
