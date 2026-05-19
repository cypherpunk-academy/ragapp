# ragapp — Architektur

Kurzreferenz für Schichten und Ablage neuer Dateien. Ausführlicher Kontext: [plans/ragapp-react-native-architecture.md](./plans/ragapp-react-native-architecture.md) und [plans/ragapp-gesamtplan.md](./plans/ragapp-gesamtplan.md). Design-Tokens & Figma: [design/README.md](./design/README.md).

## Schichten

```
Screen (features/*, app/*)
  → Hook (shared/hooks/*)           State, Subscriptions, Orchestrierung
    → Service (data/services/*)     Online: Auth, ragrun-API
    → Repository (data/repositories/*) Offline: WatermelonDB
      → lib (data/lib/*)            Clients, Config, Seed, Sync (später)
```

## Entscheidungsbaum

| Was du baust | Wohin |
|--------------|--------|
| UI, Layout, Navigation | `app/` oder `src/features/<feature>/` |
| Screen-State, DB-Observe, API-Aufruf aus UI | `src/shared/hooks/use*.ts` |
| Lokale Daten lesen/schreiben | `src/data/repositories/*` — **nie** WatermelonDB im Screen |
| HTTP ragrun (`/app/*`) | `src/data/services/ragrunApi.ts` — **nie** `fetch` im Screen |
| Supabase Auth (Magic Link, Session) | `src/data/services/authService.ts` |
| Supabase-/ragrun-Client, Env, Token | `src/data/lib/` |
| Request/Response-Typen | `src/shared/types/` |
| Geteilte UI, Theme, Context | `src/shared/components/`, `src/shared/theme/`, `src/shared/contexts/` |

## Wichtige Regeln

1. **Presentation vs. Logic:** Screens rufen Hooks auf; Hooks rufen Services/Repositories auf.
2. **Offline vs. Online:** Korpus, Notizen, Chat-**Verlauf** → WatermelonDB + Repositories. Suche, Chat-**senden**, Health → `ragrunApi`.
3. **lib vs. services:** `data/lib/` = Infrastruktur (Client, Config). `data/services/` = fachliche API (search, chat, signIn).
4. **Configuration vs. Code:** URLs und Keys nur über `EXPO_PUBLIC_*` in `.env` → `app.config.ts` → `src/data/lib/config.ts`. Keine Secrets im Repo.
5. **JWT:** Nur `expo-secure-store` (siehe `src/data/lib/supabase.ts`), nicht AsyncStorage.

## Beispiele

```typescript
// ✅ SearchScreen
const { online } = useRagrunHealth();
const results = await ragrunApi.search({ query }); // über Hook, nicht direkt im Screen

// ✅ NotesScreen
const { notes } = useNotes(paragraphId);

// ❌ Screen mit database.get(...) oder fetch(ragrunUrl)
```

## Ordner (Ebene 1: drei Schichten)

```
app/                    expo-router
src/
  features/             Tab-Screens (search, overview, read, chat, …)
  shared/
    components/         AppBar, TabBar, …
    theme/              Tokens, Icons (npm run build:theme)
    hooks/              useAuth, useNotes, useRagrunHealth, …
    contexts/           ReadingContext, …
    types/              TS-Typen (inkl. ragrun API)
  data/
    db/                 Schema, Models, Migrations
    repositories/       WatermelonDB-Zugriff
    services/           authService, ragrunApi
    lib/                config, supabase, ragrun-client, seedLoader
```

Imports: `@/shared/*`, `@/data/*`, `@/features/*` (siehe `tsconfig.json`).

## Env-Setup

```bash
cp .env.example .env
# EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_RAGRUN_BASE_URL
npm start
```

Ohne `.env` startet die App; Online-Features melden „not configured“.
