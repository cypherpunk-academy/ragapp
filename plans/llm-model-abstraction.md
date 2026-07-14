# LLM-Modell-Abstraktion — Plan

**Status:** Entwurf  
**Bezug:** [filo-chat-ui-design.md](./filo-chat-ui-design.md) §2 (Modi, Kontextanzeige) · [filo-arbeitstext-contract.md](./filo-arbeitstext-contract.md) · [ragrun-app-tools-architecture.md](../../ragrun/plans/ragrun-app-tools-architecture.md)  
**Scope:** Zwei **Stufen** (Chat / Nachdenken), vom User in den App-Einstellungen mit konkreten Modellen belegbar. Erste Provider: **DeepSeek** und **Anthropic (Claude)**. Basissysteme **ragrun** (Runtime) und **ragprep** (Offline-Pipeline) werden provider- und modell-variabel.

---

## 1. Zielbild

Die App und die Backend-Pipelines sprechen nicht mehr direkt mit „DeepSeek“, sondern mit **zwei semantischen Stufen**:

| Stufe | UI-Name | Typische Nutzung | Beispiel-Zuordnung (User-Settings) |
|---|---|---|---|
| `chat` | Chat | Schnelle Antworten, Zusammenfassungen, leichte Korrekturen | `deepseek-v4-flash` (thinking off) |
| `think` | Nachdenken | Komplexe Analyse, längere Begründungen, schwierige Pipeline-Schritte | `claude-opus-4-6` oder `deepseek-v4-flash` (thinking on) |

**Invariante:** API-Keys bleiben **serverseitig** (ragrun `.env`, ragprep `.env`). Die App wählt nur `model_id`-Einträge aus einem **Katalog**, den ragrun bereitstellt und validiert. Kein BYOK im MVP.

**Nicht im Scope (MVP):** Embeddings (bleiben E5/roberta), Bild-Modelle, OpenAI/GPT als dritter Provider (Architektur soll es später erlauben).

---

## 2. Ist-Zustand (Codebase, Stand jetzt)

### 2.1 ragrun

| Bereich | Ist | Problem |
|---|---|---|
| Konfiguration | `RAGRUN_DEEPSEEK_*` in `app/config.py` — Defaults **`deepseek-v4-flash`** (Chat + Reasoner) | Kein Anthropic, kein generischer Katalog |
| Client | `app/infra/deepseek_client.py` — synchroner `httpx`-POST, `thinking`-Parameter im Payload, kein Streaming | Provider-spezifisch, nicht austauschbar |
| Factories | `app/core/providers.py` — `get_deepseek_client(model, thinking_type)`; Chat = `thinking: disabled`, Reasoner = `thinking: enabled` auf **demselben** Modell | Namen noch DeepSeek-spezifisch; Semantik korrekt für v4 |
| Retrieval | `app/retrieval/services/providers.py` re-exportiert DeepSeek-Factories | Alle Chains/Services importieren `DeepSeekClient` |
| LangGraph-Chat | `assistant_chat_graph.py`, `action_prompt.py` — `ChatOpenAI` mit `openai_api_base=deepseek` | OpenAI-kompatibel, aber hart auf DeepSeek-URL/Key |
| App-Chat | `app_chat_service.py` — immer `get_deepseek_chat()` | Kein Modus, kein User-Modell |
| Kosten | `config/pricing.json` + `llm_pricing`-Tabelle — **`deepseek-v4-flash`**, **`deepseek-v4-pro`**; Legacy-Einträge `deepseek-chat`/`deepseek-reasoner` für historische Zeilen | `calculate_cost()` fällt ggf. noch auf `deepseek-chat` zurück; Anthropic-Client fehlt |
| Usage | `rag_usage` speichert `model` + `provider` (default `deepseek`) | Schema ist provider-ready |

### 2.2 ragprep

| Bereich | Ist | Problem |
|---|---|---|
| Service | `src/services/DeepSeekService.ts` — `deepseekChatRequest` / `deepseekReasonerChatRequest` | Monolith, nur DeepSeek |
| Konstanten | `DEEPSEEK_CHAT_MODEL = 'deepseek-chat'` (hart), `DEEPSEEK_REASONER_MODEL` per Env | Deprecated Aliase (2026-07-24); kein Claude |
| Stufen-Muster | Bereits vorhanden als `'chat' \| 'reasoner'` in `annotateWorldviews`, `augmentQuotes` | Semantik = unsere `chat`/`think`-Stufen, aber an DeepSeek-Funktionen gebunden |
| Aufrufer | ~10 CLI-Commands (OCR, Spellcheck, Summaries, Quotes, Concepts, …) | Importieren `DeepSeekService` direkt |

### 2.3 ragapp

| Bereich | Ist | Problem |
|---|---|---|
| Settings | `SettingsScreen.tsx` — Platzhalter, keine Modellwahl | Filo-Design (§2) sieht Modellwahl in `einstellungen.tsx` vor |
| Chat-Modi | Geplant in `chatModes.ts` — `chat` / `think` | Noch nicht implementiert; Kontext-Limits in `modelContextLimits.ts` geplant |

---

## 3. Ziel-Architektur

```
┌─────────────────────────────────────────────────────────────┐
│ ragapp                                                       │
│  Settings: chat_model_id, think_model_id  (AsyncStorage+Sync)│
│  Chat-Request: { mode: "chat"|"think", ... }                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ JWT
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ ragrun                                                       │
│  GET /app/models          → Katalog (id, label, tier, limits)│
│  POST /app/chat/stream    → resolve(mode, user_prefs)→ LLM    │
│                                                              │
│  LlmRegistry (config/models.json)                            │
│  LlmClient protocol: chat(), chat_stream()                   │
│    ├─ OpenAICompatibleClient  (DeepSeek)                   │
│    └─ AnthropicClient         (Claude)                       │
│  resolve_llm(tier, user_model_id?) → LlmClient + model_id   │
└──────────────────────────┬──────────────────────────────────┘
                           │ gleicher Katalog / gleiche Stufen
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ ragprep (CLI)                                                │
│  ~/.ragprep/config.yaml  oder  env RAGPREP_LLM_CHAT_MODEL    │
│  LlmService.chat({ tier: "chat"|"think", messages })         │
│  → gleiche model_ids wie ragrun (shared JSON oder npm-Paket) │
└─────────────────────────────────────────────────────────────┘
```

### 3.1 Modell-Katalog (MVP)

Zentrale Datei: `ragrun/config/models.json` (ragprep importiert/kopiert dieselbe Datei oder symlink im Monorepo).

```jsonc
{
  "tiers": ["chat", "think"],
  "models": [
    {
      "id": "deepseek-v4-flash-chat",
      "label": "DeepSeek V4 Flash",
      "provider": "deepseek",
      "api_model": "deepseek-v4-flash",
      "tier": ["chat", "think"],
      "thinking": { "chat": "disabled", "think": "enabled" },
      "context_window": 1000000,
      "max_output": 384000,
      "streaming": "openai_sse"
    },
    {
      "id": "deepseek-v4-pro-chat",
      "label": "DeepSeek V4 Pro",
      "provider": "deepseek",
      "api_model": "deepseek-v4-pro",
      "tier": ["chat", "think"],
      "thinking": { "chat": "disabled", "think": "enabled" },
      "context_window": 1000000,
      "max_output": 384000,
      "streaming": "openai_sse"
    },
    {
      "id": "claude-sonnet-4-6",
      "label": "Claude Sonnet",
      "provider": "anthropic",
      "api_model": "claude-sonnet-4-6",
      "tier": ["chat"],
      "context_window": 200000,
      "max_output": 64000,
      "streaming": "anthropic_sse"
    },
    {
      "id": "claude-opus-4-6",
      "label": "Claude Opus",
      "provider": "anthropic",
      "api_model": "claude-opus-4-6",
      "tier": ["think"],
      "context_window": 200000,
      "max_output": 64000,
      "streaming": "anthropic_sse"
    },
    {
      "id": "claude-fable",
      "label": "Claude Fable",
      "provider": "anthropic",
      "api_model": "claude-fable",  // exakte API-ID bei Implementierung verifizieren
      "tier": ["chat", "think"],
      "context_window": 200000,
      "max_output": 64000,
      "streaming": "anthropic_sse",
      "note": "API-Modellstring vor Go-Live gegen Anthropic-Doku prüfen; ggf. Snapshot-ID."
    }
  ],
  "defaults": {
    "chat": "deepseek-v4-flash-chat",
    "think": "deepseek-v4-flash-chat"
  }
}
```

**DeepSeek-Besonderheit:** Chat vs. Nachdenken ist oft **dieselbe `api_model`**, unterschieden nur durch Request-Parameter `thinking.type` (`disabled` / `enabled`). Der Katalog modelliert das explizit — nicht zwei verschiedene `api_model`-Strings für Legacy-`deepseek-chat`/`deepseek-reasoner`.

**Claude-Besonderheit:** Kein `reasoning_content`-Delta wie DeepSeek; Extended Thinking (falls genutzt) hat eigenes SSE-Format — Streaming-Adapter getrennt implementieren.

---

## 4. ragrun — Was getan werden muss

### Phase R1 — Abstraktionsschicht (kein Verhalten ändern)

| Aufgabe | Details |
|---|---|
| `config/models.json` anlegen | Katalog + Defaults wie §3.1; Preise in `config/pricing.json` / `llm_pricing` angleichen (`deepseek-v4-flash`, Claude-IDs) |
| `app/llm/types.py` | `ChatMessage`, `ChatResult`, `StreamChunk` (`content`, `reasoning_content?`, `usage?`, `done`) |
| `app/llm/registry.py` | `get_model(model_id)`, `models_for_tier(tier)`, `resolve(tier, user_model_id?)` mit Validierung |
| `app/llm/clients/base.py` | Protocol `LlmClient` mit `async def chat(...)` und `async def chat_stream(...)` |
| `app/llm/clients/openai_compat.py` | Generalisierung aus `DeepSeekClient` (base_url, api_key, thinking-Parameter, Streaming-SSE) |
| `app/llm/clients/anthropic.py` | Neu: Messages API, Streaming, Tool-Calls (später) |
| `app/llm/factory.py` | `get_llm_client(model_id) -> LlmClient` — wählt Provider anhand `models.json` |
| Settings erweitern | `anthropic_api_key`, `anthropic_base_url` (optional); DeepSeek-Settings bleiben, Legacy-Aliase entfernen |

**Migration bestehender Aufrufer:**

```
get_deepseek_chat()        →  resolve("chat").client   (deprecated Wrapper)
get_deepseek_reasoner()    →  resolve("think").client    (deprecated Wrapper)
DeepSeekClient             →  OpenAICompatibleClient     (Alias deprecaten)
```

Betroffene Module (grep `DeepSeekClient` / `get_deepseek_`):  
`app/retrieval/**`, `app/services/app_chat_service.py`, `app/main.py` (Health-Probe), `scripts/testing/integration_tests.py`.

LangGraph-Pfad: `_make_llm()` in `assistant_chat_graph.py` / `action_prompt.py` auf Factory umstellen — `ChatOpenAI` nur noch für OpenAI-kompatible Provider, oder LangChain-`ChatAnthropic` für Claude.

### Phase R2 — User-Präferenzen (App)

| Aufgabe | Details |
|---|---|
| DB: `app_profiles` erweitern | Spalten `llm_chat_model_id`, `llm_think_model_id` (nullable → Server-Default) |
| `GET /app/models` | Öffentlicher Katalog (ohne Keys): `id`, `label`, `tier[]`, `context_window`, `max_output` |
| `PATCH /app/profile` | User speichert Modellwahl; Validierung gegen Katalog |
| `send_app_chat` / Stream | Parameter `mode: "chat" \| "think"`; `resolve(mode, user_prefs)`; `usage.model` = `api_model` |
| Sync | WDB `profiles` + Supabase `app_profiles` — Modell-IDs mit syncen |

### Phase R3 — Streaming vereinheitlichen

| Aufgabe | Details |
|---|---|
| `chat_stream()` in beiden Clients | OpenAI-SSE (`delta.content`, `delta.reasoning_content`, `data: [DONE]`) und Anthropic-SSE |
| `POST /app/chat/stream` | Provider-agnostische SSE-Events an die App: z. B. `{ type: "token", text }`, `{ type: "thinking", text }`, `{ type: "usage", ... }` |
| Reason | App-Parser (`react-native-sse` / `expo/fetch`) soll **nicht** jedes Provider-Format kennen |

### Phase R4 — Retrieval-Pipelines (optional getrennt)

Retrieval-Chains (ACE, Typology, Quote-Explain, …) nutzen heute fest `get_deepseek_chat()` bzw. `get_deepseek_reasoner()`. Optionen:

1. **Server-Defaults** — Pipelines ignorieren User-Settings; `models.json.defaults` steuert interne Jobs. *(Empfohlen für MVP — günstiger, reproduzierbar.)*
2. **Pro-Assistant-Override** — `action-manifest.yaml` optional `llm_tier: think`. Später.

---

## 5. ragprep — Was getan werden muss

### Phase P1 — LlmService statt DeepSeekService

| Aufgabe | Details |
|---|---|
| `src/services/LlmService.ts` | Einheitliche API: `llmChat({ tier, messages, temperature, maxTokens, modelId? })` |
| Provider-Adapter | `OpenAiCompatProvider` (aus `DeepSeekService` extrahiert), `AnthropicProvider` (neu, `fetch` + SSE optional) |
| Katalog laden | `import models from '../../ragrun/config/models.json'` (Monorepo-Pfad) oder `RAGPREP_MODELS_JSON` |
| Config | `src/config/llmConfig.ts` — Defaults: `RAGPREP_LLM_CHAT_MODEL`, `RAGPREP_LLM_THINK_MODEL`; Fallback auf `models.json.defaults` |
| `DeepSeekService.ts` | Deprecated Re-Exports → `LlmService` (ein Release-Zyklus Kompatibilität) |

### Phase P2 — CLI-Flags vereinheitlichen

Bestehendes Muster `'chat' \| 'reasoner'` → **`'chat' \| 'think'`** (Alias `reasoner` deprecaten).

| Command | Heute | Ziel |
|---|---|---|
| `text:annotate:worldviews` | `--deepseek-mode chat\|reasoner` | `--llm-tier chat\|think` + optional `--llm-model <id>` |
| `rag:augment:quotes` | intern `llm: 'chat'\|'reasoner'` | `think` |
| Alle `deepseekChatRequest`-Aufrufer | direkt | `llmChat({ tier: 'chat', ... })` |

Env-Keys:

```
DEEPSEEK_REST_API_KEY          # bleibt
ANTHROPIC_API_KEY              # neu
RAGPREP_LLM_CHAT_MODEL         # optional, model_id aus Katalog
RAGPREP_LLM_THINK_MODEL        # optional
```

### Phase P3 — Python-Hilfsskripte

`python/concepts_extraction/extract_concepts.py` — prüfen, ob dort eigene LLM-Aufrufe existieren; gleiche Abstraktion oder bewusst ausnehmen.

### Tests

- `DeepSeekService`-Mocks → `LlmService`-Mocks
- Ein Integrationstest pro Provider (optional, gated by env key)

---

## 6. ragapp — Was getan werden muss

| Aufgabe | Phase (Filo) | Details |
|---|---|---|
| `src/shared/lib/llmCatalog.ts` | D | Cache von `GET /app/models` oder eingebettete Kopie für Offline-Anzeige |
| `src/shared/lib/modelContextLimits.ts` | D | Aus Katalog: `context_window` pro `model_id` |
| `src/shared/lib/chatModes.ts` | E | `chat` / `think` — Labels, Icons |
| `src/features/settings/ModelPickerSection.tsx` | neu | Zwei Dropdowns: „Chat-Modell“, „Nachdenken-Modell“; nur `tier`-passende Modelle |
| Persistenz | E | `ProfileRepository` + Sync; Fallback Server-Defaults wenn leer |
| Chat-Request | B/E | `mode` mitsenden; Kontext-Sheet zeigt **aufgelöstes** Label (z. B. „Claude Opus (Nachdenken)“) |

---

## 7. Gemeinsame Verträge

### 7.1 API: Chat-Request (ragrun)

```typescript
type ChatMode = 'chat' | 'think';

interface AppChatRequest {
  message: string;
  personality: string;
  talk_id?: string;
  mode?: ChatMode;           // default: "chat"
  // model_id?: string;      // NICHT im MVP — nur via Settings, nicht pro Turn
}
```

### 7.2 Usage & Kosten

- `rag_usage.model` = `api_model` (z. B. `claude-opus-4-6`)
- `rag_usage.provider` = `deepseek` \| `anthropic`
- `calculate_cost(model, ...)` — Eintrag in `pricing.json` / `llm_pricing` pro `api_model`

### 7.3 Streaming-Event-Normalisierung (ragrun → app)

```typescript
type NormalizedStreamEvent =
  | { type: 'token'; text: string }
  | { type: 'thinking'; text: string }      // DeepSeek reasoning_content; Claude extended thinking
  | { type: 'usage'; prompt_tokens: number; completion_tokens: number; model: string }
  | { type: 'done' };
```

---

## 8. Implementierungsreihenfolge (empfohlen)

| Schritt | Repo | Abhängigkeit |
|---|---|---|
| 1. `models.json` + Registry | ragrun | — |
| 2. `OpenAICompatibleClient` (Refactor DeepSeek) | ragrun | 1 |
| 3. `AnthropicClient` (non-streaming) | ragrun | 1 |
| 4. `app_chat` auf `resolve(tier)` | ragrun | 2–3 |
| 5. `GET /app/models` + Profile-Spalten | ragrun + Supabase | 1 |
| 6. `LlmService` + Config | ragprep | 1 |
| 7. CLI-Migration (`think` statt `reasoner`) | ragprep | 6 |
| 8. Streaming normalisiert | ragrun | 2–3 |
| 9. Settings UI + `mode` im Chat | ragapp | 4–5, 8 |

**Vor Phase B (Filo-Streaming):** Schritte 1–2 müssen mindestens für DeepSeek stehen; Claude kann parallel in Schritt 3 folgen.

**Deprecation 2026-07-24:** **ragrun erledigt** — `config.py`-Defaults auf `deepseek-v4-flash`; Chat/Reasoner über `thinking.type`. **ragprep offen** — `constants.ts` / `DeepSeekService.ts` teils noch Legacy-Alias-Namen.

---

## 9. Risiken & Entscheidungen

| Thema | Empfehlung |
|---|---|
| User wählt Opus für Chat | Erlauben, wenn Modell im Katalog `tier` enthält — UI filtert, Backend validiert |
| Retrieval-Jobs vs. User-Modell | MVP: Server-Defaults; User-Settings nur App-Chat |
| Claude „Fable“ API-ID | Vor Implementierung Anthropic-Doku / Kontostand prüfen; ggf. nur UI-Label bis ID feststeht |
| Kostenkontrolle | `app_wallets` später; MVP nur `usage` loggen |
| LangChain vs. native Clients | Retrieval: LangChain beibehalten, aber über Factory mit Provider-Branch; App-Chat: native Clients (weniger Overhead für Streaming) |
| Monorepo-Kopplung ragprep ↔ ragrun | `models.json` als Single Source in `ragrun/config/`; ragprep liest per relativem Pfad — CI-Check auf Parsebarkeit |

---

## 10. Checkliste „Modell-variabel“

### ragrun

- [ ] `config/models.json` — Katalog mit DeepSeek + Claude
- [ ] `LlmClient`-Protocol + OpenAI-compat + Anthropic
- [ ] `app/core/providers.py` — generische `get_llm(tier, model_id?)`
- [ ] Alle `DeepSeekClient`-Imports auf Factory umstellen
- [ ] `anthropic_api_key` in Settings
- [ ] `GET /app/models`, Profile-Felder, `mode` in `/app/chat`
- [ ] Streaming normalisiert
- [ ] `pricing.json` / `llm_pricing` vollständig
- [x] Legacy `deepseek-chat` / `deepseek-reasoner` aus **ragrun-Defaults** entfernt (`deepseek-v4-flash` + `thinking.type`)

### ragprep

- [ ] `LlmService.ts` mit Tier-Auflösung
- [ ] `AnthropicProvider`
- [ ] Env + optional `~/.ragprep/config.yaml`
- [ ] CLI `--llm-tier` / `--llm-model`
- [ ] Alle Commands migriert
- [ ] Tests angepasst
- [ ] `constants.ts` — keine harten DeepSeek-Modellstrings

### ragapp

- [ ] Settings: zwei Modell-Picker
- [ ] Sync Profile-Felder
- [ ] `chatModes.ts` + `modelContextLimits.ts` aus Katalog
- [ ] Chat sendet `mode`; Kontext-Sheet zeigt Modell-Label

---

## 11. Offene Punkte

1. **Exakte Claude-Fable API-ID** — bei Implementierung verifizieren.
2. **Extended Thinking bei Claude** — für Stufe `think` aktivieren oder nur Opus ohne Thinking?
3. **Pro-Turn-Modell-Override** — bewusst nicht im MVP; nur Settings.
4. **Assistants-CLI (README)** — dokumentiert bereits `--model claude-3-5-sonnet`; Legacy-Pfad `assistants_LEGACY/` — klären, ob in neue Abstraktion einbezogen oder eingestellt.
