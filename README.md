# ragapp

Mobile App (Expo / React Native) für das ragrun-Wissenssystem: Textkorpus lesen, notieren und KI-gestützt durchsuchen — offline-first mit WatermelonDB und Supabase-Sync.

## Voraussetzungen

- Node.js 20+
- npm
- Für iOS: Xcode; für Android: Android Studio (oder Expo Go)

## Setup

```bash
npm install
cp .env.example .env
# .env ausfüllen (siehe unten)
npm start
```

### Umgebungsvariablen

| Variable | Zweck |
|----------|--------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase-Projekt (Auth + Sync) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key |
| `EXPO_PUBLIC_RAGRUN_BASE_URL` | ragrun-API (Suche, Chat, Health) |

Ohne `.env` laufen lokale Features (z. B. Seed-Korpus); Online-Features sind deaktiviert.

## Scripts

| Befehl | Beschreibung |
|--------|----------------|
| `npm start` | Expo Dev Server |
| `npm run ios` | Native iOS Build |
| `npm run android` | Native Android Build |
| `npm run web` | Web (experimentell) |

## Architektur

**Neuen Code bitte nach Schichten ablegen** — siehe [ARCHITECTURE.md](./ARCHITECTURE.md).

Kurz: Screens → Hooks → Services (online) / Repositories (offline) → `lib/`.

Ausführliche Pläne: [plans/ragapp-gesamtplan.md](./plans/ragapp-gesamtplan.md).

## Lizenz

Noch nicht festgelegt (Ziel: Open Source 1.0.0).
