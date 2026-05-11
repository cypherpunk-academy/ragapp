# Material Theme Import: Figma + ragapp

**Stand:** 2026-05-10  
**Source of Truth:** [`material-theme.json`](./material-theme.json) (Material Theme Builder Export, Seed `#184FC5`)  
**Ableitungen:** [`tokens.json`](./tokens.json) (DTCG / Style Dictionary für ragapp Expo)

Dieses Dokument beschreibt, wie das M3-Theme **einmalig** in Figma als Variables ankommt und wie zukünftige Änderungen synchronisiert werden.

---

## Warum M3 statt eigenem Schema

Der ursprüngliche Plan in `figma-ragapp-guide.md` (Phase 2) sah ein eigenes Naming wie `color/brand/primary`, `color/text/primary` vor. Mit dem Wechsel zu **Material Theme Builder als Quelle** übernehmen wir das **M3-Schema direkt**:

| Plan-alt | M3-neu |
|---|---|
| `color/brand/primary` | `Primary / Primary` |
| `color/text/primary` | `Primary / On Surface` |
| `color/text/secondary` | `Primary / On Surface Variant` |
| `color/background/base` | `Primary / Background` |
| `color/background/surface` | `Primary / Surface` |
| `color/background/elevated` | `Primary / Surface Container` (oder High/Highest) |
| `color/border/default` | `Primary / Outline` |
| `color/border/subtle` | `Primary / Outline Variant` |
| `color/status/success` | (nicht in M3 — eigene Extended Color anlegen) |
| `color/status/error` | `Primary / Error` |
| `color/status/pro` | (nicht in M3 — eigene Extended Color anlegen) |

**Vorteile:**
- 1-Klick-Import via offiziellem Plugin (keine Tipparbeit)
- Konsistente Tonal Palettes (5 × 13 Stops = 65 referenzierbare Farben)
- Light/Dark/Contrast-Modes mathematisch konsistent
- Tooling-kompatibel (MUI, M3 Web, Style Dictionary, Tokens Studio)

**Ausnahmen:**
- `Pro`-Badge (Gold) und `Success` (Grün) sind keine M3-Defaults und müssen als **Extended Colors** im Theme Builder ergänzt werden — siehe Schritt 4 unten.

---

## Schritt 1: Material Theme Builder Plugin in Figma installieren

1. `ragapp-Layout` File öffnen (`https://www.figma.com/design/T6s2FocVkibx6pUG9A4uvw/ragapp-Layout`)
2. Linkes Menü → **Resources** (oder `Shift+I`) → **Plugins** Tab
3. Suchen nach `Material Theme Builder` (offizielles Plugin von **Material Design**, blaues Symbol)
4. **Run**

> Es gibt mehrere ähnliche Plugins. Wichtig: das **offizielle von Material Design**, nicht ein Community-Fork.

---

## Schritt 2: Theme importieren (Color → Variables)

Im Plugin-Panel:

1. Tab **„Custom"** (oder „Themes" → „Custom")
2. **Seed-Farbe eingeben:** `#184FC5`  
   *Optional:* alternativ `Import` → die Datei `ragapp/plans/material-theme.json` wählen, falls das Plugin Import unterstützt (manche Versionen ja, manche nein).
3. Schemes anzeigen lassen — vergleichen, ob die Werte mit unserer `material-theme.json` übereinstimmen (Primary `#4B5C92` etc.)
4. Knopf **„Apply to file"** (oder **„Export to Variables"**) → das Plugin legt automatisch eine Collection `Material Theme` mit zwei Modes (`Light` + `Dark`) und allen Semantic + Reference Variables an.

**Erwartetes Ergebnis nach diesem Schritt:**

In Figma → linkes Panel → Variables-Symbol (vier kleine Quadrate):

```
Material Theme  (Collection)
├─ Modes: Light, Dark
├─ Primary/
│   ├─ Primary, On Primary, Primary Container, On Primary Container
│   └─ Inverse Primary
├─ Secondary/
│   ├─ Secondary, On Secondary, Secondary Container, On Secondary Container
├─ Tertiary/
│   ├─ Tertiary, On Tertiary, Tertiary Container, On Tertiary Container
├─ Error/
│   ├─ Error, On Error, Error Container, On Error Container
├─ Surface/
│   ├─ Background, On Background
│   ├─ Surface, On Surface, Surface Variant, On Surface Variant
│   ├─ Surface Dim, Surface Bright
│   ├─ Surface Container Lowest/Low/Container/High/Highest
│   ├─ Outline, Outline Variant
│   └─ Inverse Surface, Inverse On Surface
└─ Reference/
    ├─ Primary 0…100 (13 Stops)
    ├─ Secondary 0…100
    ├─ Tertiary 0…100
    ├─ Neutral 0…100
    └─ Neutral Variant 0…100
```

**Verifizieren via MCP** (nach Apply):

```bash
# Im Cursor-Chat:
"Lies die Variables aus dem ragapp-Layout File und zeig mir die Primary-Werte"
# → ich rufe get_variable_defs auf und prüfe, ob Primary Light = #4B5C92 und Dark = #B4C5FF
```

---

## Schritt 3: Spacing, Typography, Radius manuell anlegen

Diese Variables legt das Plugin **nicht** an. Sie müssen manuell ins File. Werte stammen aus `tokens.json` (siehe dort für die finalen Zahlen).

### 3a) Collection `Spacing` (kein Mode)

| Name | Value | Verwendung |
|---|---|---|
| `xs` | 4 | Mikrolayout, Inline-Gaps |
| `sm` | 8 | Standard-Gap zwischen Items |
| `md` | 12 | Sektion-Padding klein |
| `lg` | 16 | **Default** Screen-Padding |
| `xl` | 20 | Sektion-Padding groß |
| `2xl` | 24 | Header-Padding |
| `3xl` | 32 | Trenner zwischen Bereichen |
| `4xl` | 40 | Hero-Spacing |
| `5xl` | 48 | Maximaler Spacing |

### 3b) Collection `Typography` (kein Mode)

**Font Size:**
| Name | Value |
|---|---|
| `xs` | 12 |
| `sm` | 14 |
| `md` | 16 |
| `lg` | 18 |
| `xl` | 22 |
| `2xl` | 28 |
| `3xl` | 36 |

**Font Weight** (Number-Variables):
| Name | Value |
|---|---|
| `regular` | 400 |
| `medium` | 500 |
| `semibold` | 600 |
| `bold` | 700 |

**Line Height** (Number-Variables, als Multiplikator):
| Name | Value |
|---|---|
| `tight` | 1.2 |
| `normal` | 1.5 |
| `reading` | 1.75 |

### 3c) Collection `Radius` (kein Mode)

| Name | Value |
|---|---|
| `none` | 0 |
| `xs` | 4 |
| `sm` | 8 |
| `md` | 12 |
| `lg` | 16 |
| `xl` | 28 |
| `full` | 9999 |

---

## Schritt 4: Extended Colors für Pro-Badge & Status

M3 hat keine Standard-Tokens für „Pro-User-Badge" (Gold) oder „Success" (Grün). Im Theme Builder gibt es das Konzept **Extended Colors**.

**Plugin-Weg (sauber):**

1. Material Theme Builder Plugin → Tab „Custom" → unten **„Add extended color"**
2. Hinzufügen:
   - `pro` — Hex `#F5A623` (kräftiges Gold/Orange)
   - `success` — Hex `#2E7D32` (gedämpftes Grün)
3. Plugin generiert Light/Dark-Varianten und ergänzt die `Material Theme` Collection mit `Pro/Pro`, `Pro/On Pro`, `Pro/Pro Container`, `Pro/On Pro Container` (analog für `Success`).

**Wichtig:** wenn du das im Plugin tust, **danach erneut** `Apply to file`, damit die Extended-Colors in den Variables landen.

---

## Schritt 5: Update-Workflow (zukünftige Änderungen)

### Wenn du in Material Theme Builder die Seed-Farbe oder Extended Colors änderst

```
1. Theme Builder: neue material-theme.json exportieren
2. ragapp/plans/material-theme.json überschreiben
3. tokens.json regenerieren (manuell oder Skript — Vorlage: aktuelle tokens.json)
4. Figma: Plugin „Material Theme Builder" → erneut Apply (überschreibt Variables)
5. Expo: style-dictionary build (kommt später, wenn Repo angelegt ist)
```

### Wenn du nur einzelne Werte in Figma feintunst

Werte direkt in Figma Variables editieren. Anschließend:
- **Wenn du die Werte als Code rausspielen willst:** Tokens Studio Plugin → Sync from Variables → Export → ergibt aktualisierte `tokens.json`
- **Wenn nur visuelle Anpassung:** keine Aktion nötig

> Lange Diskussion in `figma-ragapp-guide.md` Phase 6 — bleibt gültig, nur dass die Initial-Befüllung jetzt vom M3-Plugin kommt statt manuell.

---

## Was als nächstes (nach Variables sind drin)

1. **TabBar als Component** im Design System (Phase 3 deines Plans) — einmal sauber, mit 5 Variants
2. **Screens via MCP** ins Design-File übertragen (Phase 4) — der Make-Prototyp dient als Layout-Referenz, die TabBar + Variables sind die Saubermacher
3. **Erst dann**: Expo-Repo anlegen, `style-dictionary build`, RN-Components bauen

---

## Quick-Check: Hat alles geklappt?

Frag mich nach Schritt 2 + 3 einfach: **„Verifiziere die Figma Variables im ragapp-Layout"** — ich rufe `get_variable_defs` auf und liste dir alles auf, was im File steht. Erwartet: 5 Collections (`Material Theme`, `Spacing`, `Typography/Size`, `Typography/Weight`, `Typography/Line Height`, `Radius`).
