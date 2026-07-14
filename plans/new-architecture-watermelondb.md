# Plan: New Architecture mit WatermelonDB (ragapp)

**Stand:** Juli 2026  
**Ziel:** ragapp auf React Natives New Architecture (Fabric + TurboModules) umstellen — **ohne** Wechsel der Sync-Architektur, **ohne** SDK-Upgrade (vorerst auf Expo SDK 54 / RN 0.81.5 bleiben).  
**Kontext:** SDK 54 ist die letzte Version mit optionalem Legacy-Opt-out. SDK 55+ erzwingt New Architecture. WatermelonDB ist offiziell auf NA „untested“, läuft in der Community aber mit Workarounds auf SDK 54.

**Verwandte Docs:** [ragapp-gesamtplan.md](./ragapp-gesamtplan.md) · [ragapp-react-native-architecture.md](./ragapp-react-native-architecture.md) · [ARCHITECTURE.md](../ARCHITECTURE.md)

---

## 1. Ausgangslage

| Komponente | Ist-Zustand |
|---|---|
| Expo SDK | 54 (`expo@~54.0.33`) |
| React Native | 0.81.5 |
| React | 19.1.0 |
| New Architecture | `newArchEnabled: false` in `app.config.ts` |
| iOS Prebuild | Kein `ios/`-Ordner im Repo (noch kein Prebuild gelaufen) — mögliche Inkonsistenz zwischen `app.config.ts` und `ios/Podfile.properties.json` erst nach Prebuild prüfbar (siehe Phase 1) |
| Android | Kein `android/`-Ordner im Repo (Prebuild bei Bedarf) |
| Dev-Workflow | `expo start --dev-client` (kein Expo Go als Primärweg) |
| WatermelonDB | `0.27.1`, `SQLiteAdapter`, **`jsi: false`** |
| Lokales Schema | v18, 8 Tabellen (`sources`, `paragraphs`, `notes`, `bookmarks`, `talks`, `turns`, `references` + intern) |
| Sync | Watermelon `synchronize()` → ragrun `/app/sync/pull|push` → Supabase-RPCs |
| Reaktivität | Repositories mit `.observe()` in Read, Overview, Chat, Contributions, Notes |

**Warum jetzt planen:** NA-Test auf SDK 54 ist der empfohlene Migrationspfad (Expo/RN). Späteres SDK-55+-Upgrade ohne NA-Validierung wäre ein Big-Bang.

---

## 2. Strategie (zwei Stufen)

```
Stufe A — NA aktivieren, WatermelonDB stabil (jsi: false)
    ↓ Go/No-Go
Stufe B — Optional: JSI aktivieren (Performance)
    ↓ Go/No-Go
Stufe C — Später: SDK 55+ Upgrade (NA dann Pflicht)
```

**Prinzipien:**

1. **Nur eine Variable pro Schritt** — erst NA, dann ggf. JSI, dann SDK-Upgrade.
2. **Repository-Layer unangetastet** — Screens/Hooks bleiben; Änderungen in Config, Native, `database.ts`.
3. **Rollback jederzeit** auf SDK 54 + `newArchEnabled: false`, solange wir bei SDK 54 bleiben.
4. **Kein Sync-/Backend-Umbau** — `pull_changes`/`push_changes` und Seed-Snapshot bleiben.

---

## 3. Abhängigkeiten & Kompatibilität

| Package | Version | NA-Einschätzung |
|---|---|---|
| `@nozbe/watermelondb` | 0.27.1 → ggf. **0.28.0** | Community-NA-Setup nötig; 0.28.x enthält Bridgeless-Fixes (#1769) |
| `expo-sqlite` | ~16.0.10 | SDK-54-kompatibel; Watermelon nutzt eigenen SQLite-Adapter, nicht direkt expo-sqlite |
| `@shopify/flash-list` | 2.0.2 | NA-first — ReadScreen profitiert |
| `react-native-screens` | ~4.16.0 | NA-ready |
| `react-native-gesture-handler` | ~2.28.0 | NA-ready |
| `react-native-pager-view` | 6.9.1 | NA-ready (Tabs) |
| `react-native-reanimated` | ~4.1.1 | NA-ready; in App-Code aktuell nicht importiert |
| `react-native-worklets` | 0.5.1 | Reanimated-4-Peer-Dependency (Worklets-Runtime); NA-Kompatibilität an Reanimated gekoppelt |
| `@babel/plugin-proposal-decorators` | legacy: true | **Pflicht** für WatermelonDB-Modelle — unabhängig von NA |

**Community-Plugin (NA + Expo):** `@morrowdigital/watermelondb-expo-plugin` — patcht native Build-Konfiguration für WatermelonDB unter Expo Prebuild. Offiziell „untested“, in SDK-54-Setups bewährt.

---

## 4. Phasenplan

### Phase 0 — Baseline festhalten (0,5 Tag)

**Ziel:** Reproduzierbarer Ist-Zustand, bevor NA aktiviert wird.

- [ ] Branch `feat/new-architecture` anlegen
- [ ] Old-Arch-Dev-Build auf iOS **und** Android bauen, Kurz-Checkliste abhaken (siehe §6)
- [ ] Screenshots / kurzes Screen-Recording von Read-Tab (Scroll) als Referenz
- [ ] `npx expo-doctor` ausführen, Warnungen dokumentieren
- [ ] Inkonsistenz notieren: `app.config.ts` vs. `ios/Podfile.properties.json`

**Artefakt:** Baseline-Checkliste mit Datum und Geräten.

---

### Phase 1 — New Architecture aktivieren (0,5–1 Tag)

**Ziel:** NA in Config und nativen Projekten konsistent einschalten.

#### 1.1 Config

```ts
// app.config.ts
newArchEnabled: true,
```

#### 1.2 Native neu generieren

```bash
npx expo prebuild --clean
```

- `ios/Podfile.properties.json` und `android/gradle.properties` prüfen: `newArchEnabled=true`
- iOS: `cd ios && pod install`
- Dev Client neu bauen:
  ```bash
  npx expo run:ios
  npx expo run:android
  ```

#### 1.3 Verifikation (ohne Watermelon-Änderungen)

- [ ] App startet ohne roten Screen
- [ ] Metro verbindet sich mit Dev Client
- [ ] Auth-Screen / Tab-Navigation sichtbar
- [ ] PagerView-Tabs wischbar

**Rollback:** `newArchEnabled: false` → `expo prebuild --clean` → Dev Client neu bauen.

---

### Phase 2 — WatermelonDB für NA fit machen (1–2 Tage)

**Ziel:** Lokale DB und Sync unter NA stabil — zunächst mit `jsi: false`.

#### 2.1 WatermelonDB-Version

- [ ] Auf `0.28.0` prüfen/upgraden (Bridgeless-Fixes, JSI-Build-Fixes)
- [ ] Changelog + Breaking Changes lesen
- [ ] `@nozbe/with-observables` nur falls später benötigt — aktuell nicht im Einsatz

#### 2.2 Expo Config Plugin

```bash
npm install @morrowdigital/watermelondb-expo-plugin
```

```ts
// app.config.ts — plugins-Array
'@morrowdigital/watermelondb-expo-plugin',
```

Danach erneut `npx expo prebuild --clean` und Native-Rebuild.

**Bekannte Stolpersteine (Community):**

| Problem | Workaround |
|---|---|
| `simdjson` duplicate pod (iOS) | Manuelle `pod 'simdjson'`-Zeile aus Podfile entfernen, `pod install` |
| Android JSI linking | Plugin sollte `build.gradle` patchen; ggf. manuell prüfen |
| React 19 peer deps | `package.json` `overrides` falls nötig |

#### 2.3 database.ts — Stufe A (konservativ)

```ts
const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: 'ragapp',
  jsi: false, // Stufe A: bewusst false bis NA stabil
});
```

Kommentar anpassen: „Dev Client only; JSI in Stufe B“.

#### 2.4 Babel (unverändert lassen)

```js
['@babel/plugin-proposal-decorators', { legacy: true }],
'react-native-reanimated/plugin', // muss letztes Plugin bleiben
```

#### 2.5 Optional: performance.now-Polyfill

Falls WatermelonDB unter NA mit Timing-Fehlern wirft — `performance.now`-Polyfill in Entry (`app/_layout.tsx` oder `index.js`) ergänzen (Community-Pattern für SDK 54).

---

### Phase 3 — Funktionstest WatermelonDB + Sync (1–2 Tage)

**Ziel:** Kritischer Pfad unter NA validieren.

#### 3.1 Frische Installation

- [ ] App deinstallieren (oder App-Daten löschen)
- [ ] Neu installieren → `ensureSeeded()` lädt `assets/seed/db-snapshot.json`
- [ ] Übersicht: Quellen sichtbar
- [ ] Lesen: Paragraphs laden, FlashList scrollt flüssig

#### 3.2 Sync (ragrun muss laufen)

- [ ] Login (Magic Link / Session)
- [ ] `runSync()` nach Login — kein Fehler in Konsole
- [ ] Pull: Server-Änderungen erscheinen lokal
- [ ] Push: Notiz anlegen → Sync → in Supabase `app_notes` sichtbar
- [ ] Bookmark / Last-Read: lokal + nach Reinstall + Sync

#### 3.3 Reaktive Queries (`.observe()`)

| Screen | Was testen |
|---|---|
| `ReadScreen` | Paragraphs, Notes, Talks, Bookmarks live nach DB-Änderung |
| `OverviewScreen` | Sources, Segments, Last-Read |
| `ChatScreen` | Talk-Liste, Turns |
| `ContributionsScreen` | Notes/Talks pro Paragraph |
| `ConversationDetailScreen` | Turn-Stream |

#### 3.4 Schema-Migration

- [ ] Bestehende Installation (Schema v18) → App-Update ohne Datenverlust
- [ ] Kein Crash in `migrations.ts`

#### 3.5 Edge Cases

- [ ] App in Hintergrund → Vordergrund → Sync erneut
- [ ] Offline: Lesen funktioniert; Sync-Fehler graceful (`useSync`)
- [ ] Große Quelle wählen (viele Paragraphs) — Scroll-Performance vs. Baseline

---

### Phase 4 — Optional: JSI aktivieren (Stufe B, 0,5–1 Tag)

**Nur wenn Phase 3 vollständig grün.**

```ts
const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: 'ragapp',
  jsi: true, // Dev Client / Production builds only
});
```

- [ ] Native Rebuild (JSI erfordert kompilierte Native-Module)
- [ ] Seed + Sync erneut testen
- [ ] ReadScreen Scroll-Performance subjektiv vergleichen
- [ ] Release-Build (nicht nur Debug) auf beiden Plattformen

**Rollback Stufe B:** `jsi: false` → Rebuild.

**Bei JSI-Crashes:** `jsi: false` beibehalten — NA funktioniert auch ohne JSI, nur langsamer bei großen Queries.

---

### Phase 5 — Dokumentation & Merge (0,5 Tag)

- [ ] `README.md`: Hinweis „Dev Client erforderlich, NA aktiviert“
- [ ] `ragapp-gesamtplan.md` §18: NA-Status aktualisieren
- [ ] Config-Inkonsistenz behoben dokumentieren
- [ ] PR mit Testprotokoll (§6)

---

## 5. Test-Checkliste (Baseline & NA)

Kurzform für Phase 0 und nach jeder Stufe:

```
[ ] App-Start (iOS)
[ ] App-Start (Android)
[ ] Seed / Buchkatalog vorhanden
[ ] Übersicht → Buch wählen
[ ] Lesen → Segmentwechsel → Scroll
[ ] Lesezeichen setzen / Last-Read
[ ] Notiz anlegen / bearbeiten / löschen
[ ] Chat-Liste laden (gespeicherte Talks)
[ ] PagerView: alle 4 Tabs
[ ] Auth Deep Link (Magic Link)
[ ] Sync Pull + Push (eingeloggt)
[ ] App-Neustart: Daten persistent
```

---

## 6. Risiken & Mitigationen

| Risiko | Wahrscheinlichkeit | Mitigation |
|---|---|---|
| WatermelonDB crash unter Bridgeless | Mittel | 0.28.0 + Community-Plugin; ggf. `jsi: false` |
| iOS Pod-Konflikte (simdjson) | Mittel | Podfile manuell bereinigen |
| Sync bricht unter NA | Niedrig | Sync ist JS-only; trotzdem Phase 3 voll testen |
| FlashList-Regression | Niedrig | FlashList 2.x ist NA-first — eher Verbesserung |
| Kein Rollback nach SDK 55+ | — | Deshalb NA **jetzt** auf SDK 54 validieren |
| WatermelonDB-Wartung stagniert | Langfristig | Repository-Layer bleibt Exit-Option (Drizzle/op-sqlite) |

---

## 7. Go / No-Go-Kriterien

### Go für Merge (Stufe A)

- Alle Punkte in §5 grün auf iOS **und** Android
- Keine Datenverluste bei Schema v18-Migration
- Sync Pull/Push fehlerfrei
- Performance nicht schlechter als Baseline (subjektiv akzeptabel)

### No-Go / Rollback

- Crash beim App-Start oder bei DB-Init
- Seed oder Sync dauerhaft fehlgeschlagen
- `.observe()` liefert keine Updates mehr
- Nach 2 Tagen Debugging ohne klare Lösung → Rollback auf Old Arch, Issue dokumentieren

### Go für Stufe B (JSI)

- Stufe A stabil ≥ 1 Woche im Daily-Use ODER Release-Build erfolgreich
- Kein Crash in Release-Build mit `jsi: true`

---

## 8. Rollback-Prozedur

```bash
# 1. Config
# app.config.ts → newArchEnabled: false

# 2. Native reset
npx expo prebuild --clean

# 3. Rebuild Dev Client
npx expo run:ios
npx expo run:android

# 4. database.ts unverändert lassen (jsi: false)
```

Lokale SQLite-Daten bleiben erhalten (gleiches `dbName: 'ragapp'`).

---

## 9. Zeitplan (Schätzung)

| Phase | Aufwand |
|---|---|
| 0 Baseline | 0,5 Tag |
| 1 NA aktivieren | 0,5–1 Tag |
| 2 Watermelon NA-Setup | 1–2 Tage |
| 3 Test Sync + UI | 1–2 Tage |
| 4 JSI (optional) | 0,5–1 Tag |
| 5 Docs + Merge | 0,5 Tag |
| **Gesamt Stufe A** | **~3–5 Tage** |
| **Mit Stufe B** | **+1 Tag** |

---

## 10. Danach: SDK 55+ Upgrade (separater Plan)

Wenn Stufe A auf SDK 54 grün ist:

1. SDK 55 Upgrade **ohne** gleichzeitige Feature-Arbeit
2. `newArchEnabled` entfällt in SDK 55 (immer an)
3. Erneut §5-Checkliste
4. WatermelonDB-Version gegen SDK-55-Matrix prüfen

**Nicht kombinieren:** NA-Migration + Filo-Chat-UI + SDK-Upgrade in einem Sprint.

---

## 11. Dateien, die voraussichtlich geändert werden

| Datei | Änderung |
|---|---|
| `app.config.ts` | `newArchEnabled: true`, Plugin |
| `package.json` | WatermelonDB 0.28.x, Expo-Plugin |
| `src/data/db/database.ts` | Kommentar; ggf. `jsi: true` (Stufe B) |
| `ios/`, `android/` | via `expo prebuild --clean` regeneriert |
| `babel.config.js` | voraussichtlich unverändert |
| `README.md` | Dev-Client/NA-Hinweis |
| Repositories, Screens, Sync | **keine Änderung** bei Erfolg |

---

## 12. Offene Entscheidungen

| # | Frage | Empfehlung |
|---|---|---|
| 1 | WatermelonDB 0.27.1 → 0.28.0 sofort? | Ja, vor NA-Test |
| 2 | Community-Plugin vs. manuelle Native-Patches? | Plugin zuerst |
| 3 | JSI in Stufe A oder erst Stufe B? | Erst Stufe B |
| 4 | Android parallel zu iOS testen? | Ja — Bridgeless-Bugs oft Android-spezifisch |
| 5 | EAS Build einführen? | Optional; lokaler Dev Client reicht für NA-Validierung |

---

## 13. Referenzen

- [Expo: New Architecture](https://docs.expo.dev/guides/new-architecture/)
- [RN 0.81 — letzte Version mit Legacy-Opt-out](https://reactnative.dev/blog/2025/10/08/react-native-0.82)
- [WatermelonDB NA Issue #1969](https://github.com/Nozbe/WatermelonDB/issues/1969)
- [WatermelonDB Bridgeless Fix #1769](https://github.com/Nozbe/WatermelonDB/issues/1769)
- [@morrowdigital/watermelondb-expo-plugin](https://www.npmjs.com/package/@morrowdigital/watermelondb-expo-plugin)
- ragapp Sync-Protokoll: `src/data/lib/sync.ts`, `supabase/migrations/002_sync_functions.sql`
