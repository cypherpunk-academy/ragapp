# ragapp — Gesamtplan

**Stand:** 2026-05-14 (Rev. 7 — Verweis auf `ragapp-react-native-architecture.md`)
**Stack:** Expo (React Native) + Supabase + WatermelonDB + expo-sqlite + ragrun Backend  
**App-Architektur (Expo/RN):** [ragapp-react-native-architecture.md](./ragapp-react-native-architecture.md) · Kurzreferenz Code: [ARCHITECTURE.md](../ARCHITECTURE.md)

---

## 1. Zielbild

ragapp ist die mobile Benutzeroberfläche für das ragrun-Wissenssystem. Sie ermöglicht das Durchsuchen, Lesen, Notieren und KI-gestützte Gespräche über den Textkorpus (Rudolf Steiner u.a.), den ragrun indexiert und bereitstellt.

Die App arbeitet **offline-first**: Inhalte sind lokal auf dem Gerät verfügbar und werden über WatermelonDB mit Supabase synchronisiert. Der ragrun-Server wird nur für aktive KI-Abfragen (Semantische Suche, Chat) benötigt.

---

## 2. Architektur-Übersicht

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
| **ragrun** | Backend: Qdrant Hybrid-Suche (sparse + dense), KI-Chat mit Persönlichkeiten |
| **Supabase Auth** | Magic Link, Apple Sign-In (später Google), JWT |
| **Supabase DB** | Gemeinsame Postgres für ragapp **und** ragrun: Korpus-Quelltexte in **`rag_paragraphs`**, Notizen, App-Gespräche (`rag_talks`/`rag_turns`), Nutzerdaten, Freundschaften; ragrun-spezifische Tabellen wie **`vector_chunks`** (Qdrant-Spiegel) liegen ebenfalls hier, werden aber **nicht** über WatermelonDB synchronisiert (nur serverseitig / ragrun) |
| **WatermelonDB** | Lokale SQLite-Datenbank + Sync-Layer gegen Supabase (MIT-Lizenz); Sync via 2 Postgres-Funktionen (push/pull RPC); kein eigener Server nötig |
| **expo-sqlite** | Lokale Datenbank auf dem Gerät (Offline-Zugriff) |

---

## 3. Navigation: 5 Tabs (horizontal wischbar)

```
[ Suche ] [ Übersicht ] [ Lesen ] [ Notizen ] [ KI-Chat* ]
                                                  * Anmeldung + Guthaben
```

Implementierung: `expo-router` mit Tab-Layout + horizontales Wischen via `react-native-pager-view` oder `@react-navigation/material-top-tabs`.

---

## 4. Tab-Spezifikationen

### Tab 1: Suche

**Zweck:** Semantische Hybrid-Suche (sparse + dense via Qdrant) über den gesamten Textkorpus via ragrun.

**Offline-Verhalten:**
- Semantische Suche erfordert Internet-Verbindung (ragrun + Qdrant).
- Ohne Verbindung: Suchfeld ausgegraut mit klar sichtbarem Hinweis ("Suche erfordert Internet-Verbindung").
- **Kein** SQLite-FTS-Fallback — Hybrid-Suche ist die einzige Suchmethode.

**UI:**
- Suchfeld (oben, immer sichtbar)
- Online/Offline-Indikator neben dem Suchfeld
- Filter-Chips: Bücher / Vorträge / Gespräche / Zitate / Zusammenfassungen
- Ergebnisliste: Snippet mit Hervorhebung des Treffers, Quellenangabe
- Tap auf Ergebnis → öffnet Tab 3 (Lesen) auf dem betreffenden Absatz

**Endpunkte (ragrun, alle mit `/app/`-Prefix):**
- `POST /app/search` — Hybrid-Suche (sparse + dense), Body: `{query, types[], limit, collection}`

---

### Tab 2: Übersicht

**Zweck:** Hierarchische Navigation durch den Textkorpus.

**Hierarchie (3 Ebenen, rekursive TreeView-Komponente):**
```
Ebene 1: Bücher / Zyklen / GA-Bände / Einzelvorträge
  └── Ebene 2: Kapitel (Bücher) / Einzelvorträge (in Zyklen/GA-Bänden)
        └── Ebene 3: Zusammenfassungen (wenn vorhanden)
```

Beispiele:
```
Die Philosophie der Freiheit                 ← Buch, Ebene 1
  └── I. Das bewusste menschliche Handeln    ← Kapitel, Ebene 2
  └── II. Der Grundtrieb der Wissenschaft    ← Kapitel, Ebene 2

Der menschliche und der kosmische Gedanke (GA 151)  ← Vortragsband, Ebene 1
  └── Vortrag 1, Berlin 1914                ← Einzelvortrag, Ebene 2
        └── Zusammenfassung                 ← Ebene 3
```

**UI:**
- Rekursive TreeView-Komponente mit Tap-to-Expand
- Lazy-Loading: Unterebenen erst beim Aufklappen laden
- Gespeicherter Aufklapp-Zustand (zuletzt geöffnete Stellen)
- Tap auf Kapitel/Vortrag → öffnet Tab 3 (Lesen) am Anfang oder letztem Lesezeichen

**Daten:** Vollständig offline aus expo-sqlite (Metadaten-Tabellen bei Sync aktualisiert).

---

### Tab 3: Lesen

**Zweck:** Textwiedergabe in hoher Lesequalität.

**Renderer:** Flash List + eigener Node-Renderer (kein Markdown-Parser).

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

**Trennung in ragrun (bleibt unverändert):**
- `chunk.text` (mit `<i>`, `<q>`) → `_strip_markup()` → Embedding (reiner Text) ✓
- `chunk.rendered_content` → App-Rendering (neue JSONB-Spalte)
- `ingestion_service.py` schreibt Embeddings nach **Qdrant** und den SQL-Spiegel **`vector_chunks`** (nicht nach `rag_chunks`); `ingestion_service.py` braucht **keine Änderung** für dieses Splitting

**Textaufbereitung (analog ragkeep statische Seiten):**
- Zitate: `quote`-Node → eingerückt mit Anführungszeichen-Stil
- Kursive Passagen: `italic`-Node → italic rendering
- Absatznummer am Anfang jedes Absatzes (aus `rag_paragraphs.paragraph_number`)
- Beitrags-Streifen **am Ende jedes Absatzes** (Emoji + Zahl als kleine Chips, rechtsbündig). Jeder Eintrag ist ein **Beitrag zu diesem Absatz**:
  - ✏️ Notizen — eigene Anmerkungen zu diesem Absatz
  - 💬 Gespräche — KI-Gespräche, die diesen Absatz im Kontext hatten
  - 🎯 RAG-Treffer — aus `rag_references` aggregiert: wie oft Chunks, die diesen Absatz enthalten, von anderen Chunks/Antworten/Konzepten referenziert werden (semantische Zentralität im Korpus)
- Schriftgröße einstellbar

**Lesezeichen:**
- pro Nutzer, pro Absatz (`paragraph_id` als Anker, siehe Abschnitt 6)
- Letzter gelesener Absatz automatisch gespeichert
- Manuelles Lesezeichen via Absatz-Kontextmenü (Long-Press)

**Absatz-Kontextmenü (Long-Press):**
- Lesezeichen setzen/entfernen
- Notiz zu diesem Absatz schreiben
- KI-Chat zu diesem Absatz starten (Anmeldung + Guthaben erforderlich)
- Absatz kopieren / teilen
- Beiträge anzeigen (öffnet `Lesen / Beiträge` für den aktuellen `paragraph_id`)

**Daten:** Texte aus expo-sqlite (via WatermelonDB aus Supabase synchronisiert). Lesezeichen lokal + Sync.

---

### Tab 4: Notizen

**Zweck:** Persönliche Annotationen zu Absätzen und Kapiteln.

**Auth:** Notizen erfordern Anmeldung. Ohne `currentUser` zeigt Tab 4 einen Anmelde-Hinweis; Lesen und Suche bleiben ohne Anmeldung verfügbar.

**UI:**
- **Edit-Box** oben: Neue Notiz zum aktuell gelesenen Absatz/Kapitel (Kontext aus Tab 3 wird übernommen)
- **Liste** darunter: Alle Notizen, gruppiert nach:
  - Absatz-Notizen (mit Sprung zu Textstelle via `paragraph_id`)
  - Kapitel-Notizen
  - Freie Notizen
- Notiz-Karte: Text, Datum, Quellenkontext, Edit/Delete
- **V2:** Bewertungen durch Freunde

**Schema (Supabase):**
```sql
app_notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users,
  paragraph_id text,          -- stabile Referenz (siehe Abschnitt 6)
  segment_id  text,           -- Kapitel-Referenz (nullable)
  source_id   text,           -- Quelldokument
  content     text NOT NULL,
  is_public   bool DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
)
```

---

### Tab 5: KI-Chat (Anmeldung + Guthaben)

**Zweck:** Gesprächsbasiertes Erkunden des Textes mit KI-Persönlichkeiten.

**Datenmodell:** Orientiert sich an den bestehenden ragrun-Tabellen `rag_talks` und `rag_turns`, die in **Supabase** (gemeinsam mit ragrun) für die App angelegt werden (siehe Abschnitt 7.2).

**Chunk-Referenzen:** Verweise auf Korpus-Chunks (z. B. in `chunk_index_map` / Kontext-Metadaten) zeigen auf **`rag_chunks.chunk_id`** — nicht auf `vector_chunks`. So bleiben Gespräche nach Neu-Chunking lesbar; betroffene Zeilen können `deprecated_at` gesetzt haben (siehe Abschnitt 6.1a).

**rag_talks** (Gespräch-Kopf):
```
talk_id, collection, user_id, user_display_name, slug, title,
action_id, summary, usage, context_mode, context_ids, kontext_meta,
publishing_status, kontext_source_id, kontext_segment_id, kontext_paragraph
```

Hinweis zur Migration: In ragrun heißen die alten Talk-Felder noch `mensch_id` / `mensch_name`. Für ragapp in Supabase verwenden wir konsequent `user_id` / `user_display_name`; historische ragrun-Gespräche mit dem alten Feldschema werden nicht übernommen.

**rag_turns** (Einzelne Gesprächsrunden):
```
turn_id, talk_id, turn_index, action_id, assistant_personality,
user_message, assistant_message, usage, collection,
is_relay, chunk_index_map, kontext_meta
```

**Persönlichkeiten** (aus `/ragrun-personalities`):
Sokrates, Der Machtarchitekt, Der Kapitalverwalter, Der Technikvisionär,
Der Open-Source-Handwerker, Der Free-Software-Aktivist, Der Cypherpunk,
Die Menschheitsaktivistin, Assistant Host, Assistant Host Deep, Mit Kontext

**Kontext-Picker** (`{{chat.context_picker}}` / `{{chat.context_options}}`):
- Modi: "Frei", "Aktueller Absatz", "Aktuelles Segment"
- Speichert `context_mode` + `context_ids` in `rag_talks`
- `context_mode = "free"` — keine Kontext-IDs, Anzeige: "Allgemein"
- `context_mode = "paragraph"` — `context_ids.paragraph_id`, Anzeige: aktueller Absatz selektiert
- `context_mode = "segment"` — `context_ids.source_id` + `context_ids.segment_id`, Anzeige: aktuelles Segment selektiert
- Aufruf aus einer Notiz: `context_ids.note_id` wird zusätzlich gesetzt, Anzeige: Notiz selektiert; falls die Notiz an einen Absatz gebunden ist, wird `context_ids.paragraph_id` ebenfalls mitgegeben
- Alte ragrun-Felder (`kontext_source_id`, `kontext_segment_id`, `kontext_paragraph`, `kontext_meta`) bleiben als Migrations-/Kompatibilitätsschicht erhalten, bis der App-Endpunkt vollständig auf `context_mode` / `context_ids` umgestellt ist

**UI:**
- Persönlichkeits-Picker (horizontal scrollbar, Avatar + Slug)
- Kontext-Anzeige: "Gespräch bezieht sich auf: [Allgemein/Absatz/Segment/Notiz]"
- Chat-Verlauf (Blasen-Layout, Flash List)
- Aktionsmenü pro Gespräch:
  - Zusammenfassung generieren
  - Sichtbarkeit: **V1:** Privat / Link teilen — **V2:** + Freunde — **V3:** + Öffentlich

**Gespräche-Liste:**
- V1: Eigene Gespräche (chronologisch, nach Kontext filterbar)
- V2: Gespräche von Freunden (`publishing_status = 'friends'`)
- V3: Öffentliche Gespräche (`publishing_status = 'public'`) + Meldungsfunktion
- Später: Bewertungen

**Endpunkte (ragrun):**
- `POST /app/chat` — Nachricht + personality + kontext
- `POST /app/chat/{talk_id}/summarize` — Zusammenfassung generieren

---

## 5. Allgemeine Funktionalitäten

### 5.1 Konto

| Funktion | Umsetzung |
|---|---|
| Konto anlegen | Supabase Auth: Magic Link (E-Mail) |
| Apple Sign-In | Supabase OAuth: Apple (Pflicht für App Store) |
| Google Sign-In | Später: Supabase OAuth: Google |
| Name ändern | Supabase `app_profiles`-Tabelle |
| Guthaben aufladen | In-App Purchase via RevenueCat |
| Guthaben verwalten | RevenueCat Webhook → Supabase-Kontostand |
| Zahlung | Apple IAP / Google Play Billing via RevenueCat |
| Verbrauchsübersicht | KI-Anfragen + Token-Verbrauch via `rag_usage` |
| Nutzungsstatistik | Gelesene Seiten, Notizen, Gespräche |
| Konto löschen | Pflicht (App Store + Play Store): löscht `auth.user` + alle Daten (Cascade) |
| Datenexport | JSON-Export aller Nutzerdaten (DSGVO Auskunftsrecht) |

**Datenbindings Konto (`Konto / Default`):**
- Profil im UI: `{{user.current}}` mit `{{user.display_name}}`, `{{user.email}}`, `{{user.avatar_initials}}` bzw. später `{{user.avatar_url}}`
- Datenquellen dafür: `auth.users` für Login/E-Mail, `app_profiles` für app-spezifische Profildaten wie Anzeigename und Avatar
- Guthabenkarte: `{{app_wallets.balance_cents}}` als `computed.balance_eur`; Aufladen via `{{action.purchase_credit}}` / RevenueCat
- Preisinfo: `{{llm_pricing.current}}`; Anzeige zeigt das aktuell serverseitig gültige Chat-Modell und Input-/Output-Preise
- Verbrauch: Chat-Kosten werden in `rag_usage` geschrieben und als Wallet-Transaktion vom Guthaben abgezogen
- Statistiken: `{{computed.account_stats}}` aus `rag_talks`, `app_notes`, Leseereignissen und `app_friendships`
- Mehr-Bereich: Käufe & Guthaben (`{{wallet.transactions}}`, `{{action.restore_purchases}}`), Daten & Datenschutz (`{{action.export_user_data}}`, `{{action.delete_account}}`, `{{privacy.consents}}`) und Sync-Status (`{{sync.status}}`, `{{sync.last_synced_at}}`)

**Wallet / Guthaben:**
```
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
  provider                 text, -- 'revenuecat' | 'internal'
  provider_transaction_id  text,
  usage_id                 uuid, -- gesetzt bei Abbuchung für rag_usage
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

Funktionen: Einladung via Deep-Link, Push-Notification bei Anfragen, Freundesliste, Sichtbarkeitseinstellung im Profil.

**V1 Sharing:** Nur "Link teilen" — ein signierten, ablaufenden Deep-Link auf ein Gespräch oder eine Notiz. Kein öffentlicher Feed, keine Moderation nötig.

---

## 6. Absatzdaten & Verknüpfungstabelle

### 6.1 `rag_paragraphs` als fachliche Quelltext-Tabelle

Noch vor der Supabase-Umsetzung wird das Ziel-Schema für Absätze definiert. `rag_paragraphs` ist die fachliche Grundlage für Lesen, Notizen, Figma-Datenbindungen und spätere Sync-Tabellen.

**Ziel:**
- Quelltexte auf Absatzebene speichern, nicht nur als RAG-Chunks.
- Absatz-IDs stabil halten, damit Notizen, Lesezeichen, Gespräche und Figma-Designs auf dieselben Daten zeigen.
- Annotationen aus ragprep (`<i>`, `<q>`, interne Verweise, Absatzmarker) strukturiert speichern.

```sql
-- Ziel-Schema für Supabase; in Phase 0 fachlich definieren, in Phase 3 deployen
rag_paragraphs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paragraph_id      text NOT NULL UNIQUE, -- '{source_id}:{segment_index}:{paragraph_number}'

  source_id         text NOT NULL,
  book_id           text,
  language          text,

  segment_type      text NOT NULL, -- 'chapter' | 'lecture' | 'preface' | 'appendix' | ...
  segment_index     int  NOT NULL,
  segment_title     text NOT NULL,
  paragraph_number  int  NOT NULL,

  text_raw          text NOT NULL,
  annotations       jsonb, -- foreign_quotes, italics, page_refs, anchors

  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),

  UNIQUE (source_id, segment_index, paragraph_number)
)
CREATE INDEX ON rag_paragraphs (source_id);
CREATE INDEX ON rag_paragraphs (book_id, segment_index, paragraph_number);
CREATE INDEX ON rag_paragraphs USING GIN (annotations);
```

**Annotationen in `annotations`:**
```json
{
  "foreign_quotes": [
    { "start": 42, "end": 89, "quoted_author": "Johann Wolfgang von Goethe", "quoted_work": "Faust", "part": 1 }
  ],
  "italics": [
    { "start": 12, "end": 18 }
  ],
  "page_refs": [
    { "start": 100, "end": 108, "anchor_id": "p-segment-23", "target_paragraph_id": "source:0:23" }
  ]
}
```

**Entscheidung:** `text_raw` ist die interne kanonische Textquelle für sauberes Kopieren, Teilen, Debugging und spätere AST-Erzeugung; `annotations` ist die strukturierte Quelle für Rendering. User sehen nicht `text_raw`, sondern gerenderten Text aus Absatzmarker (`paragraph_number`) + `text_raw` + `annotations`. Die semantische/hybride Suche läuft über ragrun/**Qdrant**; der relationale Spiegel der Qdrant-Payloads ist **`vector_chunks`** (in Supabase mitgeführt, siehe Abschnitt 7). Suchtreffer zeigen den Trefferkontext aus dem eingespielten Chunk-Text (wie in Qdrant/`vector_chunks`); Navigation zur Lesestelle läuft über **`app_paragraph_chunk`** auf stabile `paragraph_id`s. **Verweise in Gesprächen, Begriffen und Zitaten** zeigen immer auf **`rag_chunks`** (`chunk_id`): dort bleiben alle Chunk-Versionen erhalten (siehe unten), damit Links nicht brechen. Eine zusätzliche Spalte `text_annotated` wird nur ergänzt, wenn sich später zeigt, dass vorgerendertes HTML/Markup für Performance nötig ist.

### 6.1a `rag_chunks` vs. `vector_chunks` (Supabase)

| Tabelle | Rolle |
|---|---|
| **`rag_chunks`** | Kanonischer **Chunk-Archiv** in Postgres: jede Version eines Chunks bleibt als Zeile erhalten. Bei Neu-Chunking werden alte Zeilen nicht gelöscht, sondern mit **`deprecated_at`** markiert; neue Zeilen erhalten neue `chunk_id`s. So bleiben **Referenzen aus `rag_talks` / `rag_turns`, Begriffen, Quotes und `rag_references`** gültig — sie verweisen immer auf `rag_chunks`. |
| **`vector_chunks`** | **SQL-Spiegel** der aktuell in **Qdrant** indexierten Payloads (nur die für die Suche relevante „lebende“ Menge). Wird von ragrun-`IngestionService` zusammen mit Qdrant aktualisiert; dient Admin-, Zähl- und SQL-Hilfsabfragen parallel zur Vektorsuche. |

**Ablauf:** ragprep schreibt/aktualisiert **`rag_chunks`** (und Deprecation) in Supabase; Embedding läuft über ragrun (`/rag/embed-chunks` o.ä.) und füllt **Qdrant + `vector_chunks`**. Die App synct **`rag_chunks`** (inkl. deprecated) für Offline-Lesen und stabile IDs; **`vector_chunks`** bleibt serverseitig (kein WatermelonDB-Pull nötig).

**Abgrenzung: Primärtext vs. extrahierte Chunk-Typen (`rag_chunks`):**
- `rag_paragraphs.annotations.foreign_quotes` beschreibt `<q>`-Stellen im Primärtext, an denen der Quellautor einen Fremdautor zitiert.
- `rag_chunks` mit `chunk_type = 'quote'` enthält dagegen ausgewählte, zitierfähige Aussagen des Quellautors selbst.
- Andere bewusst ein-Chunk-lange Inhalte wie `chapter_summary`, `begriff` und `typology` bleiben ebenfalls in `rag_chunks` und werden in der App als Content-Objekte geladen.

### 6.2 Verknüpfungstabelle: paragraph_id ↔ rag_chunk

### Problem
- Notizen und Gespräche referenzieren Absätze über einen `paragraph_id`.
- Rag-Chunks haben eine `chunk_id` (UUID), können aber mehrere Absätze enthalten.
- Umgekehrt kann ein sehr langer Absatz über mehrere Chunks verteilt sein (z.B. lange philosophiegeschichtliche Absätze).
- Bei Neu-Chunking entstehen **neue** `chunk_id`s für die aktuelle Indexierung; **alte** `chunk_id`s bleiben in **`rag_chunks`** mit gesetztem **`deprecated_at`** erhalten, damit Verweise (Talks, Begriffe, Quotes, `rag_references`) nicht brechen. Für die Lesen-Navigation von der aktuellen Suche zum Text braucht es zusätzlich stabile **`paragraph_id`**s und ein aktuelles Mapping.

### Lösung
Stabiler `paragraph_id` = identisch mit `rag_paragraphs.paragraph_id`; `app_paragraph_chunk` ist eine echte Many-to-Many-Tabelle zwischen Absätzen und **aktuellen** RAG-Chunks (die in Qdrant/`vector_chunks` stehen). Verweise auf historische Chunk-Inhalte bleiben über **`rag_chunks.chunk_id`** (auch `deprecated_at IS NOT NULL`) auflösbar.

```sql
-- Ziel-Schema für Supabase, wird später von ragprep gepflegt
app_paragraph_chunk (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  paragraph_id      text NOT NULL REFERENCES rag_paragraphs(paragraph_id),
  collection        text NOT NULL,
  chunk_id          text NOT NULL,     -- aktueller chunk_id (lebend in Qdrant/vector_chunks; Zeile auch in rag_chunks)
  source_id         text NOT NULL,

  chunk_index       int  NOT NULL,     -- Reihenfolge des Chunks innerhalb der Quelle
  paragraph_order   int  NOT NULL,     -- Reihenfolge dieses Absatzes innerhalb des Chunks

  -- gesetzt, wenn ein langer Absatz in mehrere Chunk-Seiten / Satzbereiche zerlegt wird
  paragraph_page    int,
  sentence_start    int,
  sentence_end      int,

  deprecated_at     timestamptz,       -- gesetzt wenn Mapping durch Neu-Chunking ersetzt wird
  created_at        timestamptz DEFAULT now()
)
CREATE INDEX ON app_paragraph_chunk (source_id);
CREATE INDEX ON app_paragraph_chunk (paragraph_id);
CREATE INDEX ON app_paragraph_chunk (chunk_id);
CREATE INDEX ON app_paragraph_chunk (collection, source_id);
CREATE UNIQUE INDEX app_paragraph_chunk_unique_range
  ON app_paragraph_chunk (
    paragraph_id,
    chunk_id,
    COALESCE(paragraph_page, 0),
    COALESCE(sentence_start, 0),
    COALESCE(sentence_end, 0)
  );
```

### Abhängigkeit von ragprep
**Diese Tabelle muss später bei jedem ragprep-Chunking aktualisiert werden:**
- Ein Chunk mit mehreren Absätzen → mehrere Rows mit gleichem `chunk_id`, unterschiedlichem `paragraph_id`.
- Ein langer Absatz über mehrere Chunks → mehrere Rows mit gleichem `paragraph_id`, unterschiedlichem `chunk_id` und gesetzten `paragraph_page` / `sentence_start` / `sentence_end`.
- Gelöschte/geänderte Chunk-Zuordnungen → `deprecated_at` setzen (NICHT löschen, da Notizen und Gespräche weiterhin auf `paragraph_id` zeigen).
- ragprep-Skript muss einen Sync-Schritt nach Supabase enthalten.

### Validierung nach dem Chunking

Am Ende jedes ragprep-Chunking-Laufs folgt ein Validierungsdurchgang für `app_paragraph_chunk`. Grundlage sind die erzeugten Chunks und die Chunk-Boundary-Daten (`paragraph_numbers`, `paragraph_page`, `sentence_ranges`, `chunk_index`).

Der Validator prüft:
- Jeder Absatz aus `rag_paragraphs` für die Quelle ist mindestens einem aktiven Chunk zugeordnet.
- Jeder aktive Chunk mit Primärtext hat mindestens eine Mapping-Row.
- Multi-Absatz-Chunks erzeugen mehrere Rows mit gleichem `chunk_id` und korrektem `paragraph_order`.
- Lange Absätze über mehrere Chunks erzeugen mehrere Rows mit gleichem `paragraph_id` und passenden `paragraph_page` / Satzbereichen.
- Mapping-Rows verweisen nur auf existierende `paragraph_id`s und aktuelle `chunk_id`s.
- Alte Zuordnungen, die im neuen Chunking nicht mehr vorkommen, werden auf `deprecated_at` gesetzt.

Bei Fehlern bricht der Supabase-Sync ab; ragprep gibt einen Report aus, welche Paragraphen oder Chunks nicht stimmig gemappt wurden.

In der App: Beim Anzeigen einer Notiz mit `deprecated_at != null` → Hinweis "Textstelle möglicherweise verändert".

---

## 7. Datenschicht & Sync-Strategie

### 7.1 Was liegt wo

| Daten | Supabase DB | expo-sqlite (WatermelonDB) | Sync via Supabase RPC |
|---|---|---|---|
| Texte (Absätze via `rag_paragraphs`) | Ja | Ja | Ja (initial + Updates) |
| RAG-Chunks (`rag_chunks`, Archiv inkl. `deprecated_at`) | Ja | Ja | Ja (initial + Updates) |
| Qdrant-Spiegel (`vector_chunks`, nur aktuell indexiert) | Ja | Nein | Nein (nur ragrun/serverseitig) |
| RAG-Referenzen (`rag_references`) | Ja | Ja | Ja (read-only) |
| Paragraph-Chunk-Mapping | Ja | Ja | Ja (read-only) |
| Notizen (app_notes) | Ja | Ja | Ja (bidirektional) |
| Gespräche (rag_talks, rag_turns) | Ja | Ja | Ja (bidirektional) |
| Lesezeichen | Ja | Ja | Ja (bidirektional) |
| Nutzerprofil / Freundschaften | Ja | Nein | Nein (immer online) |
| KI-Anfragen (live) | Log in rag_usage | Nein | Nein |
| LLM-Preise (`llm_pricing`) | Ja | Nein | Nein (serverseitig) |

### 7.2 Datenmigration: Textkorpus → Supabase (gemeinsam ragapp + ragrun)

**Ausgangslage:**
- **Supabase Postgres** ist die gemeinsame Datenbank für **ragapp** und **ragrun**. ragrun verbindet sich mit derselben Instanz (Einspielung, Embedding, `vector_chunks` u.ä.); die App synchronisiert darüber nur den in Abschnitt 7.3 definierten Tabellen-Scope — Tabellen, die **ausschließlich ragrun** nutzt (z. B. **`vector_chunks`**), **nicht** über WatermelonDB.
- **Kanonische Quelltexte** liegen in **`rag_paragraphs`** (Supabase): absatzweise `text_raw` und `annotations` (siehe Abschnitt 6). Als **Eingabe** für ragprep dienen weiterhin `.md`-Dateien unter `ragrun/ragkeep/books/` und `ragrun/ragkeep/lectures/` sowie die phase5-Artefakte; ragprep importiert nach `rag_paragraphs` und erzeugt daraus u. a. **`rag_chunks`** (JSONL/Archiv) für RAG und Embedding.

**Was in Supabase liegt (Auszug):**

| Daten | Herkunft | Migration |
|---|---|---|
| `rag_chunks` (Textkorpus, Archiv) | ggf. Legacy-Postgres (ragrun) bis Cutover | Einmalig kopieren, falls noch vorhanden; künftig ragprep direkt in Supabase (inkl. `deprecated_at` bei Neu-Chunking) |
| `vector_chunks` (Qdrant-SQL-Spiegel) | ggf. Legacy-Postgres (ragrun) bis Cutover | Einmalig kopieren, falls noch vorhanden; künftig ragrun-`IngestionService` schreibt in Supabase-`vector_chunks` parallel zu Qdrant |
| `rag_references` | ggf. Legacy-Postgres / ragprep-Augmentierung | Einmalig kopieren, falls noch vorhanden; künftig von Chat/RAG-Prozessen in Supabase geschrieben |
| `rag_paragraphs` | phase5-Markdown aus `ragrun/ragkeep/*/results/phase5/` | ragprep-Import parst Absätze, `text_raw` und `annotations` |
| `app_paragraph_chunk` | neu | ragprep befüllt beim Chunking als Many-to-Many-Mapping inkl. `paragraph_page` / Satzbereichen |
| `rag_talks` / `rag_turns` | **nur App-Gespräche** — nicht historische ragrun-Gespräche | Neue leere Tabellen |
| `rag_usage` | neu für ragapp | Neue leere Tabelle; Chat/API-Nutzung schreibt hier hinein |
| `llm_pricing` | ggf. Legacy-Postgres / Konfiguration | Einmalig kopieren, falls noch vorhanden; serverseitige Preisberechnung für `rag_usage` |
| `app_wallets`, `app_wallet_transactions` | neu für ragapp | Neue leere Tabellen; RevenueCat-Aufladungen und Chat-Abbuchungen |
| `app_notes`, Lesezeichen, Freundschaften | neu | Neue leere Tabellen |
| Auth (`auth.users`) | neu | Supabase Auth |

**Migrationsschritte:**

1. **Supabase-Projekt anlegen** (Region: eu-central-1 Frankfurt).
2. **Schema deployen:** Alle Tabellen via Supabase Migrations anlegen.
3. **`rag_chunks` / `vector_chunks` / `rag_references` / `llm_pricing` einmalig kopieren (falls Legacy):** `pg_dump` aus bisheriger ragrun-Postgres → `psql` in Supabase. Keine alten `rag_talks` / `rag_turns` aus ragrun übernehmen.
4. **`rag_paragraphs` importieren:** Einmalig aus phase5-Markdown; `N|`-Absätze, `<i>`, `<q>`, `<a>` und `<span id>` in `text_raw` + `annotations` überführen.
5. **`app_paragraph_chunk` befüllen:** Einmalig aus den vorhandenen JSONL-Dateien (`ragkeep/*/results/rag-chunks/book-chunks.jsonl`) per Migrations-Skript befüllen; dabei Multi-Absatz-Chunks und lange Absätze über mehrere Chunks abbilden.
6. **Mapping validieren:** Am Ende des Imports/Chunkings prüfen, ob `app_paragraph_chunk` anhand der erzeugten Chunks und Boundary-Daten vollständig und widerspruchsfrei ist.
7. **ragprep auf Supabase umstellen:** ragprep schreibt künftig direkt in Supabase-Postgres (Connection String in ragprep-Config): **`rag_chunks`** (neue Versionen + `deprecated_at` für obsolet), `rag_paragraphs`, `app_paragraph_chunk`. **ragrun** liest **`rag_chunks`** für Embed-Läufe aus **derselben** Supabase-DB und schreibt **Qdrant + `vector_chunks`** dorthin (kein zweites Postgres für den Korpus nach Cutover).
8. **ragapp-Chat/RAG-Prozesse auf Supabase schreiben lassen:** neue App-Gespräche schreiben `rag_talks`, `rag_turns`, `rag_references` und `rag_usage` in Supabase; Preisberechnung nutzt `llm_pricing`.
9. **ragprep: AST-Parse-Schritt hinzufügen:** Nach dem Chunking parst ragprep `chunk.text` → AST-Nodes und schreibt das Ergebnis in `rag_chunks.rendered_content` (JSONB). Erkennt: Paragraph-Prefix (`"1| "`), `<i>`-Tags, `<q>`-Tags, Blockzitat-Muster, Überschriften. `ingestion_service.py` bleibt **unverändert** — Embedding läuft weiterhin über `_strip_markup(chunk.text)`.
10. **Supabase-Migration:** `ALTER TABLE rag_chunks ADD COLUMN rendered_content jsonb` — neue Spalte, bestehende Rows werden bei nächstem ragprep-Lauf befüllt.
11. **Qdrant unverändert betrieben; Spiegel in Supabase:** Nur ragrun greift auf Qdrant zu. **`vector_chunks`** in Supabase bleibt mit Qdrant konsistent (gemeinsamer Schreibpfad via `IngestionService`). ragapp ruft ragrun an, nicht Qdrant direkt.

### 7.3 WatermelonDB Sync-Konfiguration

WatermelonDB synchronisiert über zwei Supabase-RPC-Funktionen:
- `pull_changes(last_pulled_at, user_id, schema_version, client_version)` — liefert alle Änderungen seit letztem Sync
- `push_changes(changes, last_pulled_at, user_id, schema_version, client_version)` — schreibt lokale Änderungen nach Supabase

`schema_version`: WatermelonDB-Schemaversion (Integer, erhöht bei jeder Schema-Migration).
`client_version`: App-Version (z.B. `"1.2.0"`).

Der Server kann damit:
- Inkompatible Clients ablehnen oder auf kompatible Antwortformate umschalten
- Migrations-Probleme frühzeitig erkennen (z.B. Client hat altes Schema, Server hat neues)
- Logging und Debugging nach Version aufschlüsseln

**Sync-Scope pro Tabelle:**
- `rag_paragraphs`, `rag_chunks`, `rag_references`, `app_paragraph_chunk`: global read-only (nur pull, kein push)
- `vector_chunks` (und andere **nur ragrun** genutzte Tabellen): in Supabase gepflegt, aber **nicht** im WatermelonDB-Schema / kein Pull-Push — ragrun allein
- `app_notes`, `rag_talks`, `rag_turns`: gefiltert nach `user_id` (bidirektional)
- `app_friendships`: gefiltert nach `user_id` (bidirektional)
- `llm_pricing`, `rag_usage`: nicht in WatermelonDB; serverseitig bzw. online abrufbar

Die Postgres-Funktionen werden in Supabase als Database Functions deployed und via `supabase-js` aufgerufen.

---

## 8. Deployment-Übersicht

ragrun betreibt bereits ein Docker-Compose-Setup auf Railway mit gemeinsam genutzten Ressourcen (10 CPUs / 15 GB RAM). Alle Docker-Services — bestehende und neue — laufen in diesem einen Railway-Projekt. Railway berechnet nach tatsächlichem Ressourcenverbrauch, nicht pro Container.

**Aktuelles Railway-Compose (ragrun):**

| Container | Image | Status |
|---|---|---|
| `api` | ragrun-ragrun-api | läuft |
| `embeddings` | ragrun-embedding-service | läuft |
| `postgres` | postgres:15-alpine | **wird zu Supabase migriert, fällt weg** |
| `qdrant` | qdrant/qdrant:v1.11.0 | läuft |

**Erweiterung für ragapp:**

Kein neuer Container — WatermelonDB läuft komplett client-seitig und synct direkt gegen Supabase via RPC. Railway bleibt unverändert.

**Externe Services:**

| Dienst | Plattform | Kosten |
|---|---|---|
| **Supabase** | Supabase Cloud | $25/mo — Auth, Postgres, RLS; self-hosting zu aufwändig |
| **Railway** (alle Container) | Railway | nach Verbrauch — aktuell 0.71% CPU / 2.42 GB RAM |
| **ragapp** | App Store / Play Store | — |

---

## 10. ragrun Endpunkte (alle mit `/app/` Prefix)

| Methode | Pfad | Beschreibung |
|---|---|---|
| POST | `/app/search` | Hybrid-Suche (Qdrant sparse+dense) |
| GET  | `/app/sources` | Liste aller Quellen (für Tab 2 Übersicht) |
| GET  | `/app/sources/{source_id}/segments` | Kapitel/Segmente einer Quelle |
| GET  | `/app/segments/{segment_id}/paragraphs` | Absätze eines Kapitels |
| POST | `/app/chat` | Chat-Nachricht senden |
| POST | `/app/chat/{talk_id}/summarize` | Gesprächszusammenfassung |
| GET  | `/app/personalities` | Liste der verfügbaren Persönlichkeiten |
| GET  | `/app/health` | Health-Check + Online-Status für App |

---

## 11. Frage: Daten nach App-Deinstallation

**Antwort:** Alle nutzerspezifischen Daten (Notizen, Gespräche, Lesezeichen) liegen in Supabase. Nach Neuinstallation + Login synchronisiert WatermelonDB alles auf das neue Gerät.

**Einziges Risiko:** Offline-Änderungen, die beim Deinstallieren noch nicht zu Supabase hochgeladen waren, gehen verloren. Gegenmaßnahme: aktiven Sync-Flush beim App-Backgrounding auslösen.

---

## 12. Frage: DSGVO-Compliance & App-Store-Anforderungen

### DSGVO

| Anforderung | Umsetzung |
|---|---|
| Datenschutzerklärung | Extern gehostet, URL fest; in App, App Store, Play Store hinterlegen |
| Einwilligung | Bei Registrierung: Checkbox + Link |
| Konto löschen | In-App-Funktion: löscht `auth.user` + alle Daten (Cascade) — **Pflicht** |
| Datenexport | Endpoint: Export als JSON (Notizen, Gespräche, Lesezeichen) |
| Analytics | PostHog mit Opt-in (kein automatisches Tracking) |
| Datenverarbeitung EU | Supabase-Region: Frankfurt (eu-central-1) |
| DPA / AVV | Supabase, RevenueCat, Anthropic (API-Nutzung) |

### Apple App Store

| Anforderung | Details |
|---|---|
| Privacy Manifest | `PrivacyInfo.xcprivacy` — Pflicht seit iOS 17 |
| App Privacy Nutrition Label | Im App Store Connect ausfüllen |
| Sign in with Apple | Pflicht (weil anderen OAuth-Provider vorhanden) |
| In-App Purchase | Nur via StoreKit/RevenueCat, kein externer Payment-Link |
| Account Deletion | In-App — App Review-Pflicht seit 2022 |
| User-Generated-Content | V1: kein öffentlicher Feed → keine Moderation nötig; V3: Meldungsfunktion |
| Export-Deklaration | HTTPS/JWT: Standard-Exempt |

### Google Play Store

| Anforderung | Details |
|---|---|
| Data Safety Section | Im Play Console ausfüllen |
| In-App Billing | Google Play Billing via RevenueCat |
| Account Deletion | In-App + URL im Play Console |
| Target API Level | Immer auf aktuellem Android-Target halten |

---

## 13. Figma Professional → Code-Workflow

**Aktuelle Design-Datei:** [ragapp-Layout (Figma)](https://www.figma.com/design/T6s2FocVkibx6pUG9A4uvw/ragapp-Layout?node-id=1-3&p=f&t=WcjtFybfBfHGKSU1-0)

**Empfohlener Workflow:**

### Design Tokens (Farben, Typografie, Abstände)
1. In Figma: **Figma Variables** oder **Tokens Studio Plugin** (ehemals Figma Tokens) nutzen
2. Export via **Style Dictionary** oder direkt aus Tokens Studio als JSON
3. Im Expo-Projekt als `theme.ts` (z.B. via `@shopify/restyle` oder manuelles Theme-Objekt)
4. Bei Design-Änderungen: Token-Export erneut ausführen → `theme.ts` aktualisieren

### Komponenten-Übertragung
- Figma **Dev Mode** als Referenz (Maße, Abstände, Farben exakt ablesen)
- Komponenten manuell in React Native/Expo umsetzen (kein Auto-Converter zuverlässig genug)
- **Figma MCP Plugin** (Cursor/Claude Code Integration): ermöglicht es, Figma-Designs direkt als Kontext in Code-Assistenten zu laden

### Datenbindungen im Design

Mit dem verlinkten Layout können datenführende Layer in Figma annotiert werden (parallel zum Festlegen bzw. Feinschliff des Ziel-Schemas für `rag_paragraphs`). So ist beim Implementieren klar, welche UI-Stelle welches Feld aus welcher Tabelle braucht. **Operative Checklisten pro Tab:** §13.1.

**Layer-Namen für einfache Bindings:**
```
{{computed.paragraph_rendered}}
{{search_result.snippet}}
{{rag_chunks.text}}
{{rag_paragraphs.annotations.foreign_quotes}}
{{rag_paragraphs.segment_title}}
{{rag_paragraphs.paragraph_number}}
{{app_notes.count_for_paragraph}}
```

**Dev-Mode-Annotationen für komplexe Fälle:**
```
Datenquelle: rag_paragraphs
Felder: text_raw, annotations
Filter: source_id = currentSource AND segment_index = currentSegment
Anzeige: computed.paragraph_rendered
Absatzmarker: rag_paragraphs.paragraph_number

Tab 1 — Live-Suche (Hybrid über ragrun/Qdrant):
Anzeige Snippet: Text aus der Suchantwort (Payload aus Qdrant, inhaltlich identisch zur aktuellen Zeile in vector_chunks / dem aktuellen rag_chunks zum selben chunk_id).
Datenbindung im Code: meist `searchResult.snippet` o.ä., nicht direkt eine Supabase-Tabelle.

Tab 1 — optional / Referenz-Kontext (z. B. alter Chat, chunk_id aus Verweis):
Datenquelle: rag_chunks
Filter: chunk_id = referenzierter chunk_id (Zeile kann deprecated_at haben)
Anzeige: rag_chunks.text (historischer Trefferkontext bleibt lesbar)

Hinweis: rag_chunks.text ist annotierter Chunk-Kontext; text_raw in rag_paragraphs bleibt die kanonische Absatzquelle für Tab 3.
```

Das Figma MCP liest Layer-Namen und Dev-Mode-Annotationen beim Implementieren mit aus. Dadurch kann der Code-Assistent die passenden Repository-Methoden und späteren Supabase/WatermelonDB-Felder direkt zuordnen.

### Änderungs-Workflow
1. Design-Änderung in Figma
2. Tokens-Export aktualisieren → `theme.ts` anpassen (automatisch via CI möglich)
3. Datenbinding-Annotationen prüfen (`{{table.field}}` oder Dev-Mode-Annotation)
4. Betroffene Komponenten manuell anpassen (Dev Mode als Referenz)

### Empfohlene Figma-Plugins
- **Tokens Studio** — Design Token Management
- **Anima** — React-Komponenten-Export (eingeschränkt, als Referenz nützlich)
- **Figma MCP** — AI-Code-Assistent-Integration

### 13.1 Feinschliff — Checklisten pro Tab (Schema ↔ Figma)

Ziel: Jede sichtbare Text- oder Zahl-Information im Layout hat eine **klare Datenquelle** (`rag_paragraphs`, `rag_chunks`, `app_notes`, API-Antwort, berechnet). Abhaken in Figma (Layer-Namen / Dev-Mode) und ggf. im Plan (Schema-Lücke dokumentieren).

**Gemeinsam (alle Tabs)**
- [ ] Navigations-Leiste / Tab-Labels: rein UI oder aus `theme.ts` (keine DB)
- [ ] Globale Zustände (offline, kein Login): nur UI-Copy oder Bindings an `computed.*` / leere States explizit annotieren

**Tab 1 — Suche**
- [ ] Suchfeld: kein Tabellenfeld; ggf. `{{search.query}}` als transienter UI-State
- [ ] Online/Offline-Indikator: `{{computed.network_status}}` o.ä. (kein DB-Feld)
- [ ] Filter-Chips: Mapping zu `POST /app/search`-Param `types[]` in Dev-Mode festhalten
- [ ] Ergebniszeile — **Snippet / Hervorhebung / Quellenzeile:** Antwort aus ragrun (Payload Qdrant / Snippet-String); Binding `{{search_result.snippet}}`, `{{search_result.source_label}}` …; **nicht** `rag_paragraphs.text_raw` für den Snippet-Text
- [ ] Tap → Tab 3: Navigationsziel = `paragraph_id` (über `app_paragraph_chunk` / Suchantwort-Metadaten); in Figma Notiz: „Sprungziel = `paragraph_id`“

**Tab 2 — Übersicht (TreeView)**
- [ ] Ebene 1 (Buch / Band / Vortrag): Felder klären — typ. `source_id`, Anzeigename (fest in Quellen-Tabelle, aus `rag_paragraphs` aggregiert `segment_title`+`book_id`, oder API `/app/sources`); pro Zeile `{{source.display_name}}` + Filter `source_id`
- [ ] Ebene 2 (Kapitel / Einzelvortrag): `rag_paragraphs.segment_title` + `segment_index` + `segment_type` (einheitliche Zeile pro Segment, z. B. distinct `(source_id, segment_index)`)
- [ ] Ebene 3 (Zusammenfassung): aus `rag_chunks` mit `chunk_type = chapter_summary` (o.ä.) oder eigenes Metadaten-Feld — explizit annotieren, **nicht** mit Absatztext verwechseln
- [ ] Lazy-Expand: notieren, ob Unterknoten aus lokalem SQLite (WatermelonDB) oder optional `/app/sources/.../segments` kommen (Plan: primär offline)

**Tab 3 — Lesen**
- [ ] **Absatznummer:** `{{rag_paragraphs.paragraph_number}}`
- [ ] **Fließtext / Zitat / Kursiv:** `{{computed.paragraph_rendered}}` aus `text_raw` + `annotations` **oder** (falls Chunk-AST genutzt) Join über `app_paragraph_chunk` → `rag_chunks.rendered_content` — **eine** Variante im Design festlegen und im Dev-Mode beschreiben (Plan: kanonisch Absatz = `rag_paragraphs`; AST in `rag_chunks` für Rendering-Performance)
- [ ] **Überschrift im Lesestrom:** falls `heading`-Nodes aus `rendered_content`: Binding dokumentieren; falls aus Segment: `rag_paragraphs.segment_title` nur am Segmentanfang
- [ ] **Beitrags-Streifen** (✏️ 💬 🎯): `{{app_notes.count_for_paragraph}}`, Anzahl Gespräche mit Kontext dieses `paragraph_id`, Aggregation `rag_references` — pro Chip Feld oder `computed.*` benennen
- [ ] **Lesezeichen-Icon:** lokaler State / Lesezeichen-Tabelle (`paragraph_id`)
- [ ] **Long-Press-Menü:** Aktionen ohne extra DB-Felder; Kontext = aktuelles `paragraph_id`

**Tab 4 — Notizen**
- [ ] **Edit-Box:** `{{app_notes.draft}}` (transient) + Kontext `paragraph_id` / `segment_id` aus Tab 3
- [ ] **Listen-Gruppen:** Filter in Dev-Mode (`paragraph_id IS NOT NULL` usw.)
- [ ] **Notiz-Karte:** `{{app_notes.content}}`, `{{app_notes.created_at}}`, Anzeige Sprungziel: Snippet aus `rag_paragraphs` per `paragraph_id` oder `{{rag_paragraphs.segment_title}}`

**Tab 5 — KI-Chat**
- [ ] **Persönlichkeiten:** `GET /app/personalities` oder statische Liste im UI — annotieren
- [ ] **Kontext-Zeile:** `{{rag_talks.context_mode}}` / `context_ids` → lesbare Labels („Allgemein“, Absatzpreview aus `rag_paragraphs`, …)
- [ ] **Chat-Blasen:** `{{rag_turns.user_message}}`, `{{rag_turns.assistant_message}}`; Chunk-Referenzen in UI = `rag_chunks.chunk_id` (nicht `vector_chunks`)

**Tokens (übergreifend)**
- [ ] Farben, Typo, Spacing als Variables; Export-Pfad zu `theme.ts` im Plan/Repo-README einmal festhalten

---

## 14. Phasenplan

Priorität: **Lesen → Annotationen → Sync → Suche → Chat → Social**

Jede Phase liefert etwas Lauffähiges. Kein Backend nötig bis Phase 3.

---

### Phase 0 — Fundament

- [ ] Expo-Projekt initialisieren (`expo-router`, TypeScript, `react-native-pager-view`)
- [ ] Tab-Navigation (5 Tabs, horizontal wischbar)
- [ ] WatermelonDB + expo-sqlite einrichten, Schema-Grundgerüst anlegen
- [ ] Repository-Layer aufsetzen (Abstraktionsschicht über WatermelonDB)
- [ ] `rag_paragraphs` als Ziel-Schema definieren (`text_raw`, `annotations`, stabile `paragraph_id`) und mit dem Figma-Layout **ragapp-Layout** (Link §13) sowie **§13.1** (Tab-Checklisten) abgleichen
- [ ] Figma **ragapp-Layout** (§13): datenführende Layer mit `{{table.field}}` oder Dev-Mode-Annotationen versehen — **§13.1** pro Tab abarbeiten
- [ ] Figma: Variables + Tokens Studio exportieren → `theme.ts`
- [ ] Ein Testbuch als lokales JSON einbetten (kein Backend nötig)

**Exit-Kriterium:** App startet, Tabs wischbar, Testdaten lokal lesbar.

---

### Phase 1 — Lesen

Nur lokale Daten. Kein Supabase, kein Sync.

- [ ] Node-Renderer (eigener Renderer für `rendered_content` AST-Nodes)
- [ ] Tab 2: Übersicht — rekursive TreeView (3 Ebenen: Quelle → Kapitel → Zusammenfassung)
- [ ] Tab 3: Lesen — Flash List + Node-Renderer, Absatznummern, Absatz-Badges
- [ ] Long-Press-Menü auf Absatz (Kontextmenü-Overlay)
- [ ] Lesezeichen lokal (WatermelonDB, kein Sync)
- [ ] Letzter gelesener Absatz automatisch merken

**Exit-Kriterium:** Ein Buch vollständig lesbar, Lesezeichen setzen funktioniert.

---

### Phase 2 — Annotationen

Weiterhin lokal. Datenmodell stabilisiert sich hier.

- [ ] Tab 4: Notizen — Edit-Box + Liste, gruppiert nach Absatz / Kapitel / frei
- [ ] `paragraph_id`-Referenzen (`{source_id}:{segment_index}:{paragraph_number}`) durchgehend einsetzen
- [ ] Kontext-Übergabe: Long-Press → Notiz vorausgefüllt mit Absatz-Kontext
- [ ] Notiz-Badges am Absatz (Tab 3) zeigen vorhandene Notizen an

**Exit-Kriterium:** Notizen zu Absätzen schreiben, lesen, löschen — vollständig lokal.

---

### Phase 3 — Sync & Auth

Erst hier kommt Supabase ins Spiel. Das Datenmodell ist jetzt stabil.

- [ ] Supabase-Projekt anlegen (Region: eu-central-1)
- [ ] Auth: Magic Link + Apple Sign-In
- [ ] Datenmigration: ggf. Legacy ragrun-Postgres + phase5-Dateien → Supabase (`rag_chunks`, `vector_chunks`, `rag_references`, `llm_pricing`, `rag_paragraphs`, etc.)
- [ ] ragprep auf Supabase umstellen + AST-Parse-Schritt (`rendered_content`) + `rag_paragraphs` + `app_paragraph_chunk`
- [ ] ragprep-Validator: `app_paragraph_chunk` gegen Chunks und Boundary-Daten prüfen
- [ ] Supabase-Migration: `rendered_content jsonb` zu `rag_chunks`
- [ ] Supabase-Schema: `vector_chunks` deployen; ragrun-DB-URL auf **Supabase Postgres** umstellen (Embed: lesen `rag_chunks`, schreiben `vector_chunks` + Qdrant); WatermelonDB-Sync wie in §7.3 — **ohne** ragrun-exklusive Tabellen (`vector_chunks` u.ä.)
- [ ] WatermelonDB Sync-Funktionen: `pull_changes` / `push_changes` mit `schema_version`, `client_version`
- [ ] Erstsync: Textkorpus auf Gerät
- [ ] Konto-Verwaltung: Profil, Konto-Löschung (App Store Pflicht), Datenexport

**Exit-Kriterium:** Login, Sync, Notizen auf zwei Geräten synchron.

---

### Phase 4 — Suche

Erfordert Online-Verbindung zu ragrun.

- [ ] Tab 1: Suche — `POST /app/search` (Qdrant Hybrid)
- [ ] Offline-Zustand: Suchfeld ausgegraut mit Hinweis
- [ ] Suchergebnis-Tap → öffnet Tab 3 auf dem betreffenden Absatz

**Exit-Kriterium:** Semantische Suche findet Absätze, navigiert korrekt dorthin.

---

### Phase 5 — Chat (Anmeldung + Guthaben)

- [ ] Tab 5: KI-Chat — Persönlichkeits-Picker, Kontext-Modi (Absatz / Kapitel / frei)
- [ ] `rag_talks` / `rag_turns` in Supabase anlegen und via WatermelonDB synchen
- [ ] RevenueCat + Apple IAP / Google Play Billing einrichten
- [ ] Guthaben-Gate (Tab 5 sendet nur bei ausreichendem Kontostand)
- [ ] Apple Small Business Program beantragen
- [ ] PostHog Opt-in Analytics
- [ ] Nutzungs-/Kostenlimit pro Nutzer (Kontostand darf nicht negativ werden)

**Exit-Kriterium:** Guthaben kaufbar, KI-Chat mit Persönlichkeit und Kontext funktioniert und wird gegen Guthaben abgerechnet.

---

### Phase 6 — Social V1

- [ ] Link teilen: signierter Deep-Link auf Gespräch oder Notiz (Supabase Edge Function)

**Exit-Kriterium:** Geteilter Link öffnet Inhalt für Empfänger (auch ohne Account: read-only).

---

### Phase 7 — Store-Readiness

- [ ] Privacy Manifest (`PrivacyInfo.xcprivacy`, iOS)
- [ ] Data Safety Section (Android Play Console)
- [ ] Datenschutzerklärung + Impressum (extern gehostet)
- [ ] Account-Deletion-Flow testen
- [ ] Figma Design Tokens → `theme.ts` finalisiert
- [ ] Beta-Tests (TestFlight + Play Internal Testing)
- [ ] App Store / Play Store Einreichung

---

### Später (V2 / V3)

- **V2:** Freunde-System (Anfragen, Freundesliste, Gespräche mit Freunden teilen)
- **V3:** Öffentlicher Feed + Meldungsfunktion + Bewertungen

---

## 15. Tech-Stack

```
expo (SDK 52+)
expo-router                  — Navigation (file-based)
react-native-pager-view      — Wischbare Tabs
@shopify/flash-list          — Performante Listen (Texte, Notizen, Gespräche)
@nozbe/watermelondb          — Lokale SQLite-DB + Sync-Layer (MIT)
expo-sqlite                  — Lokale DB
@supabase/supabase-js        — Auth + DB-Client
expo-secure-store            — JWT sicher speichern
react-native-reanimated      — Animationen
expo-notifications           — Push (Phase 2)
react-native-purchases       — RevenueCat IAP (Phase 3)
posthog-react-native         — Analytics mit Opt-in (Phase 3)
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
| Tokens pro Gesprächsrunde (Input) | ~2.000 (System-Prompt + Kontext + Verlauf) |
| Tokens pro Gesprächsrunde (Output) | ~500 |
| Kosten pro Runde | ~$0.014 |
| Runden pro Gespräch | ~10 |
| Kosten pro Gespräch | ~$0.14 |
| Gespräche pro aktivem Chat-User/Monat | ~10 |
| **API-Kosten pro aktivem Chat-User/Monat** | **~$1.40** |

**Empfehlung:** Guthaben vor jeder Chat-Anfrage prüfen und Kosten nach jeder Antwort über `rag_usage` abbuchen. Zusätzlich ein technisches Nutzungslimit einbauen, damit Fehler oder Missbrauch den Kontostand nicht ins Negative treiben. Verbrauchsübersicht ist ohnehin geplant (Tab Konto).

### 16.3 Store-Gebühren

**Apple Small Business Program + Google Play:** Dauerhaft **15%** bei Jahresumsatz < $1M (einmalige Bewerbung bei Apple nötig).

| Guthaben-Kauf | Store-Gebühr (15%) | Netto aus Store |
|---|---|---|
| €4,99 | −€0,75 | €4,24 |
| €9,99 | −€1,50 | €8,49 |

### 16.4 Deckungsbeitrags-Rechnung pro aktivem Chat-User

| Posten | €4,99/mo | €9,99/mo |
|---|---|---|
| Einnahme (netto nach Store 15%) | +€4,24 | +€8,49 |
| Anthropic API (~$1.40 ≈ €1.30) | −€1,30 | −€1,30 |
| Infrastruktur-Anteil ($60/mo ÷ 100 User) | −€0,56 | −€0,56 |
| **Deckungsbeitrag** | **~€2,38/User/mo** | **~€6,63/User/mo** |

**Bei €4,99 Guthaben/Monat:**
- Breakeven (Infrastruktur gedeckt): ~25 aktive zahlende Chat-User
- Bei 50 aktiven zahlenden Chat-Usern: ~€119/mo Deckungsbeitrag
- Bei 10 aktiven zahlenden Chat-Usern: ~€24/mo — Infrastruktur noch nicht gedeckt

**Bei €9,99 Guthaben/Monat:**
- Breakeven: ~9 aktive zahlende Chat-User
- Bei 50 aktiven zahlenden Chat-Usern: ~€330/mo Deckungsbeitrag

**Fazit:** Guthabenpakete erlauben nutzungsbasierte Abrechnung statt fixer Pro-Schranke. €4,99 funktioniert als niedrige Einstiegshürde, braucht aber mehr zahlende Nutzer für denselben Deckungsbeitrag. €9,99 ist effizienter sobald eine treue kleine Nutzerbasis da ist.

### 16.5 Guthabenpakete

Start mit einfachen Guthabenpaketen, z.B. **€5** und **€10**. Chat-Anfragen werden anhand `llm_pricing` und `rag_usage` gegen den Kontostand abgerechnet.

---

## 17. Entscheidungsprotokoll

| Thema | Entscheidung |
|---|---|
| Analytics | PostHog mit Opt-in |
| Textrenderer | Flash List + eigener Node-Renderer (AST aus ragprep, kein Markdown-Parser) |
| Sharing V1 | Nur Link teilen (signierter Deep-Link) — kein Feed, keine Moderation |
| Sharing V2 | Freunde-System |
| Sharing V3 | Öffentlicher Feed + Meldungsfunktion |
| Sprache | Nur Deutsch (V1) |
| Offline-Suche | Keine — ausgegraut mit Hinweis |
| Suchstrategie | Qdrant Hybrid (sparse + dense) via ragrun |
| Tab 2 Hierarchie | 3 Ebenen, rekursive TreeView |
| Sync-Engine | WatermelonDB (statt PowerSync) — reifer, MIT-Lizenz, kein eigener Server |
| Chunk-Speicher Supabase | `rag_chunks` = Archiv inkl. `deprecated_at` (Referenzen: Talks, Begriffe, Quotes, `rag_references`); `vector_chunks` = Qdrant-Spiegel, nur serverseitig |

---

## 18. Technische Risiken

### 18.1 Sync-Strategie — WatermelonDB

WatermelonDB wurde bewusst als risikoärmere Alternative zu PowerSync gewählt:
- Seit 2018, MIT-Lizenz, große Community
- Produktionserprobt bei Consumer-Apps (Nozbe u.a.)
- Kein eigener Server — synct direkt gegen Supabase via RPC
- Offizieller Supabase-Integrationsleitfaden vorhanden

**Verbleibende Sync-Risiken (gering):**
- iOS-App-Lifecycle bei Hintergrundsync (standard RN-Problem, gut dokumentiert)
- Schema-Migrationen erfordern WatermelonDB-Migrationsskripte

**Repository-Layer (ab Phase 0 einbauen):**

Komponenten sprechen nie direkt mit WatermelonDB, sondern nur mit einem abstrakten Repository-Layer:

```
[ Tab-Komponenten ]
       ↓
[ Repository (z.B. NoteRepository, ParagraphRepository) ]
       ↓
[ WatermelonDB / expo-sqlite ]
```

Vorteile:
- Sync-Engine austauschbar ohne Komponenten anzufassen
- Tests können den Repository-Layer mocken
- Schema-Migrationen an einer Stelle zentralisiert

**Fallback-Plan:** Falls WatermelonDB Probleme zeigt, ist Wechsel zu reinem Online-Betrieb (Supabase JS direkt) möglich — kein Komponenten-Code kennt WatermelonDB direkt.

---

## 19. Offene Punkte

Alle grundlegenden Entscheidungen sind getroffen. Noch offen:

1. **Figma — Layout vorhanden:** Datei [ragapp-Layout](https://www.figma.com/design/T6s2FocVkibx6pUG9A4uvw/ragapp-Layout?node-id=1-3&p=f&t=WcjtFybfBfHGKSU1-0). In Phase 0: `rag_paragraphs`-Zielschema mit den Screens abstimmen, `{{table.field}}`- bzw. Dev-Mode-Annotationen vervollständigen (**§13**, **§13.1** Tab-Checklisten), Design-Tokens nach `theme.ts`.

2. **ragrun ↔ Supabase:** Sobald ragprep auf Supabase schreibt, zeigt ragrun's DB-Connection auf **dieselbe** Supabase-Postgres (Lesen von **`rag_chunks`** für Embed, Schreiben von **`vector_chunks`** + Qdrant). **`vector_chunks`**-Schema in Supabase deployen; App-Sync bleibt auf den WatermelonDB-Tabellen (ohne ragrun-exklusive Tabellen). Teil von Phase 3.
