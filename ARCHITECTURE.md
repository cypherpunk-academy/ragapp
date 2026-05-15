# ragapp — Architektur

Kurzreferenz für Schichten und Ablage neuer Dateien. Ausführlicher Kontext: [plans/ragapp-react-native-architecture.md](./plans/ragapp-react-native-architecture.md) und [plans/ragapp-gesamtplan.md](./plans/ragapp-gesamtplan.md).

## Schichten

```
Screen (features/*, app/*)
  → Hook (hooks/*)              State, Subscriptions, Orchestrierung
    → Service (services/*)      Online: Auth, ragrun-API
    → Repository (repositories/*) Offline: WatermelonDB
      → lib/*                     Clients, Config, Seed, Sync (später)
```

## Entscheidungsbaum

| Was du baust | Wohin |
|--------------|--------|
| UI, Layout, Navigation | `app/` oder `src/features/<feature>/` |
| Screen-State, DB-Observe, API-Aufruf aus UI | `src/hooks/use*.ts` |
| Lokale Daten lesen/schreiben | `src/repositories/*` — **nie** WatermelonDB im Screen |
| HTTP ragrun (`/app/*`) | `src/services/ragrunApi.ts` — **nie** `fetch` im Screen |
| Supabase Auth (Magic Link, Session) | `src/services/authService.ts` |
| Supabase-/ragrun-Client, Env, Token | `src/lib/` |
| Request/Response-Typen | `src/types/` |
| Geteilte UI-Bausteine | `src/components/` |

## Wichtige Regeln

1. **Presentation vs. Logic:** Screens rufen Hooks auf; Hooks rufen Services/Repositories auf.
2. **Offline vs. Online:** Korpus, Notizen, Chat-**Verlauf** → WatermelonDB + Repositories. Suche, Chat-**senden**, Health → `ragrunApi`.
3. **lib vs. services:** `lib/` = Infrastruktur (Client, Config). `services/` = fachliche API (search, chat, signIn).
4. **Configuration vs. Code:** URLs und Keys nur über `EXPO_PUBLIC_*` in `.env` → `app.config.ts` → `src/lib/config.ts`. Keine Secrets im Repo.
5. **JWT:** Nur `expo-secure-store` (siehe `src/lib/supabase.ts`), nicht AsyncStorage.

## Beispiele

```typescript
// ✅ SearchScreen
const { online } = useRagrunHealth();
const results = await ragrunApi.search({ query }); // über Hook, nicht direkt im Screen

// ✅ NotesScreen
const { notes } = useNotes(paragraphId);

// ❌ Screen mit database.get(...) oder fetch(ragrunUrl)
```

## Ordner (aktuell)

```
app/                    expo-router
src/
  features/             Tab-Screens
  hooks/                useAuth, useNotes, useRagrunHealth, …
  services/             authService, ragrunApi
  repositories/         WatermelonDB
  lib/                  config, supabase, ragrun-client, seedLoader
  components/           geteilte UI
  db/                   Schema, Models, Migrations
  types/                TS-Typen (inkl. ragrun API)
```

## Env-Setup

```bash
cp .env.example .env
# EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_RAGRUN_BASE_URL
npm start
```

Ohne `.env` startet die App; Online-Features melden „not configured“.
