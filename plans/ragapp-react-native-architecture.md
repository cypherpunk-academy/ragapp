# ragapp — React Native (Expo) Architektur

**Bezug:** Dieses Dokument präzisiert die **App-Schicht** aus dem [ragapp-gesamtplan](./ragapp-gesamtplan.md) (Zielbild, Tabs, Datenschicht, Repository-Layer, Tech-Stack). Bei Widersprüchen gilt der Gesamtplan.

**Stand:** 2026-05-15 (Services/Hooks-Layer; siehe auch [ARCHITECTURE.md](../ARCHITECTURE.md) im Repo-Root)

---

## 1. Leitplanken (aus dem Produkt)

- **Offline-first:** Korpus und Nutzerdaten werden in **WatermelonDB** (expo-sqlite) gehalten — das ist der **lokale Spiegel** der per Sync relevanten Supabase-Tabellen (`rag_paragraphs`, `rag_chunks`, `app_notes`, `rag_talks`, `rag_turns`, …; Gesamtplan §7). Lesen und Übersicht lesen primär aus dieser lokalen DB.
- **ragrun** wird für **Online-Fähigkeiten** angesprochen: Hybrid-Suche, KI-Chat, Health, Personalities — nicht für Qdrant direkt in der App.
- **Supabase Auth** + **JWT** in `expo-secure-store` (keine sensiblen Tokens in unverschlüsseltem AsyncStorage).
- **UI:** Fünf horizontal wischbare Tabs (`expo-router` + `react-native-pager-view`), Flash List + eigener Node-Renderer für Lesetext (Gesamtplan §4 / §15).

---

## 2. Schichtenmodell

```
┌─────────────────────────────────────────────────────────┐
│  Screens & Feature-UI (Tabs: Suche, Übersicht, …)        │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  Hooks (useAuth, useNotes, useRagrunHealth, useSearch, …) │
└───────────────────────────┬─────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────▼────────┐                    ┌─────────▼─────────┐
│  Services      │                    │  Repositories      │
│  authService   │                    │  *Repository       │
│  ragrunApi     │                    │  (WatermelonDB)    │
└───────┬────────┘                    └─────────┬─────────┘
        │                                       │
┌───────▼────────┐                    ┌─────────▼─────────┐
│  lib/          │                    │  lib/sync (geplant)│
│  supabase      │                    │  pull/push RPC     │
│  ragrun-client │                    └─────────┬─────────┘
│  config        │                              │
└───────┬────────┘                    ┌─────────▼─────────┐
        │                             │  WatermelonDB      │
┌───────▼────────┐                    └─────────┬─────────┘
│  ragrun API    │                              │
│  Supabase Auth │                    ┌─────────▼─────────┐
└────────────────┘                    │  Supabase (RPC)   │
                                      └───────────────────┘
```

**Regeln:**

- Screens sprechen **nicht** direkt mit WatermelonDB, `fetch` oder Supabase — nur über **Hooks**.
- Hooks rufen **Services** (online) oder **Repositories** (offline) auf.
- **lib/** = Infrastruktur (Clients, Env, Seed); **services/** = fachliche API-Operationen.

**Repositories (Beispiele):** Korpus (`ParagraphRepository`, ggf. `ChunkRepository`), **KI-Gespräche (`TalkRepository`, `TurnRepository`)**, Notizen (`NoteRepository`), Lesezeichen (`BookmarkRepository`). `POST /app/chat` (ragrun) sendet **online** via `ragrunApi`; persistierter Chat-Verlauf über Sync in WatermelonDB — Repositories kapseln lokales Lesen/Schreiben.

## 3. Routing & Navigation

**Entscheidung (Gesamtplan):** `expo-router` (file-based), SDK 52+.

**Aus dem Anregungsdokument übernommen (ragapp-tauglich):** Route-Gruppen trennen **unauthenticated** (Login, Magic Link, ggf. Onboarding) von **authenticated** (Haupt-App mit Tab-Layout und Auth-Guard). Deep-Linking früh mitdenken (Sharing V1 im Gesamtplan).

Beispielhafte Struktur (anpassen, sobald das Repo existiert):

```
app/
├── _layout.tsx                 # Root: Provider, Fonts, …
├── (auth)/                     # Ohne Session
│   ├── login.tsx
│   └── _layout.tsx
├── (app)/                      # Mit Session / Gast-Modus wo erlaubt
│   ├── _layout.tsx             # Tab-Shell + Pager
│   ├── index.tsx               # z. B. Lesen oder letzter Tab
│   ├── search.tsx
│   ├── overview.tsx
│   ├── read.tsx
│   ├── notes.tsx
│   └── chat.tsx
└── +not-found.tsx
```

Die Routen-Dateien bleiben **dünn**: sie importieren Screen-Komponenten aus `src/features/...` (siehe unten).

**Wischbare Tabs:** `react-native-pager-view` (oder material-top-tabs) entsprechend Gesamtplan §3 — koexistiert mit `expo-router`-Segmenten.

---

## 4. State & Server-Daten (bewusst schlank)

| Bedarf | ragapp-Ansatz | Nicht vorgesehen / optional |
|--------|----------------|------------------------------|
| UI-Zustand pro Screen | `useState` / `useReducer` | Redux |
| Übergreifendes UI (Theme, Sprache) | React **Context** + kleine Provider | Zustand nur, falls später echte Komplexität |
| Korpus + Nutzerdaten mit Sync | **WatermelonDB** + Sync-RPC | TanStack Query **ersetzt** Watermelon nicht |
| Kurzlebige / reine Online-APIs | **`ragrunApi`** in `src/services/` + **Hooks** pro Feature (`useRagrunHealth`, später `useSearch`); Basis-HTTP in `lib/ragrun-client.ts`; optional später **TanStack Query** nur für ragrun | `fetch` direkt in Screens; TanStack Query für Watermelon-Daten |

**Begründung:** Der Gesamtplan setzt WatermelonDB als Sync-Engine fest. Ein zweites „Server-State“-Framework für dieselben Tabellen würde Duplikat und Inkonsistenz riskieren. TanStack Query passt ragapp **optional** dort, wo **kein** Watermelon-Spiegel existiert (z. B. reine Online-Suche, Chat-Streaming, `/app/health`).

---

## 5. Provider-Stack (Minimal)

Im Root-`_layout.tsx` typischerweise (Reihenfolge beachten):

- `GestureHandlerRootView` (react-native-gesture-handler / Reanimated-Umfeld)
- `SafeAreaProvider`
- **Theme** (Werte aus `theme.ts` / `@shopify/restyle`, siehe Gesamtplan §13 — nicht zwingend NativeWind)
- **Auth-Session** (Supabase Session, Refresh; Token nur Secure Store)
- Optional: `QueryClientProvider` — **nur** wenn TanStack Query für ragrun eingeführt wird

---

## 6. Ordnerstruktur (Feature-first, ohne Dogma „Atoms“)

Der Gesamtplan verlangt **kein** klassisches Atomic Design. Pragmatisch und skalierbar:

```
app/                            # expo-router (Root)
src/
├── features/                   # Tab-Screens (search, read, notes, chat, …)
├── hooks/                      # useAuth, useNotes, useRagrunHealth, …
├── services/                   # authService, ragrunApi (online)
├── repositories/               # WatermelonDB: Korpus, Notizen, Talks/Turns, …
├── lib/
│   ├── config.ts               # Env aus app.config.ts / EXPO_PUBLIC_*
│   ├── supabase.ts             # Client, SecureStore-Session
│   ├── ragrun-client.ts        # fetch-Wrapper, Bearer, RagrunApiError
│   ├── seedLoader.ts           # Dev-Seed wenn DB leer
│   └── sync/                   # (geplant) pull/push RPC
├── db/                         # Schema, Models, Migrations
├── components/                 # geteilte UI
├── theme.ts                    # Figma Tokens (Gesamtplan §13)
└── types/                      # TS-Typen (inkl. ragrun API)
```

**Aus dem Anregungsdokument bewusst weggelassen:** verpflichtende `atoms/molecules/organisms`-Hierarchie und Storybook-Pflicht — können später ergänzt werden, wenn das Team wächst.

---

## 7. API-Schicht

| Ziel | Technik |
|------|---------|
| Auth | `authService` → `lib/supabase.ts` (`@supabase/supabase-js`, Secure Store) |
| Sync | `lib/sync/` (geplant): Supabase RPC `pull_changes` / `push_changes` |
| Suche, Chat (**Senden**), Personalities, Health | `ragrunApi` → `lib/ragrun-client.ts`, `/app/*` (Gesamtplan §10) |
| Chat-**Verlauf** in der UI | Watermelon `rag_talks` / `rag_turns` über Repositories nach Sync |
| Konfiguration | `.env` + `app.config.ts` + `lib/config.ts` — keine URLs/Keys im Quellcode |

**Typisierung:** Response-Typen für ragrun und für Watermelon-Modelle in `src/types/` bzw. colocated — **TypeScript strict** (Anregungsdokument DX-Teil, gekürzt auf das Nötige).

---

## 8. Persistenz & Sicherheit

| Daten | Werkzeug |
|-------|----------|
| JWT / Session-Secrets | `expo-secure-store` |
| Relationaler Offline-Korpus + Nutzerdaten | **WatermelonDB** auf **expo-sqlite** |
| Kleine nicht-sensible Prefs (z. B. letzter Tab) | AsyncStorage **ohne** Secrets |

**Aus dem Anregungsdokument übernommen:** JWT nie in AsyncStorage ablegen.

---

## 9. UI, Listen, Performance

| Thema | ragapp |
|-------|--------|
| Lange Texte / Listen | **@shopify/flash-list** (Gesamtplan §15) |
| Lesetext | Eigener **Node-Renderer** für `rendered_content` (kein Markdown-Parser) |
| Animationen | `react-native-reanimated` |
| Engine | Hermes (Expo-Default) |
| Bilder | `expo-image` sinnvoll, sobald Cover/Avatare relevant — `cachePolicy` nach Expo-Doku |

**Memoization:** gezielt an FlashList-Zellen und schweren Renderern; nicht global „alles memo“.

---

## 10. Formulare

Der Gesamtplan umfasst Notizen, Konto, Auth — keine generische Form-Engine vorgeschrieben.

**Aus dem Anregungsdokument selektiv:** Wo größere Formulare entstehen (Profil, Notiz-Editor mit Validierung), eignen sich **React Hook Form** + **Zod**; einfache Einzeiler (Sucheingabe) bleiben bei lokalem State.

---

## 11. Testing & Qualität (schlank starten)

| Ebene | Werkzeug |
|-------|----------|
| Repository & reine TS-Logik | Jest |
| Komponenten | React Native Testing Library |
| E2E | Später Maestro oder Detox — wenn Kernflows stabil sind |

**ESLint + Prettier** im Projekt; CI mit EAS Build laut Gesamtplan-Infrastruktur.

---

## 12. Kurzüberblick

| Kategorie | ragapp |
|-----------|--------|
| Navigation | expo-router + wischbare Tabs (Pager) |
| Offline-Daten | WatermelonDB / expo-sqlite, Repositories |
| Online (ragrun) | `/app/*` — z. B. Suche, **Chat senden**, Health; Korpus + Gespräche offline in WMDB |
| Auth & Server-DB | Supabase |
| Sensible Tokens | expo-secure-store |
| Listen / Lesen | FlashList + Custom Renderer |
| Theme | `theme.ts` / Restyle (Figma §13) |
| Optionale Erweiterung | TanStack Query nur für ragrun-HTTP ohne Sync-Duplikat |

---

## 13. Literatur im Repo

- **Kurzreferenz (für Code & KI):** [ARCHITECTURE.md](../ARCHITECTURE.md)
- Gesamtplan: [ragapp-gesamtplan.md](./ragapp-gesamtplan.md) (Tabs, Sync-Matrix, Endpunkte, Risiken, Phasen).
- Setup: [README.md](../README.md)
- Figma & Datenbindungen: Gesamtplan §13 / §13.1.
