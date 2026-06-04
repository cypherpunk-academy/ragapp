# ragapp — Gesamtplan

**Stand:** 2026-06-04 (Rev. 8 — Aktueller Stand nach erstem Supabase-Sync)
**Stack:** Expo (React Native) + Supabase + WatermelonDB + expo-sqlite + ragrun Backend
**App-Architektur (Expo/RN):** [ragapp-react-native-architecture.md](./ragapp-react-native-architecture.md) · Kurzreferenz Code: [ARCHITECTURE.md](../ARCHITECTURE.md)

---

## 0. Aktueller Stand (2026-06-04)

### Supabase

Projekt-Ref: `rmdqihhjjyizbuhxkxhn` · Region: `eu-north-1` (Stockholm)
Connection: `aws-1-eu-north-1.pooler.supabase.com:5432` (Session-Mode Pooler)

| Tabelle | Zeilen | Status |
|---|---|---|
| `rag_paragraphs` | 22.816 | gefüllt (via ragprep `supabaseParagraphWriter.ts`) |
| `app_paragraph_chunk` | gefüllt | **vereinfachtes Schema** — `paragraph_id, chunk_id, rag_partition, created_at`; fehlt: `paragraph_order`, `chunk_index`, `deprecated_at`, `source_id` |
| `rag_chunks` | gefüllt | kein `rendered_content`-Feld (AST) |
| `vector_chunks` | gefüllt | Qdrant-Spiegel |
| `rag_references` | gefüllt | kein `updated_at` (WDB-Sync braucht Timestamp) |
| `rag_talks` | leer | neue App-Tabelle |
| `rag_turns` | leer | neue App-Tabelle |
| `app_notes` | leer | neue App-Tabelle |
| `app_bookmarks` | leer | neue App-Tabelle |
| `app_profiles` | leer | neue App-Tabelle |
| `app_wallets` | leer | neue App-Tabelle |

**WatermelonDB Sync-RPCs `pull_changes` / `push_changes`:** deployed (`002_sync_functions.sql`), alle 7 Tabellen gemappt, RLS-Policies gesetzt.
**Nachster Sync-Blocker:** Auth in App verdrahten (Magic Link / Apple Sign-In).

### Qdrant

Kollektion `philo-von-freisinn`: **~37.300 Punkte**, 1024-dim, E5 (`intfloat/multilingual-e5-large`).
Alte Kollektion `philo-von-freisinn-v2` (768-dim, BGE-M3) geloscht.
Quote-Explanation-Embeddings laufen noch / kurz abgeschlossen (von 14.343 Chunks).

### ragprep

`supabaseParagraphWriter.ts` schreibt `rag_paragraphs` und `app_paragraph_chunk` nach Supabase. Schema vereinfacht (kein `book_id`, `segment_type`, `annotations`, kein vollstandiges `app_paragraph_chunk`-Schema).

### ragapp (Expo)

WatermelonDB Schema v6, 7 Tabellen: `paragraphs`, `chunks`, `notes`, `bookmarks`, `talks`, `turns`, `references`.
Modelle und Repositories implementiert. Screens als Gerust vorhanden (Search, Overview, Read, Chat, Notes, Konto, Auth).
`sync.ts`: implementiert, RPCs deployed und bereit. Sync lauft sobald User eingeloggt ist.
`ragrunApi.ts`: alle `/app/*`-Endpunkte typisiert — Backend-Implementierung fehlt.
Seed-Daten: `assets/seed/philosophie-der-freiheit.json`.

### ragrun

Keine `/app/`-Endpunkte implementiert. Aktiver Embedder: E5 (`intfloat/multilingual-e5-large`).

---

## 1. Zielbild

ragapp ist die mobile Benutzeroberflache fur das ragrun-Wissenssystem. Sie ermoglicht das Durchsuchen, Lesen, Notieren und KI-gestutztes Gesprach uber den Textkorpus (Rudolf Steiner u.a.), den ragrun indexiert und bereitstellt.

Die App arbeitet **offline-first**: Inhalte sind lokal auf dem Gerat verfugbar und werden uber WatermelonDB mit Supabase synchronisiert. Der ragrun-Server wird nur fur aktive KI-Abfragen (Semantische Suche, Chat) benotigt.

---

## 2. Architektur-Ubersicht

```
┌─────────────────────────────────────┐
│            ragapp (Expo)            │
│         iOS  │  Android            │
│                                     │
│  expo-sqlite  ◄──── WatermelonDB ──►│
└─────────┬───────────────────────────┘
          │ Auth (JWT)                │ Sync
          ▼                           ▼
    ┌──────────┐               ┌──────────────┐
    │ Supabase │               │  Supabase DB │
    │  Auth    │               │  (Postgres)  │
    └──────────┘               └──────────────┘
                                      │
                               ┌──────▼──────┐
                               │   ragrun    │
                               │  (FastAPI)  │
                               │  + Qdrant   │
                               └─────────────┘
```

### Komponenten

| Komponente | Rolle |
|---|---|
| **ragrun** | Backend: Qdrant Hybrid-Suche (sparse + dense), KI-Chat mit Personlichkeiten |
| **Supabase Auth** | Magic Link, Apple Sign-In (spater Google), JWT |
| **Supabase DB** | Gemeinsame Postgres fur ragapp **und** ragrun: Korpus-Quelltexte in **`rag_paragraphs`**, Notizen, App-Gesprache (`rag_talks`/`rag_turns`), Nutzerdaten; ragrun-spezifische Tabellen wie **`vector_chunks`** (Qdrant-Spiegel) liegen ebenfalls hier, werden aber **nicht** uber WatermelonDB synchronisiert |
| **WatermelonDB** | Lokale SQLite-Datenbank + Sync-Layer gegen Supabase (MIT-Lizenz); Sync via 2 Postgres-Funktionen (push/pull RPC); kein eigener Server notig |
| **expo-sqlite** | Lokale Datenbank auf dem Gerat (Offline-Zugriff) |

---

## 3. Navigation: 4 Tabs (horizontal wischbar)

```
[ Ubersicht ] [ Lesen ] [ KI-Gesprach* ] [ KI-Suche ]
                          * Anmeldung + Guthaben
```

**Notizen** sind kein eigener Tab: Erstellung per Long-Press im Lesen-Tab (Kontext-Sheet), Auflistung unter **Lesen → Beitrage → Notizen** (pro Absatz bzw. Werk-Streifen).

Implementierung: `expo-router` mit Tab-Layout + horizontales Wischen via `react-native-pager-view` oder `@react-navigation/material-top-tabs`.

---

## 4. Tab-Spezifikationen

### Tab 1: Ubersicht

**Zweck:** Hierarchische Navigation durch den Textkorpus.

**Hierarchie (3 Ebenen, rekursive TreeView-Komponente):**
```
Ebene 1: Bucher / Zyklen / GA-Bande / Einzelvortrage
  └── Ebene 2: Kapitel (Bucher) / Einzelvortrage (in Zyklen/GA-Banden)
        └── Ebene 3: Zusammenfassungen (wenn vorhanden)
```

**UI:**
- Rekursive TreeView-Komponente mit Tap-to-Expand
- Lazy-Loading: Unterebenen erst beim Aufklappen laden
- Gespeicherter Aufklapp-Zustand (zuletzt geoffnete Stellen)
- Tap auf Kapitel/Vortrag → offnet Tab 3 (Lesen) am Anfang oder letztem Lesezeichen

**Daten:** Vollstandig offline aus expo-sqlite (Metadaten-Tabellen bei Sync aktualisiert).

---

### Tab 2: Lesen

**Zweck:** Textwiedergabe in hoher Lesequalitat.

**Renderer:** FlatList + eigener Node-Renderer (kein Markdown-Parser).

**Kapitel-Einheit:** Der Lesen-Screen zeigt immer genau ein vollstandiges Kapitel oder einen vollstandigen Vortrag. Beim Sprung von Suche oder KI-Chat zu einem Absatz wird das Kapitel geladen, das diesen Absatz enthalt, und zum Absatz gescrollt. Prev/Next-Navigation am unteren Rand wechselt zwischen Kapiteln.

**Textformat — AST-Nodes (pre-parsed in ragprep, gespeichert als `rendered_content` JSONB in `rag_chunks`):**

```json
[
  { "type": "paragraph", "index": 1, "children": [
      { "type": "text",   "content": "Ist der Mensch..." },
      { "type": "italic", "content": "freies" },
      { "type": "text",   "content": "Wesen..." }
  ]},
  { "type": "quote",   "children": [...] },
  { "type": "heading", "level": 2, "content": "I. Das bewusste Handeln" }
]
```

Node-Typen: `paragraph`, `italic`, `quote`, `heading`, `footnote_ref`

**Warum kein Markdown-Parser:**
- Chunk-Text ist bereits halb-strukturiert (`"1| text <i>...</i>"`), kein reines Markdown
- Parsing zur Render-Zeit ist langsam und styling-fragil bei langen Texten
- AST einmal in ragprep erzeugen → App rendert nur noch fertige Nodes

**Typografie:**
- `textAlign: 'justify'` im ParagraphRenderer — iOS rendert Blocksatz nativ
- **Bedingte Trennzeichen (Soft Hyphens `\u00AD`):** werden von ragprep einmalig in `text_raw` eingefugt (`ragprep/src/cli/commands/textExport/step3Hyphenate.ts`, npm-Package `hypher` + `hyphenation.de`).

**Beitrags-Streifen am Ende jedes Absatzes** (Emoji + Zahl als kleine Chips, rechtsbundig):
- Notizen — eigene Anmerkungen zu diesem Absatz
- Gesprache — KI-Gesprache, die diesen Absatz im Kontext hatten
- RAG-Treffer — aus `rag_references` aggregiert

**Lesezeichen:**
- pro Nutzer, pro Absatz (`paragraph_id` als Anker)
- Letzter gelesener Absatz automatisch gespeichert
- Manuelles Lesezeichen via Absatz-Kontextmenu (Long-Press)

**Absatz-Kontextmenu (Long-Press):**
- Lesezeichen setzen/entfernen
- Notiz zu diesem Absatz schreiben
- KI-Chat zu diesem Absatz starten (Anmeldung + Guthaben erforderlich)
- Absatz kopieren / teilen
- Beitrage anzeigen

---

### Lesen → Beitrage (ehem. Tab Notizen)

**Zweck:** Personliche Annotationen und weitere Beitrage pro Absatz (nicht eigener Haupt-Tab).

**Schema (Supabase):**
```sql
app_notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users,
  paragraph_id text,
  segment_id  text,
  source_id   text,
  content     text NOT NULL,
  is_public   bool DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
)
```

---

### Tab 3: KI-Gesprach (Anmeldung + Guthaben)

**Zweck:** Gesprachsbasiertes Erkunden des Textes mit KI-Personlichkeiten.

**rag_talks** (Gesprach-Kopf):
```
talk_id, collection, user_id, user_display_name, slug, title,
action_id, summary, usage, context_mode, context_ids, kontext_meta,
publishing_status, kontext_source_id, kontext_segment_id, kontext_paragraph
```

**rag_turns** (Einzelne Gesprachsrunden):
```
turn_id, talk_id, turn_index, action_id, assistant_personality,
user_message, assistant_message, usage, collection,
is_relay, chunk_index_map, kontext_meta
```

**Kontext-Picker:**
- `context_mode = "free"` — keine Kontext-IDs
- `context_mode = "paragraph"` — `context_ids.paragraph_id`
- `context_mode = "segment"` — `context_ids.source_id` + `context_ids.segment_id`

**Endpunkte (ragrun):**
- `POST /app/chat` — Nachricht + personality + kontext
- `POST /app/chat/{talk_id}/summarize` — Zusammenfassung generieren

---

### Tab 4: KI-Suche

**Zweck:** Semantische Hybrid-Suche (sparse + dense via Qdrant) uber den gesamten Textkorpus via ragrun.

**Offline-Verhalten:**
- Semantische Suche erfordert Internet-Verbindung (ragrun + Qdrant).
- Ohne Verbindung: Suchfeld ausgegraut mit klar sichtbarem Hinweis.
- **Kein** SQLite-FTS-Fallback — Hybrid-Suche ist die einzige Suchmethode.

**UI:**
- Suchfeld (oben, immer sichtbar)
- Online/Offline-Indikator neben dem Suchfeld
- Filter-Chips: Bucher / Vortrage / Gesprache / Zitate / Zusammenfassungen
- Ergebnisliste: Snippet mit Hervorhebung des Treffers, Quellenangabe
- Tap auf Ergebnis → offnet Tab 2 (Lesen) auf dem betreffenden Absatz

**Endpunkte (ragrun, alle mit `/app/`-Prefix):**
- `POST /app/search` — Hybrid-Suche (sparse + dense), Body: `{query, types[], limit, collection}`

---

## 5. Allgemeine Funktionalitaten

### 5.1 Konto

| Funktion | Umsetzung |
|---|---|
| Konto anlegen | Supabase Auth: Magic Link (E-Mail) |
| Apple Sign-In | Supabase OAuth: Apple (Pflicht fur App Store) |
| Google Sign-In | Spater: Supabase OAuth: Google |
| Name andern | Supabase `app_profiles`-Tabelle |
| Guthaben aufladen | In-App Purchase via RevenueCat |
| Zahlung | Apple IAP / Google Play Billing via RevenueCat |
| Verbrauchsubersicht | KI-Anfragen + Token-Verbrauch via `rag_usage` |
| Konto loschen | Pflicht (App Store + Play Store): loscht `auth.user` + alle Daten (Cascade) |
| Datenexport | JSON-Export aller Nutzerdaten (DSGVO Auskunftsrecht) |

**Wallet / Guthaben:**
```sql
app_wallets (
  user_id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_cents  int NOT NULL DEFAULT 0,
  currency       text NOT NULL DEFAULT 'EUR',
  updated_at     timestamptz DEFAULT now()
)

app_wallet_transactions (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type                     text NOT NULL, -- 'purchase' | 'chat_debit' | 'refund' | 'adjustment'
  amount_cents             int NOT NULL,
  currency                 text NOT NULL DEFAULT 'EUR',
  provider                 text,
  provider_transaction_id  text,
  usage_id                 uuid,
  created_at               timestamptz DEFAULT now()
)
```

### 5.2 Freunde (V2)

```sql
app_friendships (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users,
  addressee_id uuid NOT NULL REFERENCES auth.users,
  status       text NOT NULL,  -- 'pending' | 'accepted' | 'declined'
  created_at   timestamptz DEFAULT now()
)
```

**V1 Sharing:** Nur "Link teilen" — ein signierter, ablaufender Deep-Link auf ein Gesprach oder eine Notiz.

---

## 6. Absatzdaten & Verknupfungstabelle

### 6.1 `rag_paragraphs` als fachliche Quelltext-Tabelle

**Ziel-Schema (deployed, 22.816 Zeilen):**
```sql
rag_paragraphs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paragraph_id      text NOT NULL UNIQUE, -- '{source_id}:{segment_index}:{paragraph_number}'
  source_id         text NOT NULL,
  language          text,
  segment_index     int  NOT NULL,
  segment_title     text NOT NULL,
  paragraph_number  int  NOT NULL,
  text_raw          text NOT NULL,
  annotations       jsonb,
  deprecated_at     timestamptz,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  UNIQUE (source_id, segment_index, paragraph_number)
)
```

**Hinweis zum aktuellen Schema:** Das von ragprep geschriebene Schema ist vereinfacht — `book_id`, `segment_type`, und vollstandige `annotations`-Struktur fehlen noch. Die Tabelle existiert und ist befullt; Erweiterung in Phase 3.

### 6.1a `rag_chunks` vs. `vector_chunks` (Supabase)

| Tabelle | Rolle |
|---|---|
| **`rag_chunks`** | Kanonischer Chunk-Archiv in Postgres: jede Version eines Chunks bleibt als Zeile erhalten. Bei Neu-Chunking werden alte Zeilen nicht geloscht, sondern mit **`deprecated_at`** markiert. |
| **`vector_chunks`** | SQL-Spiegel der aktuell in Qdrant indexierten Payloads. Nur ragrun. |

**AST-Spalte `rendered_content`:** Noch **nicht** in `rag_chunks`. Wird in Phase 3 per Migration (`ALTER TABLE rag_chunks ADD COLUMN rendered_content jsonb`) hinzugefugt; ragprep belegt sie beim nachsten Chunking-Lauf.

### 6.2 Verknupfungstabelle: paragraph_id ↔ rag_chunk

**Ziel-Schema (noch nicht vollstandig deployed):**
```sql
app_paragraph_chunk (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paragraph_id      text NOT NULL REFERENCES rag_paragraphs(paragraph_id),
  collection        text NOT NULL,
  chunk_id          text NOT NULL,
  source_id         text NOT NULL,
  chunk_index       int  NOT NULL,     -- Reihenfolge des Chunks innerhalb der Quelle
  paragraph_order   int  NOT NULL,     -- Reihenfolge dieses Absatzes innerhalb des Chunks
  paragraph_page    int,
  sentence_start    int,
  sentence_end      int,
  deprecated_at     timestamptz,
  created_at        timestamptz DEFAULT now()
)
```

**Aktueller Stand:** Tabelle existiert mit vereinfachtem Schema (`paragraph_id, chunk_id, rag_partition, created_at`). Fehlende Felder: `collection`, `source_id`, `chunk_index`, `paragraph_order`, `deprecated_at`. Migration + ragprep-Erweiterung stehen aus.

**Navigation von Suchergebnis zum Absatz:** Qdrant gibt `chunk_id` zuruck. Die App navigiert zum ersten Absatz des Chunks (MIN(`paragraph_number`) uber `app_paragraph_chunk`). Kein `paragraph_order` fur die Navigation notig — `paragraph_number` aus `rag_paragraphs` reicht.

---

## 7. Datenschicht & Sync-Strategie

### 7.1 Was liegt wo

| Daten | Supabase DB | expo-sqlite (WatermelonDB) | Sync via Supabase RPC |
|---|---|---|---|
| Texte (`rag_paragraphs`) | Ja | Ja | pull only |
| RAG-Chunks (`rag_chunks`) | Ja | Nein | Nein — on demand via `GET /app/chunks/{id}` |
| Qdrant-Spiegel (`vector_chunks`) | Ja | Nein | Nein (nur ragrun) |
| RAG-Referenzen (`rag_references`) | Ja | Ja | pull only (ragrun schreibt, App liest) |
| Paragraph-Chunk-Mapping (`app_paragraph_chunk`) | Ja | Nein | Nein — ragrun liefert `paragraph_id` in API-Antworten |
| Notizen (`app_notes`) | Ja | Ja | **bidirektional** |
| Gesprache (`rag_talks`, `rag_turns`) | Ja | Ja | pull only (ragrun schreibt via `POST /app/chat`) |
| Lesezeichen (`app_bookmarks`) | Ja | Ja | **bidirektional** |
| Nutzerprofil / Freundschaften | Ja | Nein | Nein (immer online) |
| KI-Anfragen (live) | Log in `rag_usage` | Nein | Nein |
| LLM-Preise (`llm_pricing`) | Ja | Nein | Nein (serverseitig) |

**Nur `app_notes` und `app_bookmarks` sind bidirektional.** Alles andere wird von ragrun (via HTTP-API) oder ragprep geschrieben und von der App nur gepullt.

### 7.2 Datenmigration: Textkorpus → Supabase

**Migrationsschritte:**

| # | Schritt | Status |
|---|---|---|
| 1 | Supabase-Projekt anlegen | **erledigt** (eu-north-1) |
| 2 | Schema deployen: alle Tabellen via Supabase Migrations | **erledigt** |
| 3 | `rag_chunks` / `vector_chunks` / `rag_references` / `llm_pricing` einmalig kopieren | **erledigt** |
| 4 | `rag_paragraphs` importieren (22.816 Zeilen, via ragprep) | **erledigt** (vereinfachtes Schema) |
| 5 | `app_paragraph_chunk` befullen | **erledigt** (vereinfachtes Schema — Felder fehlen) |
| 6 | Mapping validieren | **offen** (Validator in ragprep noch nicht implementiert) |
| 7 | ragprep schreibt direkt in Supabase-Postgres | **erledigt** (`supabaseParagraphWriter.ts`) |
| 8 | ragapp-Chat/RAG-Prozesse schreiben `rag_talks`, `rag_turns`, `rag_references`, `rag_usage` in Supabase | **offen** (Phase 5) |
| 9 | ragprep: AST-Parse-Schritt → `rendered_content` in `rag_chunks` | **offen** |
| 10 | Supabase-Migration: `ALTER TABLE rag_chunks ADD COLUMN rendered_content jsonb` | **offen** |
| 11 | Qdrant / ragrun unverandert; `vector_chunks`-Sync via `IngestionService` | **erledigt** (lauft bereits) |

**Noch ausstehend in ragprep:**
- `app_paragraph_chunk`-Schema vervollstandigen (`chunk_index`, `paragraph_order`, `deprecated_at`, `source_id`, `collection`)
- AST-Parse-Schritt fur `rendered_content`
- Mapping-Validator

### 7.3 WatermelonDB Sync-Konfiguration

WatermelonDB synchronisiert uber zwei Supabase-RPC-Funktionen:
- `pull_changes(last_pulled_at, user_id, schema_version, client_version)` — liefert alle Anderungen seit letztem Sync
- `push_changes(changes, last_pulled_at, user_id, schema_version, client_version)` — schreibt lokale Anderungen nach Supabase

**Status: RPCs sind deployed und funktionsbereit** (`supabase/migrations/002_sync_functions.sql`). Alle 7 WDB-Tabellen korrekt gemappt, PK-Umbenennung (`talk_id→id`, `turn_id→id`, `ref_id→id`) implementiert, `rag_references.created_at` als `updated_at`-Alias, `deleted_at`-Tombstones fur `app_notes`/`app_bookmarks`. `rag_paragraphs`: 22.816 Zeilen, alle `id`-Felder im Format `{source_id}:{segment_index}:{paragraph_number}` konsistent.

**Sync-Scope pro Tabelle:**
- `rag_paragraphs`, `rag_chunks` (gefiltert), `rag_references`, `app_paragraph_chunk`: global read-only
- `vector_chunks` und andere ragrun-exklusive Tabellen: **kein** WatermelonDB-Pull/Push
- `app_notes`, `rag_talks`, `rag_turns`, `app_bookmarks`: gefiltert nach `user_id` (bidirektional)
- `llm_pricing`, `rag_usage`: nicht in WatermelonDB; serverseitig

---

## 8. Deployment-Ubersicht

| Dienst | Plattform | Status |
|---|---|---|
| **Supabase** (Auth, Postgres) | Supabase Cloud, eu-north-1 | aktiv, $25/mo |
| **ragrun API** | Railway Docker-Compose | aktiv |
| **Qdrant** | Railway | aktiv, philo-von-freisinn ~37.300 Punkte |
| **Embeddings-Service** | Railway | aktiv (E5 intfloat/multilingual-e5-large) |
| **ragapp** | App Store / Play Store | in Entwicklung |

Railway Ressourcen: 10 CPUs / 15 GB RAM, Abrechnung nach Verbrauch.
WatermelonDB lauft komplett client-seitig — kein zusatzlicher Container notig.

---

## 10. ragrun Endpunkte (alle mit `/app/` Prefix)

**Status: Endpunkte sind in `ragrunApi.ts` typisiert, aber in ragrun noch nicht implementiert.**

| Methode | Pfad | Beschreibung | Status |
|---|---|---|---|
| POST | `/app/search` | Hybrid-Suche (Qdrant sparse+dense) | offen |
| GET  | `/app/sources` | Liste aller Quellen (fur Tab 2 Ubersicht) | offen |
| GET  | `/app/sources/{source_id}/segments` | Kapitel/Segmente einer Quelle | offen |
| GET  | `/app/chunks/{chunk_id}` | Chunk-Detail (Text, rendered_content) | offen |
| POST | `/app/chat` | Chat-Nachricht senden | offen |
| POST | `/app/chat/{talk_id}/summarize` | Gesprachszusammenfassung | offen |
| GET  | `/app/personalities` | Liste der verfugbaren Personlichkeiten | offen |
| GET  | `/app/health` | Health-Check + Online-Status fur App | offen |

Alle Typen (`ragrun.ts`) sind in ragapp definiert. Die FastAPI-Router-Datei `/app/api/app_router.py` existiert noch nicht.

---

## 11. Frage: Daten nach App-Deinstallation

**Antwort:** Alle nutzerspezifischen Daten (Notizen, Gesprache, Lesezeichen) liegen in Supabase. Nach Neuinstallation + Login synchronisiert WatermelonDB alles auf das neue Gerat.

**Einziges Risiko:** Offline-Anderungen, die beim Deinstallieren noch nicht zu Supabase hochgeladen waren, gehen verloren. Gegenmassnahme: aktiven Sync-Flush beim App-Backgrounding auslosen.

---

## 12. DSGVO-Compliance & App-Store-Anforderungen

### DSGVO

| Anforderung | Umsetzung |
|---|---|
| Datenschutzerklarung | Extern gehostet, URL fest; in App, App Store, Play Store hinterlegen |
| Einwilligung | Bei Registrierung: Checkbox + Link |
| Konto loschen | In-App-Funktion: loscht `auth.user` + alle Daten (Cascade) — Pflicht |
| Datenexport | Endpoint: Export als JSON (Notizen, Gesprache, Lesezeichen) |
| Analytics | PostHog mit Opt-in (kein automatisches Tracking) |
| Datenverarbeitung EU | Supabase-Region: eu-north-1 (Stockholm) |

### Apple App Store

| Anforderung | Details |
|---|---|
| Privacy Manifest | `PrivacyInfo.xcprivacy` — Pflicht seit iOS 17 |
| Sign in with Apple | Pflicht (weil anderen OAuth-Provider vorhanden) |
| In-App Purchase | Nur via StoreKit/RevenueCat, kein externer Payment-Link |
| Account Deletion | In-App — App Review-Pflicht seit 2022 |
| Export-Deklaration | HTTPS/JWT: Standard-Exempt |

### Google Play Store

| Anforderung | Details |
|---|---|
| Data Safety Section | Im Play Console ausfullen |
| In-App Billing | Google Play Billing via RevenueCat |
| Account Deletion | In-App + URL im Play Console |

---

## 13. Design-Workflow

Design und UI-Implementierung laufen uber **Cursor.ai** direkt im Code. Kein Figma-Token-Export, kein separater Design-Workflow.

Referenz-Datenbindungen (fur Code-Kommentare / Cursor-Kontext):
```
computed.paragraph_rendered  ← text_raw + annotations gerendert
search_result.snippet        ← Qdrant-Payload aus ragrun
rag_paragraphs.segment_title ← Kapitel-/Vortragstitel
rag_paragraphs.paragraph_number
app_notes.count_for_paragraph
```

---

## 14. Phasenplan

Prioritat: **Lesen → Annotationen → Sync → Suche → Chat → Social**

Jede Phase liefert etwas Lauffahiges.

---

### Phase 0 — Fundament

- [x] Expo-Projekt initialisieren (`expo-router`, TypeScript)
- [x] Tab-Navigation (4 Tabs, horizontal wischbar)
- [x] WatermelonDB + expo-sqlite einrichten, Schema v6 mit 7 Tabellen
- [x] Repository-Layer aufsetzen (Paragraph, Note, Bookmark, Talk, Turn, Reference)
- [x] Seed-Daten: `assets/seed/philosophie-der-freiheit.json`
- [x] Auth-Screens: Login, Register, Auth-Callback
**Exit-Kriterium:** App startet, Tabs wischbar, Testdaten lokal lesbar.
**Status:** Abgeschlossen.

---

### Phase 1 — Lesen

Nur lokale Daten. Kein Supabase, kein Sync.

- [x] Node-Renderer (Interim-Renderer aus `text_raw` + Annotations — `rendered_content` AST kommt in Phase 3)
- [x] Tab 1: Ubersicht — rekursive TreeView (3 Ebenen: Quelle → Kapitel → Zusammenfassung)
- [x] Tab 2: Lesen — FlatList + Node-Renderer, Absatznummern, Absatz-Badges
- [x] Long-Press-Menu auf Absatz (Kontextmenu-Overlay)
- [x] Lesezeichen lokal (WatermelonDB, kein Sync)
- [x] Letzter gelesener Absatz automatisch merken

**Exit-Kriterium:** Ein Buch vollstandig lesbar, Lesezeichen setzen funktioniert.
**Status:** Grosstenteils abgeschlossen. `rendered_content`-AST-Renderer folgt in Phase 3 nach DB-Migration.

---

### Phase 2 — Annotationen

Weiterhin lokal. Datenmodell stabilisiert sich hier.

- [x] Lesen/Beitrage — Streifen + 3 Unter-Tabs; Notizen per Long-Press (kein Notizen-Haupttab)
- [x] `paragraph_id`-Referenzen (`{source_id}:{segment_index}:{paragraph_number}`) durchgehend einsetzen
- [x] Kontext-Ubergabe: Long-Press → Notiz vorausgefullt mit Absatz-Kontext
- [x] Notiz-Badges am Absatz (Tab 2) zeigen vorhandene Notizen an

**Exit-Kriterium:** Notizen zu Absatzen schreiben, lesen, loschen — vollstandig lokal.
**Status:** Grosstenteils abgeschlossen.

---

### Phase 3 — Sync & Auth

Erst hier kommt Supabase vollstandig ins Spiel.

**Supabase (Infrastruktur):**
- [x] Supabase-Projekt deployed (eu-north-1)
- [x] Schema deployen: alle Tabellen vorhanden
- [x] `rag_paragraphs` (22.816 Zeilen), `rag_chunks`, `vector_chunks`, `rag_references` importiert
- [x] ragprep schreibt direkt in Supabase (`supabaseParagraphWriter.ts`)
- [ ] `rag_paragraphs`-Schema vervollstandigen (`book_id`, `segment_type`, vollstandige `annotations`)
- [ ] `app_paragraph_chunk`-Schema vervollstandigen (`chunk_index`, `paragraph_order`, `deprecated_at`, `source_id`, `collection`)
- [ ] ragprep-Validator: `app_paragraph_chunk` gegen Chunks und Boundary-Daten prufen
- [ ] Supabase-Migration: `ALTER TABLE rag_chunks ADD COLUMN rendered_content jsonb`
- [ ] ragprep: AST-Parse-Schritt → `rendered_content` befullen

**Auth (ragapp):**
- [ ] Auth: Magic Link in App verdrahten (Screens existieren)
- [ ] Auth: Apple Sign-In einrichten (Supabase OAuth)
- [ ] Konto-Verwaltung: Profil, Konto-Loschung (App Store Pflicht), Datenexport

**WatermelonDB Sync:**
- [ ] Supabase RPC `pull_changes` implementieren und deployen
- [ ] Supabase RPC `push_changes` implementieren und deployen
- [ ] RLS-Policies fur App-Tabellen setzen
- [ ] PK-Umbenennung: `talk_id → id`, `turn_id → id`, `ref_id → id` im RPC
- [ ] `rag_references.updated_at` hinzufugen (oder `created_at`-Alias im RPC)
- [ ] Erstsync: Textkorpus auf Gerat ziehen
- [ ] rag_chunks-Sync-Filter: nur relevante `chunk_type`s

**Exit-Kriterium:** Login, Sync, Notizen auf zwei Geraten synchron.
**Status:** Infrastruktur steht. Blocker: Auth in App verdrahten (Magic Link + Apple Sign-In).

---

### Phase 4 — KI-Suche

Erfordert Online-Verbindung zu ragrun. **Blocker: ragrun `/app/`-Endpunkte fehlen.**

**ragrun (neue Endpunkte):**
- [ ] `POST /app/search` — Hybrid-Suche mit `source_ids`-Filter, Snippet-Generierung
- [ ] `GET /app/sources` — Liste aller Quellen
- [ ] `GET /app/sources/{source_id}/segments` — Kapitel/Segmente
- [ ] `GET /app/chunks/{chunk_id}` — Chunk-Detail mit `rendered_content`
- [ ] `GET /app/personalities` — verfugbare Personlichkeiten
- [ ] `GET /app/health` — Health-Check

**ragapp:**
- [ ] Tab 4: KI-Suche — `POST /app/search` (Qdrant Hybrid)
- [ ] Offline-Zustand: Suchfeld ausgegraut mit Hinweis
- [ ] Suchergebnis-Tap → offnet Tab 2 (Lesen) auf dem betreffenden Absatz (via `app_paragraph_chunk`)

**Exit-Kriterium:** Semantische Suche findet Absatze, navigiert korrekt dorthin.
**Status:** TypeScript-Typen in ragapp fertig. Backend-Endpunkte nicht implementiert.

---

### Phase 5 — KI-Gesprach (Anmeldung + Guthaben)

**ragrun (neue Endpunkte):**
- [ ] `POST /app/chat` — Chat-Nachricht mit personality + kontext
- [ ] `POST /app/chat/{talk_id}/summarize` — Zusammenfassung generieren

**ragapp:**
- [ ] Tab 3: KI-Gesprach — Personlichkeits-Picker, Kontext-Modi (Absatz / Kapitel / frei)
- [ ] `rag_talks` / `rag_turns` bidirektional in WatermelonDB synchen
- [ ] RevenueCat + Apple IAP / Google Play Billing einrichten
- [ ] Guthaben-Gate (Tab 5 sendet nur bei ausreichendem Kontostand)
- [ ] Chat-Kosten gegen Kontostand abbuchen (`rag_usage` + `app_wallet_transactions`)
- [ ] PostHog Opt-in Analytics

**Exit-Kriterium:** Guthaben kaufbar, KI-Chat mit Personlichkeit und Kontext funktioniert.
**Status:** Nicht begonnen.

---

### Phase 6 — Social V1

- [ ] Link teilen: signierter Deep-Link auf Gesprach oder Notiz (Supabase Edge Function)

**Exit-Kriterium:** Geteilter Link offnet Inhalt fur Empfanger (auch ohne Account: read-only).

---

### Phase 7 — Store-Readiness

- [ ] Privacy Manifest (`PrivacyInfo.xcprivacy`, iOS)
- [ ] Data Safety Section (Android Play Console)
- [ ] Datenschutzerklarung + Impressum (extern gehostet)
- [ ] Account-Deletion-Flow testen
- [ ] Figma Design Tokens → `theme.ts` finalisiert
- [ ] Beta-Tests (TestFlight + Play Internal Testing)
- [ ] App Store / Play Store Einreichung

---

### Spater (V2 / V3)

- **V2:** Freunde-System (Anfragen, Freundesliste, Gesprache mit Freunden teilen)
- **V3:** Offentlicher Feed + Meldungsfunktion + Bewertungen

---

## 15. Tech-Stack

```
expo (SDK 52+)
expo-router                  — Navigation (file-based)
react-native-pager-view      — Wischbare Tabs
@shopify/flash-list          — Performante Listen (Texte, Notizen, Gesprache)
@nozbe/watermelondb          — Lokale SQLite-DB + Sync-Layer (MIT)
expo-sqlite                  — Lokale DB
@supabase/supabase-js        — Auth + DB-Client
expo-secure-store            — JWT sicher speichern
react-native-reanimated      — Animationen
expo-notifications           — Push (Phase 2)
react-native-purchases       — RevenueCat IAP (Phase 5)
posthog-react-native         — Analytics mit Opt-in (Phase 5)
```

---

## 16. Kostenkalkulation & Guthabenpreise

### 16.1 Fixkosten (monatlich)

| Posten | Kosten |
|---|---|
| Supabase Pro | $25 |
| Railway (ragrun + qdrant + embeddings) | ~$20–40 (nach Verbrauch) |
| Apple Developer Program | $8 (= $99/Jahr) |
| Google Play Developer | einmalig $25 |
| EAS Build (Expo) | $0 (Free-Tier) |
| PostHog | $0 (bis 1M Events/mo) |
| RevenueCat | $0 (bis $10.000 MTR/mo) |
| **Gesamt Fix** | **~$53–73/mo** |

### 16.2 Variable Kosten: Anthropic API (KI-Chat)

Modell: Claude Sonnet — $3/MTok Input, $15/MTok Output

| Annahme | Wert |
|---|---|
| Tokens pro Gesprachsrunde (Input) | ~2.000 |
| Tokens pro Gesprachsrunde (Output) | ~500 |
| Kosten pro Runde | ~$0.014 |
| API-Kosten pro aktivem Chat-User/Monat (10 Gesprache × 10 Runden) | **~$1.40** |

### 16.3 Store-Gebuhren

Apple Small Business Program + Google Play: dauerhaft **15%** bei Jahresumsatz < $1M.

| Guthaben-Kauf | Store-Gebuhr (15%) | Netto aus Store |
|---|---|---|
| €4,99 | −€0,75 | €4,24 |
| €9,99 | −€1,50 | €8,49 |

### 16.4 Deckungsbeitrags-Rechnung

| Posten | €4,99/mo | €9,99/mo |
|---|---|---|
| Einnahme (netto nach Store 15%) | +€4,24 | +€8,49 |
| Anthropic API (~$1.40 ≈ €1.30) | −€1,30 | −€1,30 |
| Infrastruktur-Anteil ($60/mo ÷ 100 User) | −€0,56 | −€0,56 |
| **Deckungsbeitrag** | **~€2,38/User/mo** | **~€6,63/User/mo** |

Breakeven bei €4,99: ~25 aktive zahlende Chat-User.

---

## 17. Entscheidungsprotokoll

| Thema | Entscheidung |
|---|---|
| Analytics | PostHog mit Opt-in |
| Textrenderer | FlatList + eigener Node-Renderer (AST aus ragprep, kein Markdown-Parser) |
| Sharing V1 | Nur Link teilen (signierter Deep-Link) — kein Feed, keine Moderation |
| Sharing V2 | Freunde-System |
| Sharing V3 | Offentlicher Feed + Meldungsfunktion |
| Sprache | Nur Deutsch (V1) |
| Offline-Suche | Keine — ausgegraut mit Hinweis |
| Suchstrategie | Qdrant Hybrid (sparse + dense) via ragrun |
| Tab 2 Hierarchie | 3 Ebenen, rekursive TreeView |
| Sync-Engine | WatermelonDB (statt PowerSync) — reifer, MIT-Lizenz, kein eigener Server |
| rag_chunks-Sync | Nur relevante chunk_types (book, summary, quote, typology) — nicht alle 50.000 Chunks |
| app_paragraph_chunk | Bleibt serverseitig fur Navigation (Suche → Absatz); WDB-Sync erst wenn vollstandiges Schema deployed |
| Chunk-Speicher Supabase | `rag_chunks` = Archiv inkl. `deprecated_at`; `vector_chunks` = Qdrant-Spiegel, nur serverseitig |
| Supabase-Region | eu-north-1 (Stockholm) — bereits deployed |

---

## 18. Technische Risiken

### 18.1 Sync-Strategie — WatermelonDB

WatermelonDB wurde bewusst als risikoarmere Alternative zu PowerSync gewahlt:
- Seit 2018, MIT-Lizenz, grosse Community
- Produktionserprobt bei Consumer-Apps (Nozbe u.a.)
- Kein eigener Server — synct direkt gegen Supabase via RPC
- Offizieller Supabase-Integrationsleitfaden vorhanden

**Verbleibende Sync-Risiken:**
- iOS-App-Lifecycle bei Hintergrundsync (standard RN-Problem, gut dokumentiert)
- Schema-Migrationen erfordern WatermelonDB-Migrationsskripte
- PK-Umbenennung (`talk_id → id`) muss im Supabase-RPC korrekt abgebildet werden

**Repository-Layer (bereits implementiert):**
```
[ Tab-Komponenten ]
       ↓
[ Repository (NoteRepository, ParagraphRepository, ...) ]
       ↓
[ WatermelonDB / expo-sqlite ]
```

**Fallback-Plan:** Falls WatermelonDB Probleme zeigt, ist Wechsel zu reinem Online-Betrieb (Supabase JS direkt) moglich — kein Komponenten-Code kennt WatermelonDB direkt.

---

## 19. Offene Punkte

### Kritische Blocker (Phase 3)

1. **Auth in App verdrahten:** RPCs sind deployed. Sync lauft sobald ein User eingeloggt ist. Magic Link + Apple Sign-In mussen in den Auth-Screens vollstandig an Supabase angebunden werden.

2. **`rendered_content`-Spalte fehlt:** `rag_chunks` hat noch kein `rendered_content jsonb`. Der Node-Renderer in ragapp hat keine Daten zum Rendern. Benotigt: Supabase-Migration + ragprep AST-Parse-Schritt.

3. **`app_paragraph_chunk`-Schema unvollstandig:** Fehlende Felder (`chunk_index`, `paragraph_order`, `deprecated_at`) konnen erst benotigt werden, wenn die Navigation Suche → Absatz implementiert wird (Phase 4). Kein Blocker fur Phase 3, aber vor Phase 4 zu erledigen.

### Offen fur spatere Phasen

4. **ragrun `/app/`-Endpunkte:** Alle Endpunkte typisiert in `ragrunApi.ts`, aber kein Backend-Router implementiert. Blocker fur Phase 4 (Suche) und Phase 5 (Chat).

5. **Auth in ragapp verdrahten:** Magic-Link-Flow und Apple Sign-In sind als Screens vorhanden, aber nicht vollstandig mit Supabase Auth verdrahtet.

6. **RevenueCat-Integration:** Fur Phase 5; noch nicht begonnen.
