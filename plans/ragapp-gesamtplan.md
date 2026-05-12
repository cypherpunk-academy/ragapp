# ragapp — Gesamtplan

**Stand:** 2026-05-07 (Rev. 2 — Anmerkungen eingearbeitet)
**Stack:** Expo (React Native) + Supabase + WatermelonDB + expo-sqlite + ragrun Backend

---

## 1. Zielbild

ragapp ist die mobile und Web-Benutzeroberfläche für das ragrun-Wissenssystem. Sie ermöglicht das Durchsuchen, Lesen, Notieren und KI-gestützte Gespräche über den Textkorpus (Rudolf Steiner u.a.), den ragrun indexiert und bereitstellt.

Die App arbeitet **offline-first**: Inhalte sind lokal auf dem Gerät verfügbar und werden über WatermelonDB mit Supabase synchronisiert. Der ragrun-Server wird nur für aktive KI-Abfragen (Semantische Suche, Chat) benötigt.

**Web (PWA):** Nur Lesen und Suche (wenn online). Kein Offline-Sync für Web.

---

## 2. Architektur-Übersicht

```
┌─────────────────────────────────────┐
│            ragapp (Expo)            │
│  iOS  │  Android  │  Web (PWA)      │
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
| **Supabase DB** | Quelltexte, Notizen, Gespräche (rag_talks/rag_turns), Nutzerdaten, Freundschaften |
| **WatermelonDB** | Lokale SQLite-Datenbank + Sync-Layer gegen Supabase (MIT-Lizenz); Sync via 2 Postgres-Funktionen (push/pull RPC); kein eigener Server nötig |
| **expo-sqlite** | Lokale Datenbank auf dem Gerät (Offline-Zugriff) |

---

## 3. Navigation: 5 Tabs (horizontal wischbar)

```
[ Suche ] [ Übersicht ] [ Lesen ] [ Notizen ] [ KI-Chat* ]
                                                  * Pro
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
Die Philosophie der Freiheit (GA 4)          ← Buch, Ebene 1
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
- `ingestion_service.py` braucht **keine Änderung**

**Textaufbereitung (analog ragkeep statische Seiten):**
- Zitate: `quote`-Node → eingerückt mit Anführungszeichen-Stil
- Kursive Passagen: `italic`-Node → italic rendering
- Absatznummer am Anfang jedes Absatzes (aus `source_index` im chunk-Metadata)
- Beitrags-Streifen **am Ende jedes Absatzes** (Emoji + Zahl als kleine Chips, rechtsbündig). Jeder Eintrag ist ein **Beitrag zu diesem Absatz**:
  - ✏️ Notizen — eigene Anmerkungen zu diesem Absatz
  - 💬 Gespräche — KI-Gespräche, die diesen Absatz im Kontext hatten
  - 🎯 RAG-Treffer — wie oft der Absatz von der Vektor-DB (Qdrant) als relevante Antwort auf andere Fragen oder Konzepte zurückgegeben wurde (semantische Zentralität im Korpus)
- Schriftgröße einstellbar

**Lesezeichen:**
- Pro Nutzer, pro Absatz (`paragraph_id` als Anker, siehe Abschnitt 6)
- Letzter gelesener Absatz automatisch gespeichert
- Manuelles Lesezeichen via Absatz-Kontextmenü (Long-Press)

**Absatz-Kontextmenü (Long-Press):**
- Lesezeichen setzen/entfernen
- Notiz zu diesem Absatz schreiben
- KI-Chat zu diesem Absatz starten (Pro)
- Absatz kopieren / teilen

**Daten:** Texte aus expo-sqlite (via WatermelonDB aus Supabase synchronisiert). Lesezeichen lokal + Sync.

---

### Tab 4: Notizen

**Zweck:** Persönliche Annotationen zu Absätzen und Kapiteln.

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

### Tab 5: KI-Chat (Pro)

**Zweck:** Gesprächsbasiertes Erkunden des Textes mit KI-Persönlichkeiten.

**Datenmodell:** Orientiert sich an den bestehenden ragrun-Tabellen `rag_talks` und `rag_turns`, die nach Supabase migriert werden (siehe Abschnitt 7.2).

**rag_talks** (Gespräch-Kopf):
```
talk_id, collection, mensch_id, mensch_name, slug, title,
action_id, summary, usage, kontext_meta,
publishing_status, kontext_source_id, kontext_segment_id, kontext_paragraph
```

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

**Kontext-Modi** (gespeichert in `kontext_paragraph` / `kontext_segment_id`):
- "Aktueller Absatz" — `kontext_paragraph = paragraph_id`
- "Aktuelles Kapitel" — `kontext_segment_id`
- "Frei" — beide null

**UI:**
- Persönlichkeits-Picker (horizontal scrollbar, Avatar + Slug)
- Kontext-Anzeige: "Gespräch bezieht sich auf: [Kapitel/Absatz]"
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
| Pro freischalten | In-App Purchase via RevenueCat |
| Pro zurücknehmen | Store-Abo-Verwaltung; RevenueCat Webhook → Supabase |
| Zahlung | Apple IAP / Google Play Billing via RevenueCat |
| Verbrauchsübersicht | KI-Anfragen + Token-Verbrauch via `rag_usage` |
| Nutzungsstatistik | Gelesene Seiten, Notizen, Gespräche |
| Konto löschen | Pflicht (App Store + Play Store): löscht `auth.user` + alle Daten (Cascade) |
| Datenexport | JSON-Export aller Nutzerdaten (DSGVO Auskunftsrecht) |

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

## 6. Verknüpfungstabelle: paragraph_id ↔ rag_chunk

### Problem
- Notizen und Gespräche referenzieren Absätze über einen `paragraph_id`.
- Rag-Chunks haben eine `chunk_id` (UUID) und einen `source_index` (globale Absatznummer im Text, sichtbar als `"1| text..."` im Chunk-Text).
- Bei Neu-Chunking in ragprep ändern sich `chunk_id`-Werte — `paragraph_id` muss davon unabhängig stabil sein.

### Lösung
Stabiler `paragraph_id` = `{source_id}:{source_index}` — basiert auf dem Quelldokument und der globalen Absatznummer, die sich nur ändert wenn der Text selbst neu nummeriert wird.

```sql
-- In Supabase, wird von ragprep gepflegt
app_paragraph_chunk (
  paragraph_id   text PRIMARY KEY,  -- '{source_id}:{source_index}'
  collection     text NOT NULL,
  chunk_id       text NOT NULL,     -- aktueller chunk_id in rag_chunks
  source_id      text NOT NULL,
  source_index   int  NOT NULL,     -- globale Absatznummer
  segment_id     text,              -- Kapitel-Slug
  segment_index  int,               -- Position im Kapitel
  deprecated_at  timestamptz,       -- gesetzt wenn chunk sich ändert (nicht gelöscht!)
  created_at     timestamptz DEFAULT now()
)
CREATE INDEX ON app_paragraph_chunk (source_id);
CREATE INDEX ON app_paragraph_chunk (chunk_id);
CREATE INDEX ON app_paragraph_chunk (collection, source_id);
```

### Abhängigkeit von ragprep
**Diese Tabelle muss bei jedem ragprep-Chunking aktualisiert werden:**
- Neuer Chunk → neuer Eintrag oder UPDATE `chunk_id`
- Gelöschter/geänderter Chunk → `deprecated_at` setzen (NICHT löschen, da Notizen und Gespräche weiterhin auf `paragraph_id` zeigen)
- ragprep-Skript muss einen Sync-Schritt nach Supabase enthalten

In der App: Beim Anzeigen einer Notiz mit `deprecated_at != null` → Hinweis "Textstelle möglicherweise verändert".

---

## 7. Datenschicht & Sync-Strategie

### 7.1 Was liegt wo

| Daten | Supabase DB | expo-sqlite (WatermelonDB) | Sync via Supabase RPC |
|---|---|---|---|
| Texte (Chunks via rag_chunks) | Ja | Ja | Ja (initial + Updates) |
| Paragraph-Chunk-Mapping | Ja | Ja | Ja (read-only) |
| Notizen (app_notes) | Ja | Ja | Ja (bidirektional) |
| Gespräche (rag_talks, rag_turns) | Ja | Ja | Ja (bidirektional) |
| Lesezeichen | Ja | Ja | Ja (bidirektional) |
| Nutzerprofil / Freundschaften | Ja | Nein | Nein (immer online) |
| KI-Anfragen (live) | Log in rag_usage | Nein | Nein |

### 7.2 Datenmigration: Textkorpus → neue Supabase-Instanz

**Ausgangslage:**
- ragrun läuft gegen eine eigene Postgres-Instanz (bleibt unverändert — ragrun, Facebook-Bot etc. nutzen sie weiterhin).
- Supabase ist eine **neue, separate Instanz** ausschließlich für ragapp.
- Quelltexte liegen als `.md`-Dateien unter `ragrun/ragkeep/books/` und `ragrun/ragkeep/lectures/`, verarbeitet von ragprep zu Chunks (JSONL).

**Was kommt in die neue Supabase-Instanz:**

| Daten | Herkunft | Migration |
|---|---|---|
| `rag_chunks` (Textkorpus) | ragrun-Postgres | Einmalig kopieren, dann ragprep zusätzlich in Supabase schreiben |
| `app_paragraph_chunk` | neu | ragprep befüllt beim Chunking |
| `rag_talks` / `rag_turns` | **nur App-Gespräche** — nicht die ragrun/FB-Gespräche | Neue leere Tabellen |
| `app_notes`, Lesezeichen, Freundschaften | neu | Neue leere Tabellen |
| Auth (`auth.users`) | neu | Supabase Auth |

**Migrationsschritte:**

1. **Supabase-Projekt anlegen** (Region: eu-central-1 Frankfurt).
2. **Schema deployen:** Alle Tabellen via Supabase Migrations anlegen.
3. **rag_chunks einmalig kopieren:** `pg_dump` aus ragrun-Postgres → `psql` in Supabase. Nur die Chunk-Daten (kein `rag_talks`, kein `rag_turns` aus ragrun).
4. **`app_paragraph_chunk` befüllen:** Einmalig aus den vorhandenen JSONL-Dateien (`ragkeep/*/results/rag-chunks/book-chunks.jsonl`) per Migrations-Skript befüllen.
5. **ragprep auf Supabase umstellen:** ragprep schreibt künftig direkt in Supabase-Postgres (Connection String in ragprep-Config). `app_paragraph_chunk` wird dabei ebenfalls befüllt. ragrun-Postgres erhält keine Chunk-Updates mehr — ragrun liest Chunks nur noch aus Supabase.
6. **ragprep: AST-Parse-Schritt hinzufügen:** Nach dem Chunking parst ragprep `chunk.text` → AST-Nodes und schreibt das Ergebnis in `rag_chunks.rendered_content` (JSONB). Erkennt: Paragraph-Prefix (`"1| "`), `<i>`-Tags, `<q>`-Tags, Blockzitat-Muster, Überschriften. `ingestion_service.py` bleibt **unverändert** — Embedding läuft weiterhin über `_strip_markup(chunk.text)`.
7. **Supabase-Migration:** `ALTER TABLE rag_chunks ADD COLUMN rendered_content jsonb` — neue Spalte, bestehende Rows werden bei nächstem ragprep-Lauf befüllt.
8. **Qdrant bleibt unverändert:** Nur ragrun greift auf Qdrant zu. ragapp ruft ragrun an, nicht Qdrant direkt.

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
- `rag_chunks`, `app_paragraph_chunk`: global read-only (nur pull, kein push)
- `app_notes`, `rag_talks`, `rag_turns`: gefiltert nach `user_id` (bidirektional)
- `app_friendships`: gefiltert nach `user_id` (bidirektional)

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
| **ragapp** | App Store / Play Store / Web | — |

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

### Änderungs-Workflow
1. Design-Änderung in Figma
2. Tokens-Export aktualisieren → `theme.ts` anpassen (automatisch via CI möglich)
3. Betroffene Komponenten manuell anpassen (Dev Mode als Referenz)

### Empfohlene Figma-Plugins
- **Tokens Studio** — Design Token Management
- **Anima** — React-Komponenten-Export (eingeschränkt, als Referenz nützlich)
- **Figma MCP** — AI-Code-Assistent-Integration

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
- [ ] `paragraph_id`-Referenzen (`{source_id}:{source_index}`) durchgehend einsetzen
- [ ] Kontext-Übergabe: Long-Press → Notiz vorausgefüllt mit Absatz-Kontext
- [ ] Notiz-Badges am Absatz (Tab 3) zeigen vorhandene Notizen an

**Exit-Kriterium:** Notizen zu Absätzen schreiben, lesen, löschen — vollständig lokal.

---

### Phase 3 — Sync & Auth

Erst hier kommt Supabase ins Spiel. Das Datenmodell ist jetzt stabil.

- [ ] Supabase-Projekt anlegen (Region: eu-central-1)
- [ ] Auth: Magic Link + Apple Sign-In
- [ ] Datenmigration: ragrun-Postgres → Supabase (`rag_chunks`, etc.)
- [ ] ragprep auf Supabase umstellen + AST-Parse-Schritt (`rendered_content`) + `app_paragraph_chunk`
- [ ] Supabase-Migration: `rendered_content jsonb` zu `rag_chunks`
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

### Phase 5 — Chat (Pro)

- [ ] Tab 5: KI-Chat — Persönlichkeits-Picker, Kontext-Modi (Absatz / Kapitel / frei)
- [ ] `rag_talks` / `rag_turns` in Supabase anlegen und via WatermelonDB synchen
- [ ] RevenueCat + Apple IAP / Google Play Billing einrichten
- [ ] Pro-Feature-Gate (Tab 5 gesperrt für Free-Nutzer)
- [ ] Apple Small Business Program beantragen
- [ ] PostHog Opt-in Analytics
- [ ] Nutzungslimit pro Pro-User (max. 200 Runden/Monat)

**Exit-Kriterium:** Pro-Abo kaufbar, KI-Chat mit Persönlichkeit und Kontext funktioniert.

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
-- (kein Markdown-Parser — eigener Node-Renderer, ~100 Zeilen)
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

## 16. Kostenkalkulation & Pro-Preis

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

### 16.2 Variable Kosten: Anthropic API (KI-Chat Pro)

Modell: Claude Sonnet — $3/MTok Input, $15/MTok Output

| Annahme | Wert |
|---|---|
| Tokens pro Gesprächsrunde (Input) | ~2.000 (System-Prompt + Kontext + Verlauf) |
| Tokens pro Gesprächsrunde (Output) | ~500 |
| Kosten pro Runde | ~$0.014 |
| Runden pro Gespräch | ~10 |
| Kosten pro Gespräch | ~$0.14 |
| Gespräche pro Pro-User/Monat | ~10 |
| **API-Kosten pro Pro-User/Monat** | **~$1.40** |

**Empfehlung:** Ein monatliches Nutzungslimit pro Pro-User einbauen (z.B. 200 Runden/Monat), um API-Kosten zu deckeln. Verbrauchsübersicht ist ohnehin geplant (Tab Konto).

### 16.3 Store-Gebühren

**Apple Small Business Program + Google Play:** Dauerhaft **15%** bei Jahresumsatz < $1M (einmalige Bewerbung bei Apple nötig).

| Pro-Preis | Store-Gebühr (15%) | Netto aus Store |
|---|---|---|
| €4,99 | −€0,75 | €4,24 |
| €9,99 | −€1,50 | €8,49 |

### 16.4 Deckungsbeitrags-Rechnung pro Pro-User

| Posten | €4,99/mo | €9,99/mo |
|---|---|---|
| Einnahme (netto nach Store 15%) | +€4,24 | +€8,49 |
| Anthropic API (~$1.40 ≈ €1.30) | −€1,30 | −€1,30 |
| Infrastruktur-Anteil ($60/mo ÷ 100 User) | −€0,56 | −€0,56 |
| **Deckungsbeitrag** | **~€2,38/User/mo** | **~€6,63/User/mo** |

**Bei €4,99/mo:**
- Breakeven (Infrastruktur gedeckt): ~25 Pro-User
- Bei 50 Pro-Usern: ~€119/mo Deckungsbeitrag
- Bei 10 Pro-Usern: ~€24/mo — Infrastruktur noch nicht gedeckt

**Bei €9,99/mo:**
- Breakeven: ~9 Pro-User
- Bei 50 Pro-Usern: ~€330/mo Deckungsbeitrag

**Fazit:** €4,99 funktioniert, braucht aber ~3x so viele zahlende User für denselben Deckungsbeitrag. Sinnvoll wenn niedrige Einstiegshürde wichtiger ist als schneller Breakeven. €9,99 ist effizienter sobald eine treue kleine Nutzerbasis da ist.

### 16.5 Pro-Preis

**€5,00/Monat** oder **€40,00/Jahr** (33% Rabatt = Jahreszahler-Anreiz).

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
| Web-Scope | Lesen + Suche (wenn online); Offline/Sync nur nativ |
| Offline-Suche | Keine — ausgegraut mit Hinweis |
| Suchstrategie | Qdrant Hybrid (sparse + dense) via ragrun |
| Tab 2 Hierarchie | 3 Ebenen, rekursive TreeView |
| Sync-Engine | WatermelonDB (statt PowerSync) — reifer, MIT-Lizenz, kein eigener Server |

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

1. **Figma-Projekt:** Wann beginnt der Figma-Design-Prozess? Tokens Studio-Setup sollte vor Phase 1 stattfinden.

2. **ragrun DB-Migration:** Sobald ragprep auf Supabase schreibt, muss auch ragrun's DB-Connection auf Supabase umgestellt werden (ragrun liest Chunks bei der Suche). Dies ist Teil der Migration in Phase 0.
