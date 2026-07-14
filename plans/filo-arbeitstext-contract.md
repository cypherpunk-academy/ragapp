# Filo — Arbeitstext-Tools (Contract)

**Status:** Entwurf (Single Source of Truth für ragapp ↔ ragrun)  
**Bezug:** [filo-implementation-plan.md](./filo-implementation-plan.md) (Umsetzungsreihenfolge) · [filo-chat-ui-design.md](./filo-chat-ui-design.md) (UX) · [ragrun-app-tools-architecture.md](../../ragrun/plans/ragrun-app-tools-architecture.md) (Backend-Implementierung)

Dieses Dokument definiert **Verträge**, die beide Repos identisch implementieren müssen. UX-Details → Filo-Plan. Registry, Handler, Tests → Tools-Plan.

---

## 1. Invarianten

| Regel | Bedeutung |
|---|---|
| **ragrun schreibt nicht in `app_notes`** | Tools mit `execution: client` liefern Vorschläge im SSE-`done`-Event |
| **ragapp materialisiert lokal** | `NoteRepository` + WDB → Supabase-Sync |
| **Outline im Prompt, Volltext on demand** | `document_outline` geht ans Modell; voller Absatz/Abschnitt nur via `read_blocks` |
| **Automatische Übernahme** | Kein „Übernehmen?"-Chip — Client patcht sofort nach `done` |
| **Max. 2 Tool-Runden** | Pro User-Message (meist reicht Outline ohne `read_blocks`) |
| **Keine Tabellen im MVP** | Nur `#` / `##` / `###`, Absätze, Listen |

---

## 2. Document Tree

**Implementierung:** `ragapp/src/data/lib/documentTree.ts` (parse, outline, serialize, patch).

### 2.1 Parsing-Regeln

| Element | Regel |
|---|---|
| `#` | Dokumenttitel (genau eine Zeile) |
| `##` | Kapitel / Hauptabschnitt |
| `###` | Unterabschnitt |
| **Absatz** | Textblock unter Überschrift, getrennt durch Leerzeile(n) |
| **Listen** | `1.` / `-` als Teil des Absatzes oder eigener Block |
| **Tabellen** `\|…\|` | Nicht unterstützt — Parser ignoriert oder warnt |

### 2.2 Adressen

```typescript
type ParagraphId = string;   // z. B. "ch1.p2" — nach jedem Patch neu parsen
type HeadingPath = string[]; // z. B. ["## Kapitel 2: …", "### Feld 1 — Geist → Recht"]
```

`paragraph_id` wird beim Parse aus Position abgeleitet (`ch{index}.p{n}`). Nach jedem Patch: Tree neu parsen → IDs können sich verschieben → **aktueller Outline** in jedem Request.

### 2.3 Limits

- `MAX_DOCUMENT_CHARS = 50_000` — Hard-Limit Client + Tool-Validierung (ragrun)
- Kontext-Budget grob **10–12 000 Tokens** (~4 Zeichen/Token)
- **Preview** in Outline: erste ~80 Zeichen pro Absatz (Whitespace normalisiert)

---

## 3. Chat-Request (`POST /app/chat/stream`)

Felder **zusätzlich** zu `message`, `talk_id`, `mode`, `model`, `context_mode`, `context_ids`:

```typescript
{
  // Nur wenn Arbeitstext verknüpft:
  linked_document_id?: string;
  document_outline?: DocumentOutline;
  linked_document_content?: string;  // voller Markdown — für read_blocks-Handler, NICHT in LLM-Prompt
}

type DocumentOutline = {
  title: string;           // aus `#`-Zeile
  sections: Array<{
    heading: string;
    paragraphs: Array<{ id: string; preview: string }>;
    children: Array<{
      heading: string;
      paragraphs: Array<{ id: string; preview: string }>;
    }>;
  }>;
};
```

**Wichtig:** `linked_document_content` ist der Rohtext aus `notes.content`. Er geht **nicht** in den initialen LLM-Prompt, sondern steht dem ragrun-Handler (`ToolContext.document_content`) für `read_blocks` zur Verfügung. Ohne verknüpftes Dokument entfallen alle drei Felder.

---

## 4. MVP-Tools

| Tool-ID | `execution` | Wann verfügbar | `result_key` |
|---|---|---|---|
| `create_document` | client | Kein `linked_document_id` | `suggested_document` |
| `read_blocks` | client | `linked_document_id` gesetzt | `document_blocks` |
| `update_document` | client | `linked_document_id` + Outline | `suggested_document_update` |

`read_blocks` schreibt **nicht** in die DB — liefert Volltext ans Modell (interne Tool-Runde).

### 4.1 `create_document`

**Args (Modell):**

```json
{ "title": "Meine Dreigliederung-Erklärung", "content": "# Meine …\n\n## Einleitung\n\n…" }
```

**Payload (`suggested_document`):**

```json
{
  "title": "Meine Dreigliederung-Erklärung",
  "content": "# Meine …\n\n## Einleitung\n\n…",
  "summary_for_chat": "Neuer Arbeitstext angelegt."
}
```

**Client:** `materializeDocument.ts` → `NoteRepository.create` + optional verknüpfen.

### 4.2 `read_blocks`

**Args (Modell):**

```json
{
  "addresses": [
    { "paragraph_id": "ch1.p2" }
  ]
}
```

oder Abschnitt:

```json
{
  "addresses": [
    { "heading_path": ["## Kapitel 1: Die Grundidee"] }
  ]
}
```

**Payload (`document_blocks`):**

```json
{
  "blocks": [
    { "paragraph_id": "ch1.p2", "content": "Krank wird er in dem Moment, in dem …" }
  ]
}
```

**Server:** extrahiert aus `ToolContext.document_content` (= `linked_document_content`).

### 4.3 `update_document`

**Args (Modell):**

```json
{
  "operation": "update_paragraph",
  "paragraph_id": "ch1.p2",
  "content": "…",
  "summary_for_chat": "Absatz in Kapitel 1 überarbeitet."
}
```

| `operation` | Parameter | Client `applyDocumentUpdate` |
|---|---|---|
| `update_paragraph` | `paragraph_id`, `content` | Ein Absatz ersetzen |
| `update_section` | `heading_path`, `content` | Block unter Überschrift bis gleiche/höhere Ebene |
| `update_heading` | `heading_path`, `content` | Überschrift umbenennen |
| `insert_paragraph_after` | `paragraph_id`, `content` | Neuer Absatz danach |
| `delete_paragraph` | `paragraph_id` | Absatz entfernen |

**Payload (`suggested_document_update`):**

```json
{
  "document_id": "uuid",
  "operation": "update_paragraph",
  "paragraph_id": "ch1.p2",
  "heading_path": null,
  "content": "Krank wird der Organismus, wenn …",
  "summary_for_chat": "Absatz in Kapitel 1 überarbeitet."
}
```

**Nicht im MVP:** `replace_all`, Tabellen-Operationen, Ganzdokument-Patch.

**Disambiguierung:** Doppelte `###`-Titel nur über vollständiges `heading_path` mit Parent-`##`.

---

## 5. SSE — `done`-Event

```json
{
  "type": "done",
  "turn_id": "...",
  "talk_id": "...",
  "usage": { "prompt_tokens": 1200, "completion_tokens": 400 },
  "assistant_message": "Ich habe den Abschnitt ergänzt …",
  "tool_results": [
    {
      "tool_id": "update_document",
      "result_key": "suggested_document_update",
      "payload": { }
    }
  ]
}
```

**Client-Mapping:**

| `result_key` | ragapp-Modul | DB-Write |
|---|---|---|
| `suggested_document` | `materializeDocument.ts` | ja (`NoteRepository.create`) |
| `suggested_document_update` | `applyDocumentUpdate.ts` | ja (`NoteRepository.update`) |
| `document_blocks` | — | nein (nur Modell-Kontext) |

**Abwärtskompatibel:** Top-Level `suggested_document` / `suggested_document_update` optional parallel bis Client migriert.

**Client-Einstieg:** `dispatchToolEffects(doneEvent)` in `ragapp/src/data/tools/index.ts`.

---

## 6. Stream-Ablauf

```
Client POST /app/chat/stream
  (message, mode, model, talk_id, context_*, linked_document_id,
   document_outline, linked_document_content)
       ↓
app_chat_stream_service (ragrun)
  1. Talk-Historie aus rag_turns (Prompt-Assembler)
  2. assistant_chat_graph.astream_events() — RAG + Antwort
     → SSE: status, token, thinking (optional)
  3. App-Tool-Runde (max. 2): registry → read_blocks / update_document / create_document
  4. Persistenz: talks.create_talk_turn() + rag_references
  5. SSE: done { turn_id, talk_id, usage, context_meta, citations, tool_results, … }
       ↓
ragapp: dispatchToolEffects → NoteRepository → Sync
```

---

## 7. Phasen-Mapping (Filo ↔ ragrun)

**Gesamtreihenfolge & Meilensteine:** [filo-implementation-plan.md](./filo-implementation-plan.md) §5–6.

| Filo (ragapp) | ragrun | Deliverable |
|---|---|---|
| — | **T0** | Registry-Gerüst (`app/tools/`) |
| Phase B | **T2** (Stream) | `/app/chat/stream`, SSE, `tool_results`-Hook (Tools können leer sein) |
| Phase G | **T1** | `documentTree.ts` + Handler unit-tested |
| Phase H | **T2** | Tool-Loop live; 📎 + verknüpfter Chat |
| Phase C | — | Pin/Cleanup (nicht Tools — aus T2-Checkliste entfernt) |

**Parallele Arbeit möglich:** Filo Phase A (Navigation) + ragrun T0/T1 unabhängig von Phase B.

---

## 8. Offene Entscheidungen

1. **LLM-API:** DeepSeek function calling (`tools` im Request) vs. structured JSON im `done`-Event — vor ragrun T2 klären.
2. **Tool-Loop-Position:** Nach RAG-Antwort (aktueller Plan) vs. im Graph integriert — MVP: nach RAG.

---

## 9. Referenzen

- UX: [filo-chat-ui-design.md](./filo-chat-ui-design.md) §5–6, §10 Phase G/H
- Backend: [ragrun-app-tools-architecture.md](../../ragrun/plans/ragrun-app-tools-architecture.md)
- Architekturgrenze `app_notes`: [NOTIZEN_ANALYSE.md](./NOTIZEN_ANALYSE.md) §2
