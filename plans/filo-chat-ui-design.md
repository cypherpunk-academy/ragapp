# Filo-Chat — Plan

**Status:** Entwurf (§7.1 RAG-Vereinheitlichung entschieden, Juli 2026)
**Bezug:** [ragapp-gesamtplan.md](./ragapp-gesamtplan.md) · **[filo-implementation-plan.md](./filo-implementation-plan.md)** (Umsetzungsreihenfolge) · [NOTIZEN_ANALYSE.md](./NOTIZEN_ANALYSE.md) · **[filo-arbeitstext-contract.md](./filo-arbeitstext-contract.md)** (Verträge ragapp↔ragrun) · [ragrun-app-tools-architecture.md](../../ragrun/plans/ragrun-app-tools-architecture.md) (Backend-Implementierung)
**Scope:** Filo-Chat mit Streaming, Pin-Flag (Aufbewahrung), Modi und **Arbeitstexten** — persistierte Markdown-Texte in `app_notes` (Bibliothek mit Kontext-Filter + Verknüpfung im Chat).

---

## 0. Ist-Zustand (Codebase, Stand jetzt)

| Bereich | Ist | Datei |
|---|---|---|
| Tab-Reihenfolge | `[Übersicht(0), Lesen(1), Chat(2), Suche(3)]` | `app/(tabs)/_layout.tsx` |
| Start-Tab | Immer `Lesen`, wenn zuletzt aktiv, sonst `Übersicht` | `_layout.tsx` (`LAST_TAB_KEY`) |
| Chat-Screen | MVP: Gespräch-Auswahl (Suche + Liste) + einfache Turn-Liste, **kein** API-Call — Turn wird nur lokal angelegt, `assistantMessage` bleibt leer (`// TODO: ragrun-API aufrufen`) | `src/features/chat/ChatScreen.tsx` |
| Backend, nicht-streamend | `POST /app/chat` — **abgespeckter** Pfad: Personality + `app_search(limit=4)` + ein LLM-Call, **ohne** `assistant_chat_graph`, **ohne** `rag_references` — persistiert in `rag_talks`/`rag_turns` | `app_chat_service.py`, `deepseek_client.py` |
| Backend, streamend (Agent) | `POST /agent/{slug}/chat/stream` (SSE) — **voller RAG** via `assistant_chat_graph` (Intent, Retrieval, Citations), persistiert über LangGraph-Checkpoint (`thread_id`), **nicht** in `rag_talks`/`rag_turns`/`rag_references` | `app/api/chat.py`, `assistant_chat_graph.py` |
| Backend, streamend (App) | **`POST /app/chat/stream` fehlt** — Ziel: **gleicher RAG-Kern** wie Agent-Stream, **App-Persistenz** (`rag_talks`/`rag_turns`/`rag_references`) — siehe §7.1 | — |
| Datenmodell App-Chat | `rag_talks`/`rag_turns` (Postgres) + WatermelonDB `talks`/`turns` (Schema v18) — kein `pinned`-Flag, kein Modus-Feld, kein Truncate bei Edit | `app/db/tables.py`, `src/data/db/schema.ts` |
| Arbeitstexte — Datenmodell | `app_notes`/WDB `notes` — `content` (Markdown); `source_id`/`segment_slug`/`paragraph_id` für Kontext-Bezug (Filter § 5.1); optional `turn_id`/`talk_id` aus Chat | `NOTIZEN_ANALYSE.md` §4 |
| Arbeitstexte — UI | `ContributionsScreen.tsx` lädt absatzgebundene Legacy-Einträge (`NoteRepository.findByParagraph`) — **Arbeitstexte** leben nur in Tab ARBEITSTEXTE, nicht im Lesen-Tab | `src/features/read/ContributionsScreen.tsx` |
| Arbeitstexte — Rendering | `note.content` wird als reiner Plain-Text gerendert (`<Text>{note.content}</Text>`); einzige Markdown-Fähigkeit im Repo ist `parseMdInline()` (nur Inline-Bold/Italic, kein Block-Level) | `ContributionsScreen.tsx`, `src/shared/lib/parseMdInline.ts` |
| „Weiterlesen" | Bereits implementiert als `continueReadingLabel()`, aktuell nur in Übersicht verwendet | `src/features/overview/sourceDetail.ts` |
| Streaming-Client (RN) | Nicht vorhanden — `ragrunRequest()` ist ein einfacher `fetch()`+JSON-Wrapper, kein SSE/Stream-Reader | `src/data/lib/ragrun-client.ts` |

**Kernlücken gegenüber dem Design:** (1) kein Streaming im App-Chat-Pfad, (2) **zwei parallele Chat-Gehirne** — Agent-Stream hat vollen RAG, `/app/chat` nur `app_search`×4 (§7.1), (3) kein Pin-Flag / Nacht-Cleanup, (4) kein Modus-System, (5) Arbeitstexte noch nicht als Bibliothek + Markdown-Renderer, (6) Chat-Tab liegt an Position 2 statt 0, (7) `rag_references` werden vom App-Chat noch nicht geschrieben ([ragapp-gesamtplan.md](./ragapp-gesamtplan.md) Phase 5).

---

## 1. Bildschirmaufbau

Der Filo-Tab rutscht auf Position 0 (ganz links) und ist der Start-Tab der App. Ein bereits vorhandenes **WEITERLESEN**-Element (`continueReadingLabel()`) wird oben im Filo-Tab eingeblendet, solange eine Lese-Session existiert; ein Tap öffnet `navigateToRead(...)` mit der letzten Position, danach blendet es sich wieder aus.

Der Filo-Tab hat **drei** innere Reiter (Segmented Control unter dem Header, kein eigener PagerView-Index):

- **CHAT** (Default) — aktives Gespräch oder Leerzustand mit Eingabefeld, Claude-artig: kleiner, wachsender Input-Bereich, Modus-Auswahl, morphender Multifunktionsknopf (inaktiv/senden/stoppen). Abgeschickte User-Turns erhalten ein Menü (Bearbeiten, Wiederholen, Kopieren). **Arbeitstext:** Büroklammer im Header (§ 2, § 6) — Chat bleibt vollflächig; Vorschau als Overlay.
- **GESPRÄCHE** — Suchmaske + Liste aller Gespräche (gepinnt dauerhaft; ungepinnt bis zum Nacht-Cleanup nach 7 Tagen Inaktivität). Entspricht funktional der bereits existierenden Auswahl-Ansicht in `ChatScreen.tsx` (`!activeTalkId`-Zweig); wird als eigene innere Tab-Komponente herausgezogen statt als Vorschaltbildschirm.
- **ARBEITSTEXTE** — Bibliothek aller **Arbeitstexte**. **Filter** als **Dropdown rechts** (§ 5.1): vier Kontext-Stufen mit dynamischen Zeilen (`Absatz …` / `Kapitel …` / `Buch …` / `Allgemein`). **Sortierung:** Kontext-Stufe (Absatz → Kapitel → Buch → Allgemein), innerhalb der Stufe `updated_at` absteigend; bei aktivem Filter nur `updated_at`. **Titelsuche** zusätzlich (MVP). Tap auf Listenzeile → **Aktionsmenü:** **Vorschau** (gerendertes Markdown) · **In Gespräch bearbeiten** (öffnet CHAT, Arbeitstext per 📎 verknüpft). Langfristig: Freigabe für Freunde (nicht MVP; `is_public` im Schema bereits vorhanden).

**Navigations-Änderung:** Reihenfolge wird `[Filo(0), Übersicht(1), Lesen(2), Suche(3)]`. `TAB_INDEX_READ`/`TAB_INDEX_CHAT`/`TAB_INDEX_SEARCH` in `ReadingContext.tsx` werden entsprechend verschoben, `TabBar.TABS` neu sortiert. Die bestehende „nur Lesen-Tab wird wiederhergestellt, sonst Index 0"-Logik in `_layout.tsx` muss angepasst werden, **nicht** unverändert bleiben: `setInitialPage(Number(val) === 1 ? 1 : 0)` hat die `1` für Lesen hart codiert (wird zu `2`), und `handleTabPress`s `if (index === 0) resetOverview()` ist an „Übersicht" gebunden, nicht an Index 0 an sich (Übersicht wandert auf Index 1). Beide Stellen brauchen benannte Konstanten statt Magic Numbers (siehe Phase A).

---

## 2. Header

**Links:** Zurück-Pfeil (nur wenn der Aufruf über Suche oder Buchtext erfolgt ist), Gesprächstitel (Tippen = umbenennen, analog `TalkRepository`-Update).

**📌 Pin** (Icon, keine Checkbox) · **📎 Arbeitstext** (siehe unten) · **▓▓▓░░ Kontext** (rechts):

**Pin** — Aufbewahrung des Gesprächs:
- Jeder Chat wird **sofort** in der Datenbank angelegt (`TalkRepository.create()` beim ersten Turn, jeder Turn via `TurnRepository` / Sync). Der Pin steuert nur die **Aufbewahrung**, nicht ob geschrieben wird.
- Neuer Chat startet **unpinned** (`pinned = false`):
  - Pin-Icon als Umriss (nicht gefüllt)
  - dezente Banner-Zeile unter dem Header: *„Nicht angepinnt — wird nach einer Woche gelöscht"* (nach 3 s einklappen auf ein kleines Label)
- Tippen auf 📌 → Pin füllt sich, Banner verschwindet, `pinned = true` — Gespräch bleibt dauerhaft in GESPRÄCHE sichtbar.
- Nochmal tippen → Rückfrage: *„Pin entfernen? Gespräch wird nach einer Woche gelöscht, wenn es bis dahin nicht wieder angepinnt wird."*
- **Sicherheitsnetz:** Verlässt der User einen ungepinnten Chat mit ≥ 4 Turns, einmalige Nachfrage: *„Anpinnen?"* [Anpinnen] [Später]. Kein Verwerfen — Daten liegen bereits in der DB; „Später" lässt den Cleanup-Job wirken.

Warum Icon statt Checkbox: Der Pin ist eine Eigenschaft des ganzen Gesprächs, nicht pro Nachricht — ein Zustand, ein Ort.

**Persistenz-Mechanik (Architektur):** **Immer serverseitig** (WDB + Supabase via Sync). Kein rein clientseitiger Turn-Buffer. `pinned` ist das einzige Retention-Flag.

**Nacht-Cleanup (ragrun):** Cron-Job einmal pro Nacht löscht alle `rag_talks` mit `pinned = false` und `updated_at` älter als **7 Tage** (kaskadiert auf `rag_turns`). Gepinnte Gespräche bleiben unbegrenzt. Client: entsprechende Talks aus WDB nach Sync-Tombstones entfernen.

**📎 Arbeitstext** (Header, neben Pin):
- Umriss = kein Arbeitstext verknüpft · gefüllt = Arbeitstext aktiv (Titel als Tooltip / dezentes Label unter Header)
- Tap: Bottom Sheet — Suche, Liste der Arbeitstexte, **„Neuen Arbeitstext anlegen"**
- Nach Auswahl: Verknüpfung persistiert in `talks.kontext_meta`; dezenter **Arbeitstext-Chip** unter dem Header (Titel, tap → Preview-Overlay, § 6)
- **Loslösen:** erneut auf 📎 → *„Verknüpfung aufheben?"* — Arbeitstext bleibt in Bibliothek, Overlay schließt sich

**Kontext-Anzeige** (rechts im Header):
- Schmaler Ring oder Mini-Balken, dauerhaft sichtbar, drei Farbstufen:
  - grün < 60 % · gelb 60–85 % · rot > 85 %
- **Tippen öffnet ein Bottom Sheet:**
  ```
  Kontextspeicher
  ────────────────────────
  Modell: Claude Fable (Nachdenken)
  Belegt: 41.200 / 200.000 Tokens (21 %)
  ▓▓▓▓░░░░░░░░░░░░░░░░

  [ Gespräch verdichten ]
  ```
- **„Gespräch verdichten":** Filo fasst ältere Turns zu einem Kontextblock zusammen; die Original-Turns bleiben in der DB, aber nur die Zusammenfassung + letzte n Turns gehen ans Modell. Ab 85 % erscheint der Button automatisch als Vorschlag im Chat.
- **Modellabhängigkeit:** Die Prozentzahl bezieht sich auf das Kontextfenster des **aufgelösten Modells** hinter dem aktuellen Modus (`resolveModelForMode(mode, settings)`, § 4). Wechselt der User den Modus oder die Modell-Zuordnung in den Einstellungen, rechnet die Anzeige sofort gegen das neue Limit um.
- **Was gezählt wird — effektiver Kontext:** Die Anzeige spiegelt **nicht** die Summe aller historischen `usage`-Werte, sondern die Token, die beim **nächsten** Request tatsächlich ans Modell gehen würden (§ 8.2). Dazu gehören u. a. System-Prompt, Verdichtungsblock (falls gesetzt), `document_outline` (falls 📎 verknüpft) und alle verbleibenden Turns.
- **Bearbeiten / Wiederholen (MVP):** Löscht alle **nachfolgenden** Turns — kein abgeschwächter Verlauf, keine Verzweigungen in der UI (§ 3). Kontextanzeige fällt nach Edit/Wiederholen sofort (kein Geister-Kontext). **Später (nicht MVP):** „Gespräch kopieren", um vor destruktivem Edit einen Zweig zu sichern.
- **Datenquelle:** Bevorzugt `context_meta.effective_tokens` aus dem SSE-`done`-Event (vom Backend berechnet, identisch zum Prompt-Assembler). Client-Fallback: `computeEffectiveContextTokens()` aus aktiven Turn-Texten + feste Zuschläge (System-Prompt, Outline) — nur bis Phase D serverseitig live ist.
- Limits als Map `model → contextWindow` in `src/shared/lib/modelContextLimits.ts` (§ 7.3).

---

## 3. Turns

### User-Turn
- Rechtsbündige Bubble.
- **⋯-Menü** (Tippen auf Icon oder Long-Press auf Bubble):
  - ✏️ **Bearbeiten** — Text landet zurück im Eingabefeld; beim Absenden werden alle nachfolgenden Turns **gelöscht** (WDB + Sync, kaskadiert auf `references`). Kontextanzeige sinkt sofort (§ 2, § 8.2).
  - 📋 **Kopieren**
  - **Wiederholen** — sendet denselben `userMessage` erneut; alle nachfolgenden Turns werden wie bei „Bearbeiten" **gelöscht**.

**Kein Verzweigungs-Verlauf im MVP:** Nach Edit/Wiederholen verschwinden Folge-Turns aus UI und DB — bewusst einfach, um eine UI-Hölle aus abgeschwächten Zweigen zu vermeiden. **Später (nicht MVP):** **Gespräch kopieren** — Duplikat des Gesprächs anlegen, dann im Klon bearbeiten, ohne den Original-Verlauf zu verlieren.

### Filo-Turn
- Linksbündig, volle Breite, absatzweise gerendert (analog `ParagraphRenderer`, aber für Fließtext ohne Absatznummern).
- **⋯-Menü am Turn-Ende:**
  - 📋 **Kopieren** (ganzer Turn)
- **Kein** „In den Arbeitstext" im Turn-Menü (§ 5.3.1, § 6): Der User instruiert im Chat (*„Setz das unter ## Einleitung"*); Filo **liest und schreibt ausschließlich per Tool** (`read_blocks`, `update_document`, `create_document`) — kein Turn-Aktions-Button, kein Copy-Paste aus der Bubble.

### Letzter Turn / Aktionsknopf
Ein einziger **morphender Knopf** rechts neben dem Eingabefeld:

| Zustand | Anzeige | Aktion |
|---|---|---|
| Eingabe vorhanden, keine Anfrage läuft | ➤ (Senden) | abschicken |
| Anfrage läuft / streamt | ⏹ (Stopp) | Stream abbrechen (`AbortController`); Teilantwort bleibt stehen, darunter Chip „Fortsetzen" |
| Eingabe leer, nichts läuft | ➤ ausgegraut | — |

Kein separates Speichern-Symbol am Turn: Aufbewahrung ist Sache des Pins im Header (§ 2).

---

## 4. Eingabezeile

- **[Modus ▾]** links vom Eingabefeld — kompakter Chip, zeigt Icon + Label des aktiven Modus:
  1. 💬 **Chat**
  2. 🧠 **Nachdenken**

  Wählt das **Verhalten** für den nächsten Turn (schnelle Antwort vs. Nachdenken) — **nicht** das konkrete API-Modell. Welches Modell hinter Chat bzw. Nachdenken läuft, legt der User in den **Einstellungen** fest (§ 4, `einstellungen.tsx`).

**Arbeitstext im Chat (kein Modus nötig):**
- **Header-📎** (§ 6, Hauptpfad) — Arbeitstext wählen oder neu anlegen → Arbeitstext-Chip + Preview-Overlay auf Abruf → User instruiert Filo im normalen Chat. Filo antwortet im Chat **und** nutzt **Tools** zum Lesen/Schreiben (§ 5.3.1), z. B. *„## Kapitel 1 kürzer"* / *„Lies ### Feld 2 und schärfe den Absatz"* / *„Übernimm den letzten Absatz unter ## Einleitung"*.
- **Natürliche Sprache ohne 📎:** *„Halte das als Arbeitstext fest"* → `create_document`; danach optional automatisch verknüpfen und Preview öffnen.
- Letzter gewählter Modus wird pro Konversation gemerkt (`talks.mode`).
- Beim Moduswechsel kurzer Toast: *„Nachdenken · Antworten dauern etwas länger"* — einmal pro Modus, dann nie wieder (lokal in `AsyncStorage` gemerkt).
- **Eingabefeld:** 2 Zeilen Start, Auto-Grow bis 10 Zeilen, danach internes Scrollen; nach dem Absenden zurück auf 2 Zeilen (`onContentSizeChange` + `maxHeight`).

### Modi-Datenmodell (Referenz für Implementierung)

**Zwei Stellen** — Modus (Verhalten) und Modell (API) sind getrennt:

| Wo | User wählt | Persistenz | Default |
|---|---|---|---|
| **Aktiver Chat** — `[Modus ▾]` an der Eingabezeile | **Chat** oder **Nachdenken** | `talks.mode` pro Gespräch | Chat |
| **Einstellungen** — `einstellungen.tsx` | Welches Modell **Chat** antwortet · welches **Nachdenken** antwortet | User-Settings (`AsyncStorage`, ggf. später Profil) | Chat → **DeepSeek V4 Chat** · Nachdenken → **DeepSeek V4 Thinking** |

Technische Default-Keys (anpassbar in Settings, § 11 Punkt 14): **`deepseek-v4-flash`** für beide Modi. **Chat vs. Nachdenken** ist seit ragrun-Migration **kein Modellname mehr**, sondern Request-Parameter `thinking.type`: `disabled` (Chat) / `enabled` (Nachdenken) — siehe `app/core/providers.py` (`get_deepseek_chat_client()` / `get_deepseek_reasoner_client()`). Optional kann Nachdenken auf `deepseek-v4-pro` zeigen (höhere Tier, gleicher Thinking-Schalter).

```typescript
// src/shared/lib/chatModes.ts — Modus-Metadaten (UI)
export type ModeId = 'chat' | 'nachdenken';

export type ChatMode = {
  id: ModeId;
  label: string;
  icon: MaterialIconName;
  /** ragrun personality-Slug für den System-Prompt. */
  personality: string;
};

export const CHAT_MODES: ChatMode[] = [
  { id: 'chat', label: 'Chat', icon: 'chat', personality: '…' },
  { id: 'nachdenken', label: 'Nachdenken', icon: 'psychology', personality: '…' },
];

// src/shared/lib/chatModelSettings.ts — Modell-Zuordnung (Settings)
export type ChatModelSettings = {
  /** Modell für Modus „Chat". */
  chatModel: string;
  /** Modell für Modus „Nachdenken". */
  nachdenkenModel: string;
};

export const DEFAULT_CHAT_MODEL_SETTINGS: ChatModelSettings = {
  chatModel: 'deepseek-v4-flash',       // DeepSeek V4 Flash — thinking: disabled
  nachdenkenModel: 'deepseek-v4-flash', // DeepSeek V4 Flash — thinking: enabled (selber api_model)
};

export function resolveModelForMode(
  mode: ModeId,
  settings: ChatModelSettings,
): string {
  return mode === 'nachdenken' ? settings.nachdenkenModel : settings.chatModel;
}
```

**Chat-Request** (zusätzlich zu `message`, `talk_id`, …):

```typescript
{
  mode: ModeId;           // aus [Modus ▾]
  model: string;          // resolveModelForMode(mode, userSettings)
}
```

**Backend:** `/app/chat/stream`-Adapter wertet `mode` (Personality, System-Prompt) und `model` (API-Modellname) aus und mappt auf:

| Modus | `model` (aus Settings) | `thinking.type` | ragrun-Factory |
|---|---|---|---|
| `chat` | `settings.chatModel` | `disabled` | `get_deepseek_chat_client()` |
| `nachdenken` | `settings.nachdenkenModel` | `enabled` | `get_deepseek_reasoner_client()` |

Im **LangGraph** (`assistant_chat_graph._make_llm`) ist `thinking: disabled` heute **fest verdrahtet** — Phase B/E muss `_make_llm(model, thinking_type)` bzw. `model_kwargs` aus dem Request-Modus ableiten. **Wichtig:** `deepseek-v4-flash` defaultet serverseitig auf Thinking **enabled**, wenn der Parameter fehlt — Chat-Pfade müssen `disabled` explizit setzen (bereits in Graph + `action_prompt.py`). Kontextanzeige (§ 2) nutzt `modelContextLimits[model]` für das **aufgelöste** Modell des aktiven Modus.

---

## 5. Arbeitstexte

### 5.0 Konzept & Begriff

**Begriffsvereinheitlichung:** **Notizen** und **Arbeitsdokumente** (frühere getrennte Begriffe im Design und in der Codebase) sind **dieselbe Sache** — ab jetzt durchgängig **Arbeitstext** / **Arbeitstexte**.

**Was es ist:** Ein **Arbeitstext** ist persistierter **Markdown**-Text in `app_notes` — von einer halben Seite bis zu einem Werk, an dem man wochenlang arbeitet. Eigene Erklärungsebene: für sich selbst, später optional für Freunde freigeben (nicht MVP).

**UI-Begriff:** **Arbeitstext** (Singular), Tab **ARBEITSTEXTE** (Bibliothek). **Technisch:** `app_notes` (Supabase) / WDB `notes` / `NoteRepository` — Tabellen- und Repository-Namen bleiben vorerst; nur UI-Labels und Mental Model wechseln auf Arbeitstexte. Langfristig optional Umbenennung im Code.

**Warum Markdown:** LLMs verstehen Struktur nativ (`#` / `##` = Kapitel im Arbeitstext, nicht zu verwechseln mit Buch-Kapiteln). User sagt *„Ergänze Abschnitt ## Sozialimpuls"* — Filo kann gezielt patchen statt alles neu zu schreiben.

**Zwei Rollen:**

| Rolle | Beschreibung |
|---|---|
| **Bibliothek** (Tab ARBEITSTEXTE) | Übersicht: Kontext-Filter, Titelsuche, Sortierung; Tap → Vorschau oder In Gespräch bearbeiten |
| **Verknüpfung im Chat** (Header-📎, § 6) | Arbeitstext binden — User instruiert im Chat; Filo liest/schreibt per Tool (§ 5.3.1) |

**Kein eigener Modus** für „am Arbeitstext arbeiten". Ein verknüpfter Arbeitstext **ändert den Chat-Kontext** (Attachment + System-Prompt-Hinweis), bleibt aber Chat/Nachdenken als Modus.

**Später (nicht MVP):** `is_public` + Freigabe-UI; Freunde sehen freigegebene Arbeitstexte in der Übersicht oder im Profil.

### 5.1 Kontext-Bezug & Filter

Arbeitstexte können **optional** an den Korpus gebunden sein — über `source_id`, `segment_slug` und `paragraph_id` in `app_notes` / WDB `notes`.

**Warum `segment_slug` statt Parsen:** Kapitel/Vortrag **nicht** über `segment_index` aus `paragraph_id` ableiten — das ist fragil (`NOTIZEN_ANALYSE.md` §9: `paragraph_id` teils WDB-UUID, teils semantisch; Index verschiebt sich bei Re-Ingest). In `rag_paragraphs` ist `segment_slug` der **stabile natürliche Schlüssel** (`source_id` + `segment_slug` + `paragraph_number`). `ReadScreen` übergibt `segmentId` bereits beim Anlegen, wird aber noch nicht persistiert — wird mit `segment_slug` geschlossen.

**Vier Kontext-Stufen** (gleiche Taxonomie wie ContextPicker im KI-Chat / Figma `Design System`):

| Stufe | Label (Dropdown) | Zuordnung |
|---|---|---|
| 1 | **Absatz** + Snippet | `paragraph_id` = `rag_paragraphs.id` des gelesenen Absatzes |
| 2 | **Kapitel** + Titel | gleiche `source_id` **und** gleicher `segment_slug`; `paragraph_id` darf abweichen oder leer sein |
| 3 | **Buch** + Titel | gleiche `source_id`; `segment_slug` / `paragraph_id` dürfen abweichen |
| 4 | **Allgemein** | `source_id`, `segment_slug` und `paragraph_id` alle leer |

**Filter (Tab ARBEITSTEXTE):** **Dropdown rechts** in der Filter-/Suchzeile (keine horizontale Chip-Leiste). Vier Einträge — jeweils **Stufen-Label + Kontext-Snippet** aus der aktiven Lese-Position (`ReadingContext` + aktueller `Paragraph` + `Source`):

| Stufe | Zeile im Dropdown | Datenquelle |
|---|---|---|
| 1 | **Absatz** \<erste 5 Wörter des Absatzes\> | `paragraph.text_raw` (oder gerenderter Absatztext), whitespace-getrennt, max. 5 Wörter; bei Kürzung `…` |
| 2 | **Kapitel** \<Kapiteltitel\> | `paragraph.segment_title` (Fallback: `segment_slug`) |
| 3 | **Buch** \<aktuelles Buch\> | `sources.title` zu `paragraph.source_id` |
| 4 | **Allgemein** | Festes Label, kein Snippet |

**Layout:** Eine Zeile — links Suchfeld „Titel durchsuchen…" (+ 📎 für Neu); **rechts** der Dropdown (z. B. `Menu` / Picker mit Chevron). Ausgewählte Zeile als kompakter Trigger-Text (Stufe + gekürztes Snippet).

**Je nach Lese-Kontext:** Mit aktiver Lese-Session sind alle vier Einträge wählbar. Ohne Lese-Session: **Absatz** und **Kapitel** disabled oder ausgeblendet; **Buch** nur wenn `source_id` aus Navigation bekannt; **Allgemein** immer verfügbar. Filterlogik unverändert (§ 5.1 Tabelle) — nur die **UI-Labels** werden kontextualisiert.

**Sortierung:** Ohne aktiven Filter: zuerst nach Kontext-Stufe (1 → 4), innerhalb jeder Stufe `updated_at` absteigend. Mit aktivem Filter: nur Treffer dieser Stufe, sortiert nach `updated_at`.

Zusätzlich **Titelsuche** (§ 5.4) — schneidet die gefilterte/sortierte Liste live zu.

**Herkunft aus Chat** (ergänzend): `turn_id` / `talk_id` auf dem Arbeitstext, wenn er aus einer Filo-Antwort entstanden ist — Navigation zurück zum Gespräch, unabhängig vom Korpus-Bezug.

**Neue Arbeitstexte:** Beim Anlegen aus Lesen/Chat: `source_id` + `segment_slug` (+ optional `paragraph_id` für Absatz-Bezug). Nur freie Texte: alle drei leer (**Allgemein**).

### 5.2 Entstehung

1. **Header-📎 im Chat** (Hauptpfad, § 6): bestehenden oder neuen Arbeitstext wählen → Arbeitstext-Chip → instruieren, Vorschau bei Bedarf öffnen.
2. **Natürliche Sprache:** *„Halte das als Arbeitstext fest"* / `create_document` — Tool-Call, Client materialisiert; optional direkt verknüpfen.
3. **Tab ARBEITSTEXTE → Neu** — leerer Arbeitstext (Kontext = aktuelle Lese-Position oder Allgemein); **In Gespräch bearbeiten** im Aktionsmenü öffnet CHAT mit 📎 bereits gesetzt.

### 5.3 Format: Markdown, Document Tree (keine Tabellen im MVP)

`notes.content` = Markdown. **Titel** = erste `#`-Zeile.

**MVP-Einschränkung:** Nur `#` / `##` / `###`, Absätze und Listen — **keine Markdown-Tabellen**. Vorlagen mit Tabellen (z. B. Doppelmatrix in ragkeep) werden für die App in `###`-Felder mit nummerierten Listen konvertiert. Der Rohtext-Editor zeigt bei erkannten `|`-Tabellen optional einen Hinweis.

**Maximalgröße:** **50 000 Zeichen** (`notes.content.length`) — Hard-Limit beim Speichern und bei `update_document` / `create_document`. Für Kontext-Budget grob **~12 000 Tokens** ansetzen (≈4 Zeichen/Token; Deutsch oft etwas mehr — **10 000 Tokens** als konservative Planungsuntergrenze). Bei Annäherung an das Limit: Editor-Warnung; Filo soll kapitelweise patchen, nicht das ganze Werk neu schreiben.

**Document Tree** (`src/data/lib/documentTree.ts`): Parser wandelt Markdown in einen Baum; Serializer schreibt zurück.

| Element | Bedeutung |
|---|---|
| `#` | Arbeitstext-Titel |
| `##` | Kapitel |
| `###` | Unterabschnitt (ersetzt frühere Tabellenzeilen) |
| Absatz | Block unter Überschrift, durch Leerzeile getrennt |

**Adressen:**

- `paragraph_id` — z. B. `ch1.p2` (Position im Baum, nach jedem Patch neu parsen)
- `heading_path` — z. B. `["## Kapitel 2: …", "### Feld 1 — Geist → Recht"]` (disambiguiert doppelte `###`-Titel)

**Im Chat-Request** (wenn Arbeitstext verknüpft): Client schickt `document_outline` + `linked_document_content` — siehe [filo-arbeitstext-contract.md](./filo-arbeitstext-contract.md) §2–3. Outline geht ans Modell; Volltext nur via Tool `read_blocks`.

### 5.3.1 LLM-Tools: Lesen & Schreiben

**Prinzip:** Das Modell greift **nur über Tools** auf Arbeitstexte zu — ragrun schreibt nicht in `app_notes`; ragapp materialisiert lokal (`NoteRepository` + Sync). Kein Turn-Menü „In den Arbeitstext"; User + Filo sprechen über **Markdown-Struktur** in natürlicher Sprache.

| Markdown | Beispiel-Anweisung (User) | Tool-Adresse |
|---|---|---|
| `#` | *„Benenne den Arbeitstext um"* | `update_heading` |
| `##` | *„Kürze ## Einleitung"* | `heading_path: ["## Einleitung"]` |
| `###` | *„Schärfe ### Feld 1 …"* | `heading_path: ["## …", "### …"]` |
| Absatz | *„Zweiten Absatz in ## Kapitel 2 umschreiben"* | `paragraph_id` (z. B. `ch2.p2`) |

**Typischer Ablauf:** Outline im Request → optional `read_blocks` → `update_document` → SSE `done.tool_results` → Client patcht → Chip „📄 [Titel] aktualisiert".

**Technische Spezifikation** (Tools, Payloads, SSE, Request-Schema): **[filo-arbeitstext-contract.md](./filo-arbeitstext-contract.md)** §4–6.

**Renderer:** `DocumentMarkdownView` — Überschriften, Absätze, Listen, `parseMdInline`; keine Tabellen.

### 5.4 Bibliothek, Aktionen & Chat-Verknüpfung

**Tab ARBEITSTEXTE** — Liste aller Arbeitstexte:

| Feature | MVP |
|---|---|
| **Filter** | **ja** — Dropdown **rechts** (§ 5.1): `Absatz <5 Wörter>` · `Kapitel <Titel>` · `Buch <Titel>` · `Allgemein` |
| **Sortierung** | Kontext-Stufe (1→4), innerhalb Stufe `updated_at` absteigend; bei Filter nur `updated_at` |
| **Suche** | **ja** — Titelsuche (erste `#`-Zeile in `notes.content`, ohne `#`) |
| **Listenzeile** | Titel, Kontext-Badge (z. B. ¶4 / Kapitel / Werk / Allgemein), Zeichenzahl (`x / 50 000`), `updated_at` (relativ) |
| **Tap** | **Aktionsmenü** (Bottom Sheet oder Kontextmenü) — nicht direkt Detail-Screen |

**Aktionsmenü** (Tap auf Listenzeile):

| Aktion | Verhalten |
|---|---|
| **Vorschau** | Preview-Overlay mit gerendertem Markdown (`DocumentMarkdownView`); optional **✏️ Bearbeiten** → Rohtext-Editor im Overlay |
| **In Gespräch bearbeiten** | Wechsel zu CHAT, neues oder bestehendes Gespräch, Arbeitstext per Header-📎 verknüpft — Filo-Patches wie § 6 |

Kein separater Vollbild-Detail-Screen als Standardpfad; Editor nur über Vorschau (✏️) oder nach Verknüpfung im Chat.

**Titelsuche (MVP):** Suchfeld oben in ARBEITSTEXTE (im 📎-Bottom-Sheet § 6 weiterhin nur Titelsuche, ohne Kontext-Filter). Client-seitig auf der von WDB geladenen Liste — bei 50–200 Arbeitstexten ausreichend schnell. Matching: case-insensitive Substring auf `extractDocumentTitle(content)` (`documentTree.ts`). Kein Volltext in `content`, keine Fuzzy-Suche im MVP.

```typescript
// documentTree.ts
export function extractDocumentTitle(content: string): string {
  const line = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return line ?? 'Ohne Titel';
}

// src/shared/lib/arbeitstextContext.ts
export type ArbeitstextContextTier =
  | 'paragraph'   // Aktueller Absatz
  | 'segment'     // Kapitel/Vortrag
  | 'source'      // Buch
  | 'general';    // Allgemein

export function classifyArbeitstextContext(
  note: { sourceId: string | null; segmentSlug: string | null; paragraphId: string | null },
  reading: { sourceId: string; segmentSlug: string; paragraphId: string } | null,
): ArbeitstextContextTier { /* … */ }

export function filterByContextTier(
  notes: Note[],
  tier: ArbeitstextContextTier,
  reading: ReadingContext | null,  // enthält segmentSlug aus aktuellem Paragraph
): Note[] { /* … */ }
```

Leere Suche → volle (gefilterte) Liste. Suche + Filter + Sortierung kombinierbar.

**Nach Tool-Patch im Chat:** Arbeitstext wird sofort aktualisiert (auch wenn Overlay geschlossen). Kurzer Chip im Chat: *„📄 [Titel] aktualisiert"* — Tap öffnet Preview-Overlay, scrollt zur geänderten Stelle. Ist das Overlay bereits offen, aktualisiert es sich live.

**Undo (MVP):** Ein Schritt zurück — vor jedem auto-applied Patch speichert der Client `content` auf einem Stack (`documentUndoStack`, max. 1 Eintrag im MVP). Button **↩ Rückgängig** in der Overlay-Leiste stellt den vorherigen Stand wieder her (`NoteRepository.update` + Sync). Chat-Turn bleibt unverändert; nur der Arbeitstext rollt zurück.

**✏️ Bearbeiten:** In der Vorschau-Overlay-Leiste (Bibliothek oder Chat) — **Vollbild-Rohtext-Editor** (`notes.content`), Speichern schließt Editor. Manuelle Edits invalidieren ggf. Document-Tree-`paragraph_id`-Positionen — beim nächsten Chat-Turn wird `document_outline` neu berechnet.

### 5.5 Chat-Aufbewahrung vs. Arbeitstexte

**Gespräche:** immer in der DB (§ 2). Ungepinnt → Löschung nach 7 Tagen per Nacht-Cleanup. **Arbeitstexte:** immer dauerhaft persistiert, unabhängig vom Pin-Status des verknüpften Chats. `turn_id`/`talk_id` auf dem Arbeitstext können ins Leere zeigen, wenn der Ursprungs-Chat gelöscht wurde — der Arbeitstext bleibt.

### 5.6 Tools & automatische Übernahme

**Entscheidung:** Vorschläge werden **automatisch** materialisiert — kein Chip „Übernehmen?". Der Chat-Turn zeigt `summary_for_chat`; der Arbeitstext ist bereits aktualisiert. **Undo** in der Preview-Overlay-Leiste (§ 5.4, § 6).

Tool-IDs, `result_key`-Mapping, SSE-Format: [filo-arbeitstext-contract.md](./filo-arbeitstext-contract.md) §4–5. Backend-Registry/Handler: [ragrun-app-tools-architecture.md](../../ragrun/plans/ragrun-app-tools-architecture.md).

### 5.7 Tool-Verfügbarkeit im Chat

Siehe [filo-arbeitstext-contract.md](./filo-arbeitstext-contract.md) §4 (Tabelle „Wann verfügbar"). Kurz: ohne Verknüpfung nur `create_document`; mit 📎 zusätzlich `read_blocks` + `update_document`.

---

## 6. Header-📎: Arbeitstext verknüpfen

**Position:** Header, zwischen Pin und Kontext-Anzeige — **nicht** in der Eingabezeile.

**Tap öffnet Bottom Sheet:**

```
Arbeitstext
────────────────────────
🔍 Suchen …
📄 Neuen Arbeitstext anlegen
────────────────────────
Zuletzt bearbeitet
  Meine Dreigliederung-Erklärung
  Doppelmatrix — Gesundheit und Krankheit
  …
```

**Nach Auswahl — Chat bleibt vollflächig, kein Split-View:**

Auf dem Smartphone reicht die Breite/Höhe nicht für gleichzeitigen Chat und lesbare Arbeitstext-Vorschau. Stattdessen:

```
┌─────────────────────────────────┐
│ Header: 📌 📎  ▓▓▓              │
│ 📄 Meine Erklärung        [tap] │  ← Arbeitstext-Chip (nur wenn verknüpft)
├─────────────────────────────────┤
│ Chat (volle Höhe, scrollbar)    │
│   User: Kapitel 1 kürzer        │
│   Filo: Ich habe …              │
│   📄 Meine Erklärung aktualisiert│  ← nach Patch, tap → Overlay
├─────────────────────────────────┤
│ [Modus ▾]  Eingabe…        [ ➤ ]│
└─────────────────────────────────┘
```

**Preview-Overlay** (Bottom Sheet, ~55–65 % Höhe) — öffnet per Tap auf Arbeitstext-Chip, „aktualisiert"-Chip oder gefülltes 📎:

```
┌─────────────────────────────────┐
│ Meine Erklärung    [ ↩ ][ ✏️ ][ ✕ ]│  ← Undo, Bearbeiten, Loslösen
├─────────────────────────────────┤
│ # Meine Erklärung               │
│ ## Kapitel 1                    │
│ … (gerendertes Markdown)        │
└─────────────────────────────────┘
```

- Overlay **nicht** dauerhaft offen — Chat hat Priorität; User öffnet bei Bedarf
- Nach Filo-Patch: Overlay-Inhalt aktualisiert sich, wenn offen; sonst reicht „aktualisiert"-Chip
- **✏️ Bearbeiten** → Vollbild-Rohtext (`notes.content`), Speichern schließt Editor, zurück zum Chat
- Voller Arbeitstext **nicht** im Request — **`document_outline`** + ggf. `read_blocks`; Token in Kontext-Anzeige (§ 2)
- User schreibt im **normalen Chat**; Filo **liest** (`read_blocks`) und **schreibt** (`update_document`) per Tool — nicht über Turn-Aktionen (§ 5.3.1) → **Undo** in Overlay-Leiste (§ 5.4)
- Inhalt aus einem Filo-Turn in den Arbeitstext: *„Setz den letzten Absatz unter ## …"* — kein Turn-Menü nötig

**Loslösen:** ✕ in der Overlay-Leiste oder 📎 erneut tippen — Arbeitstext bleibt in Bibliothek.

**Mehrere Arbeitstexte:** MVP **max. 1** verknüpfter Arbeitstext pro Chat.

**Datenmodell:**

```typescript
// turns.kontext_meta (bestehendes JSON-Feld)
attachments: [{
  type: 'document';
  id: string;
  title: string;
  outlineTokenEstimate: number;  // Outline, nicht Volltext
}]

// Chat-Screen State (nicht persistiert bis Turn gespeichert)
linkedDocumentId: string | null;
```

Persistiertes `linkedDocumentId` pro Talk optional in `talks.kontext_meta` (JSON), damit Verknüpfung Gespräch überdauert.

**Chat-Request** (wenn verknüpft, zusätzlich zu `message` / `mode` / `talk_id`): siehe [filo-arbeitstext-contract.md](./filo-arbeitstext-contract.md) §3 (`linked_document_id`, `document_outline`, `linked_document_content`).

### 6.1 Suchtreffer verknüpfen (📎 in KI-Suche)

**Status:** Design (Jul 2026), **nicht implementiert** — Ergänzung zu Phase G.

**Zweck:** Anders als Header-📎 (§ 6) — das einen Arbeitstext als **Chat-Instruktionskontext** bindet — baut das Suchtreffer-📎 die **Korpus-Verankerung** der Arbeitstext-Sammlung auf: jeder Treffer in **KI-Suche** bekommt ein 📎-Icon, das ein Popup mit bis zu vier Zielen öffnet:

```
Arbeitstext verknüpfen mit …
────────────────────────────
📌 Aktueller Chat — <Talk-Titel>
¶  Aktueller Absatz — <erste 5 Wörter>
📖 Aktuelles Kapitel — <Kapiteltitel>
📚 Aktuelles Buch — <Buchtitel>
```

**Konzeptioneller Unterschied Chat vs. Absatz/Kapitel/Buch:** Absatz/Kapitel/Buch bilden die **strukturierte Arbeitstext-Sammlung** entlang des Lesekorpus (gleiche vier Stufen wie § 5.1, ohne „Allgemein" — ein Suchtreffer hat immer einen Korpus-Bezug oder gar keinen). Chat ist der **Sonderfall**: er hängt keinen Arbeitstext an eine Korpus-Einheit, sondern an ein Gespräch — der Chat kann seinerseits jede der drei Korpus-Einheiten bearbeiten oder neu anlegen (§ 5.3.1).

**Sichtbarkeit je Eintrag** — ausblenden, **kein** generisches Fallback-Label, wenn die Datenquelle fehlt (ein Label ohne gültiges Ziel würde einen nicht-funktionalen Menüpunkt vortäuschen):

| Eintrag | Sichtbar wenn | Label-Quelle |
|---|---|---|
| **Aktueller Chat** | Navigation zur Suche kam **vom Chat-Tab** (`origin === 'chat'`) — nicht allein weil ein `activeTalkId` im Hintergrund existiert | `talks.title`, Fallback „Neues Gespräch" (Feld ist nullable) |
| **Aktueller Absatz** | `result.paragraph_id` vorhanden **und** kein `result.navigation_error` | erste 5 Wörter aus `result.text`/`snippet` (wie § 5.1 Zeile 1) |
| **Aktuelles Kapitel** | `result.source_id` **und** `result.segment_title`/`segment_slug` vorhanden | `segment_title` |
| **Aktuelles Buch** | `result.source_id` **und** `result.book_title` vorhanden | `book_title` |

**Wann fehlt „Aktueller Absatz" strukturell?** Treffer-Kinds ohne 1:1-Absatzbezug (`kapitel_zusammenfassung`, `begriff`, `typology`, `chunk_gespraech`, `notiz` — routen in `searchHitCard.ts` über `overlayNav()`, das nie `paragraph_id` liest) zeigen den Eintrag **nie**. Bei `chunk_buch`/`chunk_vortrag`/`zitat` (routen über `readNav()`/`quoteReadNav()`, die `paragraph_id` voraussetzen) kann er zusätzlich durch eine echte Datenlücke (`navigation_error`, unvollständiger Chunk) fehlen — Behandlung identisch: ausblenden.

**Ein Arbeitstext pro Einheit:** Vor dem Verknüpfen Lookup am Ziel (`paragraph_id` bzw. `source_id`+`segment_slug` bzw. `source_id`) über bestehende Arbeitstexte (`NoteRepository` / `arbeitstextContext.ts`-Klassifikation). Ist die Einheit bereits belegt: Dialog **„Vorhandenen öffnen"** vs. **„Ersetzen"** — nicht-destruktiv, „Ersetzen" löst nur die Verknüpfung am alten Ziel, löscht den Arbeitstext nicht (Arbeitstext bleibt in der Bibliothek, wie beim Loslösen in § 6).

**Komponente:** geteilte `AttachTargetSheet`, wiederverwendet von Header-📎 (§ 6, nur Chat-Fokus, bestehende `ArbeitstextLinkSheet`) und Suchtreffer-📎 (bis zu 4 Ziele, neu).

**Navigation-Origin (neu, existiert noch nicht):** Kein bestehender Mechanismus trackt, von welchem Tab aus KI-Suche geöffnet wurde. Nötig: leichter `origin`-Parameter (`'chat' | 'lesen' | 'buecher' | 'tab'`) — z. B. Route-Param beim Navigieren zur Suche, oder Context-Feld, das beim Tab-Wechsel zurückgesetzt wird.

**Cross-Tab „Aktueller Chat":** Verknüpfen aus KI-Suche heraus navigiert zurück zum Chat-Tab, analog zum bestehenden `onEditInChat` / `pendingLinkNoteId`-Pattern (§ 5.4).

---

## 7. Architektur-Entscheidungen

### 7.1 Streaming & RAG-Orchestrierung

**Entschieden (Juli 2026):** Filo nutzt **denselben RAG-Ablauf** wie der Assistenten-Chat (`assistant_chat_graph`), aber mit **App-Persistenz** und **App-Inputs**. Nicht der abgespeckte Pfad von `send_app_chat()` (nur `app_search`×4).

#### Problem heute: zwei parallele Chat-Gehirne

| Pfad | RAG | Persistenz | Für App? |
|---|---|---|---|
| `/agent/{slug}/chat/stream` | voll (LangGraph: Intent, Retrieval, Sufficiency, Citations) | LangGraph-Checkpoint (`thread_id`) | nein — kein Sync in WDB |
| `/app/chat` | reduziert (`app_search`, 4 Treffer, kein Graph) | `rag_talks`/`rag_turns` | ja — aber ohne `rag_references` |
| `/app/chat/stream` | **fehlt** | — | **Ziel** |

Der morphende Stopp-Knopf (§ 3) braucht SSE. Der Beitrags-Streifen im Lesen-Tab braucht `rag_references` ([ragapp-gesamtplan.md](./ragapp-gesamtplan.md)). Beides erfordert einen **neuen App-Endpunkt** — nicht den Agent-Endpunkt umbiegen.

#### Zielarchitektur: Graph-Kern teilen, Persistenz trennen

```
Client POST /app/chat/stream
  (message, talk_id, mode, model, context_mode, context_ids,
   document_outline, linked_document_id, …)
       ↓
assistant_chat_graph (oder extrahierte shared Pipeline)
  — Intent, Retrieval-Plan, Qdrant, Sufficiency, Antwort-Generierung
  — optional App-Tool-Runde (read_blocks / update_document, § 5.3.1)
       ↓
App-Adapter (app_chat_stream_service.py)
  — mappt Graph-Output → talks.create_talk_turn()
  — schreibt rag_references aus Citations
  — mappt SSE: status / token / done (App-Payload)
       ↓
rag_talks / rag_turns / rag_references  →  WDB Sync
```

**Was gleich bleibt** (wie Agent-Stream):
- Retrieval-Pipeline (`assistant_chat_graph` / shared Nodes)
- SSE während Retrieval: `status`-Events (z. B. „Suche Quellen…")
- Token-Streaming: `token`-Events
- Quellen im `done`-Event: `citations`, `confidence_score`, `intent`, `sufficiency`

**Was anders ist** (App-spezifisch):
- **Inputs:** `context_mode` + `context_ids` (Absatz/Kapitel/frei), `mode`, `model`, `document_outline`, Gesprächsverlauf aus `rag_turns` (nicht LangGraph-Checkpoint)
- **Persistenz:** `talk_id`/`turn_id` in `rag_talks`/`rag_turns`; Citations → `rag_references` (Pull-Sync → WDB `references`, Beitrags-Streifen)
- **Outputs im `done`:** zusätzlich `turn_id`, `talk_id`, `usage`, `context_meta` (§ 8.2.1), `tool_results` ([filo-arbeitstext-contract.md](./filo-arbeitstext-contract.md) §5–6)
- **Kein** `thread_id`-Checkpoint für die App — LangGraph-State ist Ephemera pro Request; kanonischer Verlauf liegt in `rag_turns`

**Explizit nicht:** `send_app_chat()` als Vorbild für Phase B beibehalten oder parallel weiter ausbauen. `/app/chat` (non-stream) wird nach Phase B auf **denselben Graph-Kern** umgestellt (Fallback bei SSE-Fehlern).

#### SSE-Eventformat (App)

Kompatibel mit Agent-Stream, erweitert für App:

| Event | Inhalt |
|---|---|
| `status` | `{ step, label }` — Retrieval-Fortschritt (wie Agent) |
| `token` | `{ content }` — Antwort-Token |
| `thinking` | optional `{ content }` — `reasoning_content` bei Thinking-Modellen |
| `done` | Agent-Felder (`citations`, `confidence_score`, …) **plus** `turn_id`, `talk_id`, `usage`, `context_meta`, `tool_results` |
| `error` | `{ message }` |

**RN-Client:** `react-native-sse` oder `fetch`+`ReadableStream` — nicht in `package.json`; Entscheidung vor Phase B (§11 Punkt 4).

**Abbrechen:** Client schließt die SSE-Connection (`AbortController`); bereits empfangene Tokens werden als Turn persistiert (`assistant_message` = Teilantwort, `usage` = `null` oder Schätzung).

#### Implementierungshinweise (ragrun)

- **Streaming-Transport:** `ChatOpenAI(streaming=True)` + `graph.astream_events()` aus `assistant_chat_graph.py` wiederverwenden — **nicht** separaten rohen `DeepSeekClient.chat_stream()`-Pfad parallel zum Graph bauen (§11 Punkt 2).
- **Adapter-Schicht:** `app/services/app_chat_stream_service.py` — orchestriert Graph-Lauf, SSE-Mapping, Persistenz; registriert in `app/api/app_api.py`.
- **Talk-Historie:** Prompt-Assembler (§ 7.3) lädt vor dem Graph-Lauf Turns aus `rag_turns` (gefiltert nach Compress-Grenze) in den Graph-State — ersetzt LangGraph-Checkpoint für Multi-Turn.
- **App-Tools:** Zusätzliche Tool-Runde **nach** RAG-Antwort oder im Graph integriert (max. 2 Runden, § 5.3.1) — ersetzen RAG **nicht**.

### 7.2 Modi → Modell-Routing

**Zwei Ebenen** (§ 4): Client sendet `mode` + aufgelöstes `model` aus User-Settings. `/app/chat/stream`-Adapter wertet beide aus:

- **`mode`** → Personality / System-Prompt
- **`model`** → `ChatOpenAI.model` bzw. `DeepSeekClient.model`
- **`mode`** → **`thinking.type`** (`chat` → `disabled`, `nachdenken` → `enabled`) — **nicht** über unterschiedliche Legacy-Alias-Namen (`deepseek-chat` / `deepseek-reasoner`, retired 2026-07-24)

**Ist-Stand ragrun (DeepSeek v4, erledigt):** `app/config.py` defaultet beide Env-Keys auf `deepseek-v4-flash`; `app/core/providers.py` unterscheidet Chat/Reasoner nur noch über `thinking_type`. LangGraph und Action-Prompt setzen `model_kwargs={"thinking": {"type": "disabled"}}` — Nachdenken-Modus im App-Chat erfordert Erweiterung von `_make_llm()` (Phase B/E). Langfristig: generische Auflösung über [llm-model-abstraction.md](./llm-model-abstraction.md) (`resolve(tier, model_id)`).

Legacy `app_chat_service.send_app_chat()` nutzt weiter `get_deepseek_chat()` (thinking off) — wird mit Graph-Kern-Migration obsolet.

Wenn `linkedDocumentId` gesetzt: zusätzlicher System-Prompt-Baustein „Arbeitstext-Editor" (`document_outline`, `read_blocks`, `update_document`).

### 7.3 Kontextfenster & Verdichten

- Limits als statische Map, z. B. `src/shared/lib/modelContextLimits.ts`: `{ 'deepseek-v4-flash': 1_000_000, 'deepseek-v4-pro': 1_000_000 }` (Kontextfenster; Max Output 384 000 — siehe §11 Punkt 4). Thinking-Modus ändert das Kontextfenster nicht — nur Latenz/Kosten. Legacy-Keys `deepseek-chat`/`deepseek-reasoner` nur noch in `pricing.json` für historische Usage-Zeilen.
- **Prompt-Assembler** (ragrun, für `/app/chat` und `/app/chat/stream`): baut die Nachrichtenliste aus allen verbleibenden Turns, sortiert nach `turn_index`. Verdichtung ersetzt Turns ≤ `compressed_up_to_turn_index` durch einen Compress-Block. Dieselbe Logik liefert `context_meta.effective_tokens` fürs `done`-Event und muss mit der Client-Anzeige übereinstimmen (§ 8.2).
- „Verdichten" braucht einen neuen Endpunkt `POST /app/chat/{talk_id}/compress` (unterscheidet sich von `summarize_app_talk()`: Summarize erzeugt eine Anzeige-Zusammenfassung, Compress erzeugt einen **Prompt-Ersatzblock**, der zukünftig anstelle der komprimierten Turns ans Modell geht). Neues Feld `rag_talks.compressed_up_to_turn_index` (Integer) markiert, ab welchem Turn wieder der volle Text mitgeschickt wird.

---

## 8. Datenmodell-Erweiterungen

### 8.1 `rag_talks` / WDB `talks`

| Neue Spalte | Typ | Zweck |
|---|---|---|
| `pinned` | boolean, default `false` | `true` = dauerhaft; `false` = Löschung nach 7 Tagen Inaktivität (§ 2) |
| `mode` | text/string, optional | zuletzt gewählter Modus (§ 4) |
| `compressed_up_to_turn_index` | integer, optional | Verdichtungs-Grenze (§ 7.3) |
| `compress_block` | text, optional | Prompt-Ersatz für verdichtete Turns (§ 7.3, § 8.2.1) |

### 8.2 `rag_turns` / WDB `turns`

Keine neue Spalte für MVP. Bearbeiten/Wiederholen **löscht** nachfolgende Turns (§ 3) — kein `superseded_at`.

**Truncate bei Edit/Wiederholen:** Client löscht lokal alle Turns mit `turn_index > k` (`TurnRepository.deleteAfterIndex` o. ä.), Sync propagiert Tombstones nach `rag_turns` (+ kaskadiert `references`). Optional Endpunkt `DELETE /app/chat/{talk_id}/turns?after_index={k}` für serverseitige Autorität.

#### 8.2.1 Effektiver Kontext & Kontextanzeige

Die Kontextanzeige (§ 2) und der Backend-Prompt-Assembler müssen **dieselbe Menge** tokenisieren.

| Bestandteil | In `effective_tokens`? |
|---|---|
| System-Prompt (Modus, Personality, ggf. Arbeitstext-Editor) | ja |
| `talks.compress_block` (falls gesetzt, ersetzt Turns ≤ `compressed_up_to_turn_index`) | ja |
| Verbleibende Turns (nach Compress-Grenze) — `user_message` + `assistant_message` | ja |
| `document_outline` (wenn `linked_document_id`) | ja |
| Rohtext über `read_blocks` (nur in laufender Tool-Runde) | nein in Anzeige (ephemer) |

**Ablauf Bearbeiten:** User editiert Turn *k* → Client löscht alle Turns mit `turn_index > k` (Sync) → Kontextanzeige sinkt sofort → neuer Request baut Prompt aus Turns ≤ *k* + neuem Turn.

**`usage` pro Turn:** Speichert die Kosten **dieses** API-Calls zum Zeitpunkt der Antwort. Wird **nicht** zur Kontextfüllung summiert (sonst Doppelzählung). Die Anzeige nutzt `context_meta.effective_tokens`, nicht `SUM(usage)`.

```typescript
// src/shared/lib/computeEffectiveContextTokens.ts (Client-Fallback)
function computeEffectiveContextTokens(talk: Talk, turns: Turn[], opts: {
  mode: ModeId;
  model: string;  // resolveModelForMode(mode, userSettings) — Limit aus modelContextLimits
  documentOutline?: DocumentOutline;
}): number {
  const ordered = turns.sort((a, b) => a.turnIndex - b.turnIndex);
  const afterCompress = talk.compressedUpToTurnIndex != null
    ? ordered.filter(t => t.turnIndex > talk.compressedUpToTurnIndex!)
    : ordered;
  return (
    estimateSystemPromptTokens(opts.mode, opts.documentOutline != null)
    + (talk.compressBlock ? estimateTokens(talk.compressBlock) : 0)
    + sumTurnTextTokens(afterCompress)
    + (opts.documentOutline ? estimateOutlineTokens(opts.documentOutline) : 0)
  );
}
```

**SSE `done`-Event (Erweiterung):**

```typescript
context_meta: {
  effective_tokens: number;   // = Anzeige im Header
  context_limit: number;      // aus modelContextLimits für aktuellen Modus
  turn_count: number;
}
```

**Später (nicht MVP):** `superseded_at` + sichtbare Verzweigungen **oder** „Gespräch kopieren" statt hartem Löschen (§ 3).

### 8.3 `app_notes` / WDB `notes` (Arbeitstexte)

| Neue Spalte | Typ | Zweck |
|---|---|---|
| `segment_slug` | text, optional, indexiert | Stabiler Kapitel-/Vortrags-Bezug (§ 5.1); analog `rag_paragraphs.segment_slug` |
| `turn_id` | text/uuid, optional | Herkunft aus Chat-Turn (Navigation, kein Scope) |
| `talk_id` | text/uuid, optional | Gesprächs-Link für Chip-Navigation |

`content` bleibt Typ `text`, enthält Markdown (§ 5.3). **Kontext-Bezug:** `source_id` + `segment_slug` + `paragraph_id` (§ 5.1). Konstante `MAX_DOCUMENT_CHARS = 50_000` in `src/shared/lib/documentLimits.ts` (Client) und Tool-Validierung (ragrun).

Migrationen: WDB v18 → v19 (`segment_slug`, `turn_id`, `talk_id` auf `notes`) + Supabase-Migration für `app_notes`. Optional: `segment_slug` auch auf WDB `paragraphs` spiegeln (Sync aus `rag_paragraphs`), damit Filter ohne Join aufgerufen werden kann. `rag_talks`/`rag_turns` (§ 8.1/8.2) zusätzlich ragrun-Alembic — Muster: `app/db/migrations/versions/0021_add_kontext_columns_to_rag_talks.py`.

---

## 9. Backend-Endpunkte (neu/geändert)

| Methode | Pfad | Status | Beschreibung |
|---|---|---|---|
| POST | `/app/chat/stream` | **neu** | SSE: `assistant_chat_graph`-Kern + App-Adapter → `rag_talks`/`rag_turns`/`rag_references` (§ 7.1) |
| POST | `/app/chat` | **Migration** | Fallback non-stream; nach Phase B auf **denselben Graph-Kern** wie `/stream` (ersetzt `send_app_chat`-Shortcut) |
| POST | `/app/chat/{talk_id}/compress` | **neu** | Verdichtung älterer Turns (§ 7.3) |
| PATCH | `/app/chat/{talk_id}` | **neu** | `pinned`, Titel, `mode` togglen |
| POST | `/app/chat/{talk_id}/summarize` | bereits vorhanden | unverändert |

**Hintergrund-Job:** Nächtlicher Cleanup unpinned Talks älter als 7 Tage (`app/jobs/cleanup_ephemeral_talks.py` o. ä., Cron auf ragrun-Host).

**Ergänzung SSE-Eventformat:** `done`-Event — [filo-arbeitstext-contract.md](./filo-arbeitstext-contract.md) §5 (`tool_results`, Legacy-Felder optional).

---

## 10. Phasenplan

Reihenfolge nach Risiko/Abhängigkeit — **gesamtübergreifende Reihenfolge und Meilensteine:** [filo-implementation-plan.md](./filo-implementation-plan.md). Phasen-Mapping ragapp ↔ ragrun: [filo-arbeitstext-contract.md](./filo-arbeitstext-contract.md) §7.

### Phase A — Navigation & Grundgerüst
- [x] Tab-Reihenfolge ändern: Filo auf Index 0, `TAB_INDEX_*`-Konstanten in `ReadingContext.tsx` anpassen (inkl. neuer `TAB_INDEX_OVERVIEW`-Konstante, bisher implizit 0)
- [x] `TabBar.TABS` neu sortieren
- [x] `_layout.tsx`: `setInitialPage`-Fallback und `handleTabPress` auf benannte Konstanten (`TAB_INDEX_READ`, `TAB_INDEX_OVERVIEW`)
- [x] `ChatScreen.tsx` → **FiloScreen** + CHAT / GESPRÄCHE / ARBEITSTEXTE
- [x] WEITERLESEN-Hinweis im Filo-Tab einblenden (`continueReadingLabel()` wiederverwenden)

### Phase B — Streaming-Backend & RAG-Vereinheitlichung
- [ ] **`app_chat_stream_service.py`:** App-Adapter — `assistant_chat_graph` + Talk-Historie aus `rag_turns` + App-Inputs (`context_mode`, `mode`, `model`, …); **`mode` → `thinking.type`** via `providers.py`-Semantik
- [ ] **`_make_llm()` erweitern:** `model` + `thinking_type` aus Request (heute fest `deepseek-v4-flash` + `thinking: disabled`)
- [ ] **SSE-Mapping:** `status` / `token` / `thinking` / `done` / `error` — Agent-Events + App-Felder (`turn_id`, `talk_id`, `context_meta`, `tool_results`)
- [ ] **Persistenz:** `talks.create_talk_turn()` + **`rag_references`** aus Graph-Citations (Beitrags-Streifen, Sync)
- [ ] **`POST /app/chat/stream`** in `app_api.py` (Auth wie `/app/chat`, SSE wie `/agent/.../stream`)
- [ ] **`/app/chat` auf Graph-Kern migrieren** (non-stream Fallback; `send_app_chat()` deprecaten/entfernen)
- [ ] RN-SSE-Client einführen (`react-native-sse` o. ä.), `ragrunApi.streamChat()` — parst `status`+`token`+`done`
- [ ] Morphender Senden/Stopp-Knopf in `ChatScreen.tsx` (`AbortController`, Teilantwort persistieren)
- [ ] Client: Citations aus `done` → Navigation Lesen-Tab (optional MVP: nur anzeigen)

### Phase C — Pin & Nacht-Cleanup
- [ ] `pinned`-Spalte (`rag_talks` + WDB `talks`), Default `false`
- [ ] `PATCH /app/chat/{talk_id}` für Pin-Toggle
- [ ] Header-Pin-Icon + Banner-Zeile
- [ ] Verlassen-Nachfrage bei ≥ 4 Turns in ungepinntem Chat
- [ ] Nacht-Cron: unpinned Talks mit `updated_at` > 7 Tage löschen

### Phase D — Kontext-Anzeige & Verdichten
- [ ] `modelContextLimits.ts` + Balken/Ring-Komponente im Header
- [ ] `computeEffectiveContextTokens.ts` (Client-Fallback; Compress berücksichtigen)
- [ ] Bottom Sheet „Kontextspeicher" (zeigt Aufschlüsselung: System / Compress / Turns / Outline)
- [ ] `context_meta` im SSE-`done`-Event (serverseitige Autorität)
- [ ] `POST /app/chat/{talk_id}/compress` + `compressed_up_to_turn_index`

### Phase E — Modi
- [ ] `chatModes.ts` + `chatModelSettings.ts` (`resolveModelForMode`, Defaults DeepSeek V4 Chat / V4 Thinking)
- [ ] Settings-UI in `einstellungen.tsx`: Modell für Chat · Modell für Nachdenken
- [ ] `[Modus ▾]` in Eingabezeile; `talks.mode` persistieren
- [ ] Chat-Request: `mode` + `model` (aus Settings); `/app/chat/stream` mappt `mode` → `thinking.type` + `model` (§ 7.2)
- [ ] System-Prompt „Arbeitstext-Editor" wenn `linkedDocumentId` gesetzt

### Phase F — Turn-Aktionen
- [ ] User-Turn-Menü: Bearbeiten (Truncate nachfolgender Turns), Kopieren, Wiederholen (Truncate)
- [ ] `TurnRepository.deleteAfterIndex` + Sync-Tombstones (ggf. `DELETE …/turns?after_index=`)
- [ ] Filo-Turn-Menü: Kopieren

### Phase G — Arbeitstexte
- [x] Schema-Migration `notes.segment_slug` (WDB v19 + Supabase `010_notes_segment_slug.sql`) — **erledigt**
- [x] `turn_id` / `talk_id` auf `notes` (WDB v20 + Supabase `011_notes_turn_talk.sql`)
- [x] `documentLimits.ts` — `MAX_DOCUMENT_CHARS = 50_000`
- [x] `documentTree.ts` — parse, outline, serialize, patch (Contract §2)
- [x] `ArbeitstexteScreen` (Bibliothek) + Kontext-Filter (§ 5.1) + Titelsuche + Sortierung + Aktionsmenü (Vorschau) + `DocumentMarkdownView` (keine Tabellen)
- [ ] Kontext-Filter: **Chip-Leiste → Dropdown rechts** mit dynamischen Zeilen (`Absatz <5 Wörter>`, `Kapitel <Titel>`, `Buch <Titel>`, `Allgemein`) — Plan-Ergänzung Jul 2026, § 5.1
- [x] `arbeitstextContext.ts` — `classifyArbeitstextContext`, `filterByContextTier`, Sortierung
- [x] Header-📎-Sheet: verknüpfen / neu (`ArbeitstextLinkSheet` in `ChatTab`)
- [x] `applyDocumentUpdate.ts`, `materializeDocument.ts`, `dispatchToolEffects` (`data/tools/index.ts`), `documentUndoStack`
- [x] **In Gespräch bearbeiten** aus Bibliothek → CHAT + 📎 verdrahten (`FiloScreen` → `ChatTab.linkNoteId`)
- [ ] `document_outline` + `linked_document_content` im Chat-Request; ragrun T1: Tool-Handler (Welle 4)
- [x] ragrun-Pytest-Fixture (Doppelmatrix, handgeschriebenes Excerpt, 2 Kapitel, ohne Tabellen) — `app/tools/app/read_blocks/tests/cases/doppelmatrix_excerpt.md` (2b.3, erledigt)
- [ ] ragapp: automatisierter Test für `documentTree.ts` (Parser/Outline/Serializer) und `DocumentMarkdownView` (Renderer) — **existiert noch nicht**, kein `__tests__`/`*.test.ts` im Repo (Klärung Jul 2026)
- [x] Reale Doppelmatrix (`ragkeep/.../doppelmatrix-gesund-und-krank_matritzen.md`) als **manuelles E2E-Testdokument** für Welle 4 gekürzt und formatgeprüft (29.220 Zeichen, unter `MAX_DOCUMENT_CHARS`) — Jul 2026
- [ ] Suchtreffer-📎 in KI-Suche: `AttachTargetSheet`, Navigation-Origin, „ein Arbeitstext pro Einheit"-Lookup + Ersetzen-Dialog (§ 6.1, Plan-Ergänzung Jul 2026)

### Phase H — Arbeitstext im Chat-Kontext
- [x] Arbeitstext-Chip unter Header (Titel, tap → Overlay) — `ChatTab`, chat-lokal
- [x] Preview-Overlay: gerendertes Markdown, Undo, Loslösen, ✏️ Bearbeiten — `DocumentPreviewOverlay`
- [x] Vollbild-Rohtext-Editor (aus Vorschau-Overlay ✏️) — `NoteEditorModal`
- [ ] `linkedDocumentId` in Talk-State / `talks.kontext_meta` (persistiert; heute nur lokaler State)
- [ ] „aktualisiert"-Chip nach Patch; Scroll zur geänderten Stelle im Overlay (Welle 4)

---

## 11. Offene Entscheidungen

1. **Pin & Cleanup (§ 2, § 8.1):** **Entschieden** — immer DB-Schreiben; `pinned` steuert Retention; Nacht-Cron löscht unpinned > 7 Tage.
2. **RAG-Orchestrierung (§ 7.1):** **Entschieden** — `/app/chat/stream` nutzt **`assistant_chat_graph`-Kern** (gleicher RAG wie Agent-Stream), **App-Adapter** für Persistenz (`rag_talks`/`rag_turns`/`rag_references`). **Nicht** den abgespeckten `send_app_chat()`-Pfad (`app_search`×4) weiter ausbauen. LangGraph-Checkpoint (`thread_id`) bleibt Agent-only; App-Verlauf kommt aus `rag_turns`.
3. **DeepSeek-Streaming:** **Bestätigt** — Transport über **`graph.astream_events()`** (bereits in `app/api/chat.py`), nicht separater roher `DeepSeekClient`-Stream. RN-Parser: (a) `delta.reasoning_content` → optionales `thinking`-Event; (b) fragmentierte `tool_calls` puffern falls App-Tools im Graph integriert werden; (c) `usage` aus letztem Chunk / `done`. Siehe auch [llm-model-abstraction.md](./llm-model-abstraction.md) Phase R3 (normalisierte SSE-Events).
4. **Kontextfenster-Werte:** **Korrigiert** — reale Limits laut DeepSeek-Doku: **1.000.000 Tokens Kontextfenster, 384.000 Tokens Max Output**. Der im Design genannte Platzhalter „200.000" war nicht nur falsch zugeordnet (Claude-Wert), sondern auch der reale DeepSeek-Wert liegt deutlich höher. `modelContextLimits.ts` (§7.3, Phase D) muss mit den realen Werten befüllt werden.
5. **RN-SSE-Bibliothek:** `react-native-sse` vs. Polyfill via `expo/fetch` — Entscheidung vor Phase B, abhängig von Expo-SDK-54-Kompatibilität.
6. **Markdown-Renderer:** eigener Renderer für `#`/`##`/`###`, Absätze, Listen — **keine Tabellen** im MVP.
7. **Arbeitstext-Patch:** Document Tree + `paragraph_id` / `heading_path`; automatische Übernahme (§ 5.6). **Entschieden:** keine Tabellen, kein `replace_all`.
8. **Arbeitstext-Maximalgröße:** **Entschieden** — 50 000 Zeichen Hard-Limit; ~10–12 000 Tokens Kontext-Budget (§ 5.3).
9. **Kontext-Bezug:** **Entschieden** — vier Stufen (Absatz · Kapitel · Buch · Allgemein) über `source_id` + **`segment_slug`** + `paragraph_id`; Filter als **Dropdown rechts** mit dynamischen Zeilen (§ 5.1); Sortierung in Tab ARBEITSTEXTE (§ 5.1, § 5.4). Kein Parsen von `segment_index` aus `paragraph_id`.
10. **Arbeitstext im Chat:** **Entschieden** — Header-📎, Chat vollflächig, Preview-Overlay auf Abruf; LLM-Zugriff **nur per Tools** (`read_blocks`, `update_document`, `create_document`); Kapitel/Unterkapitel über `#`/`##`/`###` ansprechbar (§ 5.3.1, § 6); kein Turn-Menü „In den Arbeitstext".
11. **Suchtreffer-📎 (§ 6.1):** **Entschieden** — eigenes 📎 pro Suchtreffer, Popup mit bis zu 4 Zielen (Chat/Absatz/Kapitel/Buch); fehlende Datenquelle → Eintrag **ausblenden**, kein generisches Fallback-Label; „Aktueller Chat" nur bei Navigation-Origin `chat`, nicht bei bloß aktivem `activeTalkId`; „ein Arbeitstext pro Einheit" mit nicht-destruktivem Ersetzen-Dialog. Offen: `AttachTargetSheet`-Implementierung, Navigation-Origin-Mechanismus.
12. **Test-Fixtures Document Tree (§ 5.3, Phase G):** **Geklärt** — zwei getrennte Zwecke, nicht verwechseln: (a) **ragrun-Pytest-Fixture** (`doppelmatrix_excerpt.md`, klein, handgeschrieben, 2 Kapitel) für `read_blocks`-Disambiguierung — **fertig** (2b.3); (b) **reale Doppelmatrix** (`ragkeep/.../doppelmatrix-gesund-und-krank_matritzen.md`) als **manuelles E2E-Testdokument** für Welle 4 — **geprüft und Format korrekt** (Jul 2026): einmalige `#`-Titelzeile, `##` Matrix der Gesundheit/Krankheit → `###` Feld 1–9 sauber verschachtelt, kein `---`/sonstiges Störelement, keine Tabellen, 29.220 Zeichen (unter `MAX_DOCUMENT_CHARS` 50.000). Hinweis bleibt: alle `### Feld N`-Titel sind textlich eindeutig, testet also reine Pfad-Auflösung, nicht Namens-Kollisions-Disambiguierung. **Offen (neu):** ragapp hat **keinen automatisierten Test** für `documentTree.ts`/`DocumentMarkdownView` — sollte ergänzt werden, ggf. mit einer gekürzten Version der realen Doppelmatrix als Fixture.
11. **Kontextanzeige & Edit/Wiederholen:** **Entschieden (MVP)** — Anzeige = effektiver nächster Prompt; `usage` pro Turn nicht summieren; Bearbeiten/Wiederholen **löscht** nachfolgende Turns (§ 2, § 3, § 8.2). **Später:** Gespräch kopieren.
12. **Bibliothek ARBEITSTEXTE:** **Entschieden** — Kontext-Filter als Dropdown rechts (`Absatz`/`Kapitel`/`Buch`/`Allgemein` + Snippet); Sortierung Kontext-Stufe + `updated_at`; Titelsuche; Tap → Aktionsmenü Vorschau / In Gespräch bearbeiten (§ 5.4).
13. **Freigabe (post-MVP):** nur `is_public` togglen vs. gezielte Freundesliste — offen.
14. **Gespräch kopieren (post-MVP):** Duplikat eines Gesprächs vor destruktivem Edit — Alternative zu `superseded_at`/Verzweigungs-UI (§ 3).
15. **Modell-Deprecation (2026-07-24):** **Erledigt in ragrun** — Defaults in `app/config.py` sind `deepseek-v4-flash`; Chat vs. Nachdenken läuft über `thinking.type` in `app/core/providers.py` und `app/infra/deepseek_client.py`. LangGraph/Action-Prompt setzen `thinking: disabled` explizit. **Offen für Filo Phase B/E:** `_make_llm()` modusabhängig machen; SSE `thinking`-Events bei `nachdenken`. **Offen in ragprep:** `DeepSeekService`/`constants.ts` nutzen teils noch Legacy-Alias-Namen (separater Migrations-Track, [llm-model-abstraction.md](./llm-model-abstraction.md)).
