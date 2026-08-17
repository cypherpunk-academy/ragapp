# Post-Stream Lifecycle: Vom letzten SSE-Token bis zum fertigen Turn

Dieses Dokument beschreibt jeden Schritt, der nach dem Ende des SSE-Streams
in `ChatTab.handleSend` passiert, und welche React-State-Änderungen und
Seiteneffekte dabei auftreten.

---

## Beteiligte Komponenten

| Komponente | Rolle |
|---|---|
| **ChatTab** (`src/features/chat/ChatTab.tsx`) | Verwaltet `turns`, `streamingText`, `pendingUserMessage`, `sending` |
| **FiloScreen** (`src/features/chat/FiloScreen.tsx`) | Besitzt `activeTalkId` (State), gibt es als Prop an ChatTab |
| **ReadingContext** (`src/shared/contexts/ReadingContext.tsx`) | Stellt `chatTalkId`, `chatPendingLinkNoteId`, `chatPendingParagraphId` bereit |
| **WatermelonDB Observer** | `TurnRepository.observeByTalk(activeTalkId)` — liefert Turns reaktiv |
| **runSync()** (`src/data/lib/sync.ts`) | WatermelonDB `synchronize()` — Pull/Push gegen ragrun |

---

## Ausgangszustand beim Streaming

Während des Streamings:

```
activeTalkId    = null               (neues Gespraech) ODER <uuid> (bestehendes)
sending         = true
pendingUserMessage = "User-Text"     (zeigt User-Bubble im ListFooterComponent)
streamingText   = "Philo antwortet…" (zeigt Philo-Bubble im ListFooterComponent)
turns           = []                 (neues Gespraech) ODER [Turn, Turn, …]
```

**UI-Rendering waehrend Streaming:**
- `FlatList.data = turns` — zeigt bisherige Turns
- `ListFooterComponent` rendert wenn `pendingUserMessage` truthy:
  - User-Bubble mit `pendingUserMessage`
  - Philo-Bubble mit `streamingText` (oder ActivityIndicator + Status)
- `ListEmptyComponent` rendert NUR wenn `turns` leer UND `pendingUserMessage` null

---

## Schritt-fuer-Schritt: `done`-Event bis `finally`

### 1. `done`-Event empfangen (Zeile 583)

```typescript
} else if (event.type === 'done') {
```

Das `done`-Event enthaelt:
- `talk_id` — UUID des Gespraechs (vom Server erzeugt)
- `turn_id` — UUID des Turns
- `assistant_message` — vollstaendige Antwort
- `citations` — Quellen-Referenzen
- `tool_results` — Ergebnisse der Tool-Loop (create_document, update_document)
- `context_meta` — Token-Nutzung
- `confidence_score`, `intent`, `sufficiency`

### 2. Context-Meta setzen (Zeile 584)

```typescript
setContextMeta(event.context_meta);
```

State-Update: `contextMeta` wird gesetzt (fuer Token-Anzeige im Header).

### 3. Neues Gespraech: activeTalkId setzen (Zeile 585-589)

```typescript
const isNewTalk = !activeTalkId;  // Closure-Wert aus handleSend-Erstellung
if (isNewTalk) {
    onActiveTalkChange(event.talk_id);  // → FiloScreen.setActiveTalkId(talk_id)
}
```

**Kritischer Schritt fuer neue Gespraeche:**
- `onActiveTalkChange` ruft `FiloScreen.setActiveTalkId(talk_id)` auf
- React queued State-Update: `activeTalkId: null → <uuid>`
- **React rendert NICHT sofort** — wir sind in einer async Funktion
- React flusht den Update erst beim naechsten `await` oder Render-Opportunity

**Folge-Effekte die NACH dem Render laufen:**
- `useEffect([activeTalkId])` in FiloScreen — loggt die Aenderung
- `useEffect([activeTalkId])` in ChatTab (Zeile 395-410) — **subscribed neuen Observer**:

```typescript
useEffect(() => {
    if (!activeTalkId) { setTurns([]); return; }
    const sub = TurnRepository.observeByTalk(activeTalkId).subscribe((list) => {
        setTurns(sorted);
    });
    return () => sub.unsubscribe();
}, [activeTalkId]);
```

- Der Observer emittiert sofort `[]` (noch keine Turns in DB)
- `setTurns([])` wird aufgerufen (war schon `[]`, keine sichtbare Aenderung)

### 4. Streaming-Status auf "Speichern" (Zeile 593)

```typescript
setStreamingStatus(t('chat.statusSaving'));
```

UI zeigt "Speichern…" statt der Streaming-Antwort-Bubble.

### 5. WatermelonDB Sync (Zeile 594)

```typescript
const syncResult = await runSync();
```

**Dies ist der erste `await` nach den State-Updates aus Schritt 2-4.**
React flusht jetzt die gepufferten State-Updates und rendert.

**Was `runSync()` intern tut:**
1. `await ensureSeeded()` — stellt sicher, dass Seed-Daten geladen sind
2. `await withSynchronizeLock(...)` — serialisiert mit anderen Syncs
3. `await synchronize({ pullChanges, pushChanges })`:
   - **pullChanges**: `POST /app/sync/pull` an ragrun
     - ragrun leitet an Supabase `pull_changes` RPC weiter
     - Antwort enthaelt `app_talks.created` + `app_turns.created` mit dem neuen Talk/Turn
   - **pushChanges**: `POST /app/sync/push` an ragrun
     - Schickt lokale Aenderungen (z.B. Bookmarks) zum Server
4. WatermelonDB wendet die Aenderungen in `database.write()` an
5. Collection-Observer werden benachrichtigt

**Timing-Problem:**
- Die Observer-Benachrichtigung in WatermelonDB ist **asynchron**
- Der Observer aus Schritt 3 muesste jetzt `[Turn]` emittieren → `setTurns([turn])`
- ABER: ob dies VOR oder NACH `runSync()` resolved passiert, ist nicht garantiert

### 6. Eagerly Turns laden (Zeile 598-599)

```typescript
const syncedTurns = await TurnRepository.findAllByTalk(event.talk_id);
if (syncedTurns.length > 0) setTurns(syncedTurns);
```

**Absicherung gegen Timing-Problem:**
- Laedt Turns direkt aus der DB (synchrone Query, nicht Observer)
- Setzt `turns` explizit, damit sie sicher vorhanden sind
- Der Observer feuert spaeter nochmal mit denselben Daten (harmlos)

### 7. Pending Arbeitstext verknuepfen (Zeile 600-604)

```typescript
if (isNewTalk && pendingAttachNote) {
    await NoteRepository.attachToTalk(pendingAttachNote, event.talk_id);
    await TalkRepository.setKontextMeta(event.talk_id, { note_id: pendingAttachNote.id });
    setPendingAttachNote(null);
}
```

Nur bei neuem Gespraech + vorgemerkter Note: verknuepft die Note mit dem Talk.
Schreibt in WatermelonDB (`database.write()`).

### 8. Tool-Effects dispatchen (Zeile 606-636)

```typescript
const effects = await dispatchToolEffects(event, { ... });
```

Verarbeitet `event.tool_results[]`:
- `suggested_document` → `materializeDocument()` — erstellt neue Note in WatermelonDB
- `suggested_document_update` → `applyDocumentUpdate()` — patcht bestehende Note

**Danach:**
- `effects.updatedNote` → zeigt "Arbeitstext aktualisiert"-Chip
- `effects.updateFailed` → Alert "Nicht geaendert"
- `effects.paragraphOccupied` → Alert mit Link-Option
- `effects.createdNote ?? linkedNote` → verknuepft Note mit Talk

Jeder dieser Schritte kann `database.write()` aufrufen (WatermelonDB-Schreib-Aktion).

### 9. Zweiter Sync (Fire-and-Forget) (Zeile 637)

```typescript
void runSync();
```

Startet einen zweiten Sync im Hintergrund:
- Pusht die lokalen Aenderungen aus Schritt 7+8 (Note-Verknuepfungen, neue Notes)
- Pullt ggf. weitere Server-Aenderungen
- Ergebnis wird NICHT abgewartet

### 10. Stream-Loop verlassen (Zeile 638)

```typescript
break;
```

Verlässt die `for await`-Schleife. Kein weiteres SSE-Event wird verarbeitet.

### 11. finally-Block (Zeile 678-686)

```typescript
finally {
    clearConnectingTimer();
    abortControllerRef.current = null;
    setSending(false);              // ← Sending-Indikator aus
    setPendingUserMessage(null);    // ← User-Bubble im Footer weg
    setStreamingText('');           // ← Streaming-Antwort weg
    setStreamingStatus(null);       // ← Status-Text weg
    setConnectingVisible(false);    // ← "Verbinde…" weg
}
```

**Kritisch:** Nach diesem Block zeigt die UI:
- `FlatList.data = turns` — muss die Turns enthalten!
- `ListFooterComponent = null` (weil `pendingUserMessage` null)
- `ListEmptyComponent` rendert wenn `turns` leer UND `pendingUserMessage` null

**Wenn `turns` zu diesem Zeitpunkt leer ist → leerer Chat (der Bug!)**

---

## React-Render-Reihenfolge (vereinfacht)

```
handleSend closure laeuft:
│
├─ onActiveTalkChange(talk_id)     ← queued: FiloScreen.activeTalkId = talk_id
├─ setStreamingStatus("Speichern") ← queued: streamingStatus
│
├─ await runSync()
│   │
│   ├─ [React flusht State-Updates, rendert]
│   │   ├─ FiloScreen rendert mit activeTalkId = talk_id
│   │   ├─ ChatTab rendert mit neuem activeTalkId Prop
│   │   └─ useEffect([activeTalkId]) → Observer subscribed (emittiert [])
│   │
│   ├─ synchronize() → Pull → DB-Write → Observer-Notification (ASYNC!)
│   │   └─ Observer emittiert [Turn] → setTurns([turn]) (WANN genau?)
│   │
│   └─ runSync() resolved
│
├─ findAllByTalk() → setTurns(syncedTurns)  ← EXPLIZITE Absicherung
├─ dispatchToolEffects() → DB-Writes
├─ void runSync()  ← Fire-and-Forget
├─ break
│
└─ finally:
    ├─ setSending(false)
    ├─ setPendingUserMessage(null)   ← Footer-Bubbles verschwinden
    ├─ setStreamingText('')
    └─ [React rendert → FlatList zeigt turns]
```

---

## Moegliche Ursachen fuer den Reset-Bug

### Hypothese A: Observer-Timing (teilweise behoben)

Der WatermelonDB Observer feuert asynchron nach `runSync()`.
Zwischen `runSync()` resolved und Observer-Emission ist `turns` leer.
→ Behoben durch explizites `findAllByTalk()` nach Sync.
→ **Aber der Bug tritt weiterhin auf!**

### Hypothese B: activeTalkId wird zurueckgesetzt

Drei Effects in FiloScreen setzen `activeTalkId` auf `null`:

1. **chatPendingLinkNoteId** (Zeile 101-108):
   ```typescript
   useEffect(() => {
       if (chatPendingLinkNoteId) {
           setActiveTalkId(null);  // ← RESET!
           ...
       }
   }, [chatPendingLinkNoteId, consumeChatPendingLink]);
   ```

2. **chatPendingParagraphId** (Zeile 112-119):
   ```typescript
   useEffect(() => {
       if (chatPendingParagraphId) {
           setActiveTalkId(null);  // ← RESET!
           ...
       }
   }, [chatPendingParagraphId, consumeChatPendingParagraph]);
   ```

3. **chatTalkId** (Zeile 89-96):
   Setzt `activeTalkId` auf einen anderen Wert (nicht null, aber ueberschreibt).

**Frage:** Kann `runSync()` oder `dispatchToolEffects()` eine Aenderung im
ReadingContext ausloesen, die `chatPendingLinkNoteId` oder `chatPendingParagraphId`
truthy macht?

### Hypothese C: Komponente remountet

Wenn `FiloScreen` unmountet und remountet, verliert es ALL seinen State:
- `activeTalkId` → `null`
- `turns` → `[]`
- Alles zurueck auf Anfang

Moegliche Ursache: `useAuth()` in FiloScreen liefert kurzzeitig
`isAuthenticated = false`, was den Content-Bereich unmountet:

```tsx
{!authLoading && !isAuthenticated ? (
    <LoginGate />     // ← ChatTab ist NICHT gemountet
) : (
    <Content />       // ← ChatTab IS gemountet
)}
```

Ein Token-Refresh durch Supabase koennte `isAuthenticated` kurzzeitig
auf `false` setzen → ChatTab unmountet → remountet → State weg.

### Hypothese D: handleNeuerChat wird unbeabsichtigt aufgerufen

```typescript
const handleNeuerChat = useCallback(() => {
    if (sending) return;
    setInputText('');
    setPendingAttachNote(null);
    setContextParagraph(null);
    onLinkedNoteChange?.(null);
    onActiveTalkChange(null);  // ← RESET!
}, [sending, onActiveTalkChange, onLinkedNoteChange]);
```

Wird an den "Neuer Chat"-Button gebunden. Koennte durch einen
Touch-Event unbeabsichtigt ausgeloest werden — aber unwahrscheinlich,
weil `sending = true` den Guard blockt. ABER: im `finally`-Block wird
`setSending(false)` gesetzt, und wenn React den Button-Press danach
verarbeitet, waere der Guard offen.

---

## Diagnose-Logging (aktuell eingebaut)

In `FiloScreen.tsx`:

```typescript
// Mount/Unmount
useEffect(() => {
    console.warn('[FiloScreen] MOUNTED');
    return () => console.warn('[FiloScreen] UNMOUNTED');
}, []);

// activeTalkId Tracker
useEffect(() => {
    console.warn('[FiloScreen] activeTalkId =', activeTalkId);
}, [activeTalkId]);

// Effect-Logging fuer chatTalkId, chatPendingLinkNoteId, chatPendingParagraphId
```

**Erwartete Ausgabe bei Bug-Reproduktion:**

```
[FiloScreen] activeTalkId = null           ← App-Start
[FiloScreen] activeTalkId = <uuid>         ← Done-Event
[FiloScreen] activeTalkId = null           ← BUG: wer setzt zurueck?
```

Oder:

```
[FiloScreen] UNMOUNTED                     ← BUG: Komponente remountet
[FiloScreen] MOUNTED
[FiloScreen] activeTalkId = null           ← Frischer State
```
