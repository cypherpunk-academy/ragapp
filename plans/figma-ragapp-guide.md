# Figma → ragapp: Schritt-für-Schritt-Guide

**Stand:** 2026-05-10
**Figma Plan:** Professional (Variables, Advanced Prototyping, Dev Mode)
**Ziel:** Figma als Single Source of Truth für Design Tokens und UI-Struktur — mit wiederholbarem Export nach Expo/React Native.
**Status & laufende Entscheidungen:** siehe [`figma-import-stand.md`](./figma-import-stand.md)

---

## Übersicht: Die Schnittstelle

```
Figma Variables (Colors, Spacing, Typography, Radius)
        ↓  Tokens Studio Plugin (Export als JSON)
tokens.json
        ↓  Style Dictionary (Transformation)
src/theme/theme.ts         ← Expo liest das
        ↓
React Native Komponenten   ← nutzen theme.*
```

Komponenten werden **manuell** gebaut (kein Auto-Export). Dev Mode ist die Referenz.
Tokens (Farben, Abstände, Schriftgrößen) werden **automatisch** exportiert.

---

## Phase 1: Figma-Projekt anlegen

### 1.1 Seitenstruktur

Lege im Figma-Projekt diese Pages an (Reihenfolge spielt eine Rolle):

```
📄 _Cover          ← Projektübersicht, nicht für Dev
📄 Design System   ← Variables, Components, Styles
📄 Tab / Suche
📄 Tab / Übersicht
📄 Tab / Lesen
📄 Tab / Notizen
📄 Tab / KI-Chat
📄 Konto
📄 Einstellungen
📄 Flows           ← Prototyping-Verbindungen
📄 Archive         ← veraltete Screens
```

### 1.2 Frame-Größen

Primärer Frame: **iPhone 14 Pro** (393 × 852 pt) — Basis für alle Screens.
Zusätzlich: **Android** (360 × 800 pt) für kritische Screens.

Jeder Screen ist ein eigener Top-Level-Frame auf der Seite.
Benennung: `[Tab] / [State]` — z.B. `Lesen / Kapitel geöffnet`, `KI-Chat / Persönlichkeit wählen`.

---

## Phase 2: Variables aufsetzen (Kern der Schnittstelle)

Variables in Figma Professional sind direkt die Design Tokens. Naming Convention muss 1:1 mit `theme.ts` übereinstimmen.

### 2.1 Collections anlegen

Lege 4 Collections an:

| Collection | Enthält | Modes |
|---|---|---|
| `Colors` | Alle Farben | Light, Dark |
| `Typography` | Schriftgrößen, -gewichte, Zeilenhöhen | (kein Mode) |
| `Spacing` | Abstände (8pt-Grid) | (kein Mode) |
| `Radius` | Border Radius | (kein Mode) |

### 2.2 Colors Collection — Material 3 Naming

**Update 2026-05-10:** Wir nutzen **Material 3 Token-Naming** statt eigenem Schema.
Quelle: `config/material-theme.json` (Material Theme Builder Output, Seed `#184FC5`).
Variables werden via **Material Theme Builder Plugin** in Figma generiert.
Siehe `plans/figma-import-stand.md` für die Begründung und das Vorgehen.

Naming-Schema: M3 Token-Roles direkt (kein Slash-Prefix nötig — das Plugin gruppiert
automatisch in eine `Material Theme` Collection).

Wichtigste Tokens (Auswahl, das Plugin legt ~50 an):

```
primary, onPrimary, primaryContainer, onPrimaryContainer
secondary, onSecondary, secondaryContainer, onSecondaryContainer
tertiary, onTertiary, tertiaryContainer, onTertiaryContainer    ← Pro-Badge nutzt tertiary
error, onError, errorContainer, onErrorContainer
surface, onSurface, surfaceVariant, onSurfaceVariant
surfaceContainerLowest, surfaceContainerLow, surfaceContainer,
surfaceContainerHigh, surfaceContainerHighest
background, onBackground
outline, outlineVariant
```

Für **Light** und **Dark** Mode je eigene Werte hinterlegen
(das Plugin macht das automatisch beim Import).

#### Alias auf semantische Verwendung in ragapp

Wenn du im Code lieber sprechende Aliase willst (statt direkt M3-Tokens),
kannst du in `src/theme/theme.ts` ein Mapping anlegen — die Source of Truth
bleiben aber die M3-Variables in Figma:

```typescript
export const semantic = {
  textPrimary:    theme.colors.onSurface,
  textSecondary:  theme.colors.onSurfaceVariant,
  bgBase:         theme.colors.surface,
  bgCard:         theme.colors.surfaceContainerLow,
  bgModal:        theme.colors.surfaceContainerHigh,
  borderDefault:  theme.colors.outline,
  borderSubtle:   theme.colors.outlineVariant,
  proBadge:       theme.colors.tertiary,
}
```

### 2.3 Typography Collection

#### 2.3.1 Font Families — semantische Trennung

Drei Familien mit klarer Bedeutungs-Hierarchie. Begründung und Verwendungsregeln
siehe `figma-import-stand.md` Abschnitt 6.1.

```
font/family/display   → Cinzel              ← Labels, Headlines, Buttons (UPPERCASE bei <15px)
font/family/source    → Cormorant Garamond  ← Autoren-Originaltexte, Excerpts, Zitate
font/family/derived   → Special Elite       ← KI-Output, Notizen, User-Eingaben, History
```

#### 2.3.2 Sizes / Weights / Line-Heights

```
font/size/xs    → 11   ← Cinzel UPPERCASE Tab-Labels (Letter-Spacing +0.5)
font/size/sm    → 12   ← Cinzel UPPERCASE Section-Labels (Letter-Spacing +1.0)
font/size/md    → 14   ← Body small / Caps Buttons
font/size/lg    → 16   ← Body default
font/size/xl    → 18   ← Subtitle / Card-Title
font/size/2xl   → 22   ← App-Bar-Title / Page-Title
font/size/3xl   → 28   ← Hero-Headlines (selten)

font/weight/regular   → 400
font/weight/medium    → 500
font/weight/semibold  → 600
font/weight/bold      → 700

font/line-height/tight    → 1.2   ← Display-Headlines (Cinzel)
font/line-height/normal   → 1.5   ← UI-Text
font/line-height/reading  → 1.75  ← Lesetext (Cormorant, Tab Lesen)

font/letter-spacing/normal  → 0
font/letter-spacing/wide    → 0.5  ← UPPERCASE Tab-Labels
font/letter-spacing/wider   → 1.0  ← UPPERCASE Section-Labels
```

#### 2.3.3 Composite Text-Styles (optional, später)

Sobald Family + Size + Weight + Line-Height + Letter-Spacing als Variables stehen,
lassen sich daraus **Text Styles** in Figma kombinieren — die echten Reusable-Type-Assets:

```
text/label/tab           → Cinzel 11/1.2 +0.5 UPPERCASE
text/label/section       → Cinzel 12/1.2 +1.0 UPPERCASE
text/label/button        → Cinzel 14 +0.5 UPPERCASE
text/title/card          → Cinzel 18/1.3
text/title/page          → Cinzel 22/1.2
text/body/source         → Cormorant Garamond 16/1.75   ← Lesetext
text/body/source-quote   → Cormorant Garamond Italic 16/1.75
text/body/derived        → Special Elite 14/1.5         ← Notiz / KI
text/body/derived-small  → Special Elite 12/1.5         ← History / Meta
```

### 2.4 Spacing Collection (8pt-Grid)

```
spacing/1  → 4
spacing/2  → 8
spacing/3  → 12
spacing/4  → 16
spacing/5  → 20
spacing/6  → 24
spacing/8  → 32
spacing/10 → 40
spacing/12 → 48
```

### 2.5 Radius Collection

```
radius/sm   → 4
radius/md   → 8
radius/lg   → 16
radius/full → 9999
```

---

## Phase 3: Component Library (Design System Page)

### 3.1 Hierarchie

Alle Komponenten auf der "Design System" Page in Sections:

```
Section: Atoms
  Button / Primary
  Button / Secondary
  Button / Ghost
  Badge / Pro
  Badge / Zähler
  Input / Text
  Icon / (alle genutzten Icons)

Section: Molecules
  SearchResult / Item
  ChapterRow / kollabiert
  ChapterRow / aufgeklappt
  ParagraphBlock / Standard
  ParagraphBlock / mit Badges
  NoteCard / eigene
  ChatBubble / User
  ChatBubble / Assistant

Section: Organisms
  TabBar          ← mit 5 aktiven States
  SearchBar
  PersonalityPicker
  ContextMenu / Absatz   ← Long-Press-Menü

Section: Screens / Templates
  Screen / Standard      ← mit Header + TabBar
  Screen / Lesen         ← mit speziellem Header
```

### 3.2 Komponenten-Konventionen

- **Auto Layout** überall — kein festes Positioning
- **Variable-Referenzen** statt Hardcoded-Werte (immer `color/brand/primary`, nie `#4A90E2`)
- **Variants** für States: `Default`, `Pressed`, `Disabled`, `Active`
- **Benennung** entspricht dem React Native Komponentennamen: `Button/Primary` → `<PrimaryButton />`

---

## Phase 4: Die 5 Tabs + Konto + Einstellungen

### 4.1 Tab-Navigation-Komponente

Erstelle `TabBar` als Komponente mit **5 Variants** (je nach aktivem Tab):

```
TabBar / Suche-aktiv
TabBar / Übersicht-aktiv
TabBar / Lesen-aktiv
TabBar / Notizen-aktiv
TabBar / Chat-aktiv
```

Diese Komponente wird in jeden Screen-Frame eingebaut (unten fixiert via Auto Layout).

### 4.2 Screen-Struktur (jeden Tab)

Jeder Screen-Frame folgt diesem Aufbau:

```
Frame: Tab / Suche / Standard
  ├── Header (Komponente)
  ├── Content (scrollbar, Auto Layout vertical)
  │     └── [Tab-spezifische Inhalte]
  └── TabBar / Suche-aktiv (Komponente, unten fixiert)
```

**Screens pro Tab (Mindestmenge):**

| Tab | Screens |
|---|---|
| Suche | `Standard`, `Ergebnisse`, `Offline` |
| Übersicht | `Standard`, `Buch aufgeklappt`, `Kapitel aufgeklappt` |
| Lesen | `Standard`, `Long-Press-Menü offen` |
| Notizen | `Standard`, `Notiz schreiben`, `Notiz-Detail` |
| KI-Chat | `Standard`, `Persönlichkeit wählen`, `Gespräch aktiv`, `Pro-Gate` |

**Konto & Einstellungen** sind **keine Tabs** — sie öffnen sich als Modal oder Push-Screen von der Tab-Bar aus (Profilbild-Tap → Konto, Zahnrad → Einstellungen).

Screens:
- `Konto / Standard`
- `Konto / Pro upgraden`
- `Einstellungen / Standard`
- `Einstellungen / Datenschutz`

---

## Phase 5: Advanced Prototyping

### 5.1 Tab-Navigation verbinden

Auf der "Flows" Page (oder direkt auf den Tab Pages):

Jeder Tab-Button in der `TabBar`-Komponente → `Navigate to` → entsprechenden Screen.

Da `TabBar` eine Komponente ist: Verbindungen **einmal in der Komponente** setzen (Component-level Interactions) — gilt dann automatisch für alle Instanzen.

```
TabBar → Suche-Icon      → Navigate to: Tab/Suche/Standard
TabBar → Übersicht-Icon  → Navigate to: Tab/Übersicht/Standard
TabBar → Lesen-Icon      → Navigate to: Tab/Lesen/Standard
TabBar → Notizen-Icon    → Navigate to: Tab/Notizen/Standard
TabBar → Chat-Icon       → Navigate to: Tab/KI-Chat/Standard
```

### 5.2 Konto & Einstellungen

```
Header / Profilbild  → Open Overlay: Konto/Standard   (Slide-up Modal)
Header / Zahnrad     → Navigate to:  Einstellungen/Standard (Push)
```

### 5.3 Long-Press Context Menu (Tab 3)

```
ParagraphBlock → On Long Press → Open Overlay: ContextMenu/Absatz
ContextMenu / Schließen-Button → Close Overlay
```

### 5.4 Pro-Gate

```
Tab/KI-Chat/Pro-Gate / Upgrade-Button → Open Overlay: Konto/Pro upgraden
```

### 5.5 Scrolling

Für lange Screens (Tab 3 Lesen, Tab 2 Übersicht):
- Frame-Höhe größer als 852pt setzen (z.B. 2000pt)
- Im Prototype-Panel: `Overflow: Vertical scrolling`
- Content-Layer: `Clip content` aus

---

## Phase 6: Export → theme.ts (die eigentliche Schnittstelle)

### 6.1 Tokens Studio Plugin installieren

1. Figma → Plugins → "Tokens Studio for Figma" installieren
2. Plugin öffnen → Settings → Token Storage: **Local file** (für Anfang) oder **GitHub** (für CI)

### 6.2 Variables mit Tokens Studio verbinden

Tokens Studio kann Figma Variables direkt auslesen:
- Plugin → Sync → `Import Variables from Figma`
- Tokens werden als JSON-Struktur dargestellt, die der Variable-Benennung folgt

### 6.3 Export als JSON

Plugin → Export → `tokens.json` (oder direkt in GitHub-Repo wenn Storage = GitHub)

Ausgabe entspricht der Variable-Struktur:
```json
{
  "color": {
    "brand": { "primary": { "value": "#4A90E2", "type": "color" } },
    "text":  { "primary": { "value": "#1A1A1A", "type": "color" } }
  },
  "spacing": {
    "4": { "value": "16", "type": "spacing" }
  }
}
```

### 6.4 Style Dictionary im Expo-Projekt

Im ragapp-Repo:

```
config/
  tokens.json          ← aus Figma exportiert
  style-dictionary.config.js
src/
  theme/
    theme.ts           ← generiert, nie manuell editieren
```

`style-dictionary.config.js`:
```js
module.exports = {
  source: ['config/tokens.json'],
  platforms: {
    ts: {
      transformGroup: 'js',
      buildPath: 'src/theme/',
      files: [{
        destination: 'theme.ts',
        format: 'javascript/es6',
      }]
    }
  }
}
```

Ausführen: `npx style-dictionary build`

### 6.5 theme.ts Ergebnis

```typescript
// GENERIERT — nicht manuell editieren
// Quelle: config/tokens.json (aus Figma Variables via Tokens Studio)

export const theme = {
  colors: {
    brand:      { primary: '#4A90E2', secondary: '#...' },
    text:       { primary: '#1A1A1A', secondary: '#...', muted: '#...' },
    background: { base: '#FFFFFF', surface: '#F5F5F5', elevated: '#...' },
    border:     { default: '#E0E0E0', subtle: '#...' },
    status:     { pro: '#F5A623' },
  },
  spacing:    { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32 },
  fontSize:   { xs: 12, sm: 14, md: 16, lg: 18, xl: 24 },
  fontWeight: { regular: '400', medium: '500', semibold: '600' },
  lineHeight: { tight: 1.2, normal: 1.5, reading: 1.75 },
  radius:     { sm: 4, md: 8, lg: 16, full: 9999 },
}

export type Theme = typeof theme
```

---

## Phase 7: Wiederholbarer Update-Workflow

### Wenn sich Tokens ändern (Farbe, Abstand, Schrift)

```
1. Figma: Variable-Wert ändern
2. Tokens Studio: Export → tokens.json überschreiben
3. Expo: npx style-dictionary build → theme.ts neu generiert
4. Keine Komponente anfassen nötig
```

### Wenn sich Komponenten-Layout ändert

```
1. Figma: Komponente anpassen
2. Dev Mode: Werte ablesen (Abstände, Größen)
3. Expo: React Native Komponente manuell anpassen
   (theme.*-Werte verwenden, keine Hardcoded-Werte)
```

### Wenn neue Screens hinzukommen

```
1. Figma: Screen auf der entsprechenden Tab-Page anlegen
2. Figma: Prototyp-Verbindungen setzen
3. Expo: Screen-Komponente anlegen (expo-router file)
4. Expo: Komponenten aus Library wiederverwenden
```

### CI-Automatisierung (optional, später)

Tokens Studio kann direkt in ein GitHub-Repo schreiben (Token Storage = GitHub).
Dann: GitHub Action auf Push → `style-dictionary build` → `theme.ts` automatisch aktualisiert.

---

## Phase 8: Dark Mode

Figma Variables haben bereits Light/Dark Modes definiert (Phase 2).
Tokens Studio exportiert beide Modes.
In Expo: `useColorScheme()` → `theme.colors` aus dem passenden Mode laden.

Style Dictionary Konfiguration: zwei separate Outputs (`theme.light.ts`, `theme.dark.ts`) oder ein kombiniertes Objekt mit `light`/`dark` Keys.

---

## Zusammenfassung: Was automatisch, was manuell

| | Automatisch | Manuell |
|---|---|---|
| Farben, Abstände, Schriften | Tokens Studio → Style Dictionary → theme.ts | — |
| Dark Mode | Figma Variable Modes → theme.ts | — |
| Komponenten-Layout | — | Dev Mode ablesen → RN-Komponente anpassen |
| Neue Screens | — | expo-router File anlegen |
| Navigation/Flows | — | expo-router Links |
| Prototyp (Figma intern) | — | Figma Prototype-Verbindungen |

---

## Checkliste: Projekt-Setup

- [ ] Figma-Projekt anlegen, Pages nach Struktur (Phase 1)
- [ ] 4 Variable-Collections anlegen mit korrektem Naming (Phase 2)
- [ ] Tokens Studio Plugin installieren + mit Variables verbinden (Phase 6.1/6.2)
- [ ] Component Library aufbauen: Atoms → Molecules → Organisms (Phase 3)
- [ ] TabBar-Komponente mit 5 Variants (Phase 4.1)
- [ ] Screens für alle Tabs anlegen (Phase 4.2)
- [ ] Prototyp-Verbindungen setzen (Phase 5)
- [ ] Ersten Export: tokens.json → theme.ts (Phase 6.3–6.5)
- [ ] Style Dictionary ins ragapp-Repo integrieren (Phase 6.4)
- [ ] Update-Workflow testen (Phase 7)
