# Figma-Import: Aktueller Stand

**Stand:** 2026-05-10
**Vorgängerdokument:** [`figma-ragapp-guide.md`](./figma-ragapp-guide.md)
**Zweck:** Fortschritt und Entscheidungen während der Übertragung Figma Make → Figma Design-File → ragapp.

---

## 1. Was schon steht

| Bereich | Status | Quelle / ID |
|---|---|---|
| Figma MCP in Cursor | ✅ Eingerichtet (Remote, OAuth) | `~/.cursor/mcp.json` |
| Figma Design-File | ✅ Variables + 1. Component im Aufbau | Key `T6s2FocVkibx6pUG9A4uvw` |
| Figma Make Prototyp | ✅ Vollständig analysiert | Key `b3eTEZ5MJmY86UYdD0EI1A` |
| Material-3-Theme | ✅ Generiert via Material Theme Builder | `config/material-theme.json` |
| Color Variables (M3) | ✅ Import via Plugin, 49 Tokens × 6 Modes | Collection `material-theme` |
| Tokens Variables | ✅ Spacing (9) + Radius (4) + Typography (20) | Collection `Tokens` |
| Fonts | ✅ Cinzel/Cormorant Garamond/Special Elite (Google Fonts) | Familie geladen in Figma |
| **TabBar Component-Set** | ✅ 5 Variants (`active=Suche/…/KI-Chat`), 393×80px | Node `37:86` auf `Design System` |
| **AppBar Component** | ✅ 1 Component + 2 Properties (`Title:TEXT`, `Offline:BOOLEAN`), 393×64px | Node `43:2` auf `Design System` |
| **SearchBar Component** | ✅ 1 Component + 3 Properties, Pill 393×56px, Special-Elite-Placeholder | Node `51:24` auf `Design System` |
| **ResultCard Component-Set** | ✅ **5 Type-Variants** (`type=buch/vortrag/gespräch/zitat/zusammenfassung`) + 7 Properties + DropShadow | Set `76:80` auf `Design System` |
| **Suche / Default Screen** | ✅ Demo mit gemischten Type-Variants (Buch + Vortrag + Zitat) | Node `57:2` auf `Tab / Suche` |

---

## 2. Was im Make-Prototyp existiert

### 2.1 Screens (alle 7 MVP-Screens da)

```
src/app/components/
├── SucheScreen.tsx
├── UebersichtScreen.tsx
├── LesenScreen.tsx
├── NotizenScreen.tsx
├── KIChatScreen.tsx
├── KontoScreen.tsx
└── EinstellungenScreen.tsx
```

### 2.2 Semantische Sub-Components (passt 1:1 zum Plan)

```
SearchBar         ResultCard       ChapterRow
ChatBubble        NoteCard         BookCover
BookEntry
```

### 2.3 App-Struktur (Make-`App.tsx`)

- iPhone-14-Pro-Container (393×852, BorderRadius 44 für die Mockup-Frame)
- AppBar oben (Title + Offline-Indicator + Avatar-Menü → Konto/Einstellungen)
- BottomNavigation mit 5 Tabs (Suche, Übersicht, Lesen, Notizen, KI-Chat)
- ThemeProvider mit Light/Dark-Switch

**Abweichung vom Plan:** Im Make ist die TabBar direkt MUI `BottomNavigation`,
nicht eine eigene Component mit 5 Variants. → muss in Figma als eigene Component neu konzipiert werden.

### 2.4 Theming im Make-Prototyp (verworfen zugunsten von Material Theme Builder)

- `src/app/theme.ts` (MUI mit Material-3-Default-Lila #6750A4) — wurde tatsächlich genutzt
- `src/styles/theme.css` (shadcn/ui mit fast-schwarz #030213) — toter Boilerplate

→ **Beide werden ersetzt durch das neue Material Theme Builder JSON.**

---

## 3. Das neue Theme (Material Theme Builder Output)

**Seed:** `#184FC5` (sattes Blau)
**Generierte Primary (Light):** `#4B5C92` (M3 entsättigt das Blau zu einem ruhigen Blau-Lila)

### 3.1 Was im JSON steckt

- **6 Color Schemes:** `light`, `light-medium-contrast`, `light-high-contrast`, `dark`, `dark-medium-contrast`, `dark-high-contrast`
- **5 Tonal Palettes:** `primary`, `secondary`, `tertiary`, `neutral`, `neutral-variant` — je 18 Tonstufen (0-100)
- **~50 Color Tokens pro Mode** — komplette Material-3-Token-Hierarchie

### 3.2 Material 3 Token-Roles (Auswahl)

| Role | Light | Dark | Verwendung |
|---|---|---|---|
| `primary` | `#4B5C92` | `#B4C5FF` | Brand-Akzent (Buttons, aktive Tabs) |
| `onPrimary` | `#FFFFFF` | `#1B2D60` | Text auf Primary |
| `primaryContainer` | `#DBE1FF` | `#334478` | Sanfte Brand-Flächen |
| `onPrimaryContainer` | `#334478` | `#DBE1FF` | Text auf primaryContainer |
| `secondary` | `#595E72` | `#C1C5DD` | Sekundär-Akzent |
| `tertiary` | `#745470` | `#E2BBDB` | Akzent für Pro-Badge oder Notizen-Highlight |
| `surface` | `#FAF8FF` | `#121318` | App-Background |
| `surfaceContainer` | `#EEEDF4` | `#1E1F25` | Cards, elevated Inputs |
| `surfaceContainerHigh` | `#E9E7EF` | `#292A2F` | Modals, Sheets |
| `onSurface` | `#1A1B21` | `#E3E2E9` | Primärtext |
| `onSurfaceVariant` | `#45464F` | `#C5C6D0` | Sekundärtext |
| `outline` | `#757680` | `#8F909A` | Borders default |
| `outlineVariant` | `#C5C6D0` | `#45464F` | Borders subtle |
| `error` | `#BA1A1A` | `#FFB4AB` | Fehler-Status |

---

## 4. Naming-Entscheidung (offen)

Der ursprüngliche Plan in `figma-ragapp-guide.md` Phase 2 nutzte ein **eigenes**
Naming-Schema mit 14 Color-Tokens:

```
color/brand/primary, color/text/primary, color/background/base,
color/border/default, color/status/pro, …
```

Material 3 hat **~50 Tokens** und das offizielle M3-Naming
(`primary`, `onPrimary`, `surfaceContainer`, …).

**Empfehlung: M3-Naming komplett übernehmen.**

| Vorteil | Begründung |
|---|---|
| Direkter Plugin-Import | Material Theme Builder Plugin in Figma kann `material-theme.json` direkt zu Variables machen — mit M3-Namen |
| Mehr Granularität gratis | M3 löst typische Probleme (Container-Hierarchie, On-Colors, Tonal Palettes) automatisch |
| Tooling-Konsistenz | Wenn ragapp später `react-native-paper` einsetzt, hat das schon M3-Theming eingebaut |
| Doku verfügbar | M3-Roles haben offizielle Verwendungs-Beispiele auf m3.material.io |

**Mapping vom Plan auf M3 (zur Referenz):**

| Plan-Token | M3-Token | Verwendung |
|---|---|---|
| `color/brand/primary` | `primary` | identisch |
| `color/brand/secondary` | `secondary` | identisch |
| `color/text/primary` | `onSurface` | Text auf surface |
| `color/text/secondary` | `onSurfaceVariant` | gedämpft |
| `color/text/muted` | `outline` | sehr gedämpft |
| `color/text/on-accent` | `onPrimary` | Text auf Brand-Button |
| `color/background/base` | `surface` | App-BG |
| `color/background/surface` | `surfaceContainerLow` | Card-BG |
| `color/background/elevated` | `surfaceContainerHigh` | Modal-BG |
| `color/border/default` | `outline` | identisch zu text/muted (M3-Konvention) |
| `color/border/subtle` | `outlineVariant` | hellere Borders |
| `color/status/error` | `error` | identisch |
| `color/status/pro` | `tertiary` | das warme Lila aus M3 |
| `color/status/success` | (nicht in M3, eigene Token nötig) | manuell `#1F8B4C` o.ä. |

→ Plan-Datei `figma-ragapp-guide.md` muss in Phase 2.2 entsprechend angepasst werden.

---

## 5. Nächste Schritte (in dieser Reihenfolge)

### Schritt 1 — Variables in Figma anlegen

**Empfohlene Methode:** Material Theme Builder Plugin in Figma.

1. Im Figma Design-File: **Plugins → Browse → „Material Theme Builder"** (offizielles Plugin von Google) installieren
2. Plugin öffnen → **„Import"** → `config/material-theme.json` aus diesem Repo laden
3. Plugin generiert automatisch:
   - Variables Collection mit allen M3-Tokens (Light + Dark Mode)
   - Color Styles (optional, kann übersprungen werden — wir nutzen Variables)

Ergebnis: Sechs Modi werden verfügbar. Für den Anfang reichen **Light** und **Dark**;
die Contrast-Varianten (Medium/High) sind für Accessibility später.

### Schritt 2 — Spacing/Typography/Radius Variables

Material Theme Builder generiert nur Farben. Spacing/Typography/Radius
muss separat angelegt werden (siehe `figma-ragapp-guide.md` Phasen 2.3–2.5).

Werte aus dem Plan unverändert übernehmen:
- Spacing: 4, 8, 12, 16, 20, 24, 32, 40, 48
- Typography: xs/sm/md/lg/xl/2xl + 3 Weights + 3 Line-Heights
- Radius: sm/md/lg/full

### Schritt 3 — TabBar als erste Component

Bevor wir die 7 Screens kopieren, eine saubere `TabBar` als Figma-Component
mit 5 Variants designen (siehe `figma-ragapp-guide.md` Phase 4.1).

### Schritt 4 — 7 Screens via MCP übertragen

Mit `generate_figma_design` (Layout-Referenz) + `use_figma` (DS-Components)
die 7 Make-Screens ins Design-File übertragen.

### Schritt 5 — `theme.ts` für Expo generieren

Style Dictionary Pipeline aufsetzen (`figma-ragapp-guide.md` Phase 6).
Quell-JSON: `config/material-theme.json`.
Ziel: `src/theme/theme.ts` für Expo.

---

## 6. Getroffene Entscheidungen

| Frage | Entscheidung |
|---|---|
| Naming-Schema | **M3-Naming durchziehen** (`primary`, `onPrimary`, `surfaceContainer`, …) |
| Pro-Badge-Farbe | **M3 `tertiary`** nutzen (warm-lila, schon im Theme) |
| Success-Farbe | **Vorerst weglassen** (kein Use-Case identifiziert) |
| Contrast-Modes | **Ignorieren** — nur `light` + `dark` als Variable Modes |
| Typografie-Familien | **4 semantische Familien** (Cinzel / **Marcellus** / Cormorant Garamond / Special Elite) — Marcellus übernimmt die Cinzel-Rolle bei kleinen UPPERCASE-Labels (11px) |

### 6.1 Typografie-Strategie (semantische Trennung)

Drei Schriftfamilien mit klarer **Bedeutungs-Hierarchie** — der Schrifttyp signalisiert
visuell die Quelle des Texts:

| Token | Familie | Verwendung |
|---|---|---|
| `font/family/display` | **Cinzel** | UI-Labels, Headlines, Buttons, Tab-Labels, Section-Titles, App-Bar — alles **Strukturelle/Funktionale** |
| `font/family/source` | **Cormorant Garamond** | Autoren-Texte: Buchtext (LesenScreen), Excerpts in Suchergebnissen, Zitate — alles aus den **Originalquellen** |
| `font/family/derived` | **Special Elite** | KI-Chat-Antworten, AI-Zusammenfassungen, Notizen, User-Kommentare, „Letzte Suchanfragen" — alles **Generierte/Notierte** (Schreibmaschinen-Look = „von Menschen oder Maschinen getippt") |

**Warum das gut ist:** Die Lesenden erkennen sofort an der Schrift, ob sie gerade
**Steiners eigene Worte** sehen oder ob es sich um **abgeleiteten Inhalt** (KI-Output, eigene Notizen) handelt. Das ist eine ungewöhnliche, aber für eine Steiner-App
sehr passende Designentscheidung — die App nimmt die Authentizität der Quelle
ernst.

**Cinzel-Caveat (Kleinschrift) — gelöst 2026-05-11:** Cinzel Regular @ 11px war
schwer lesbar (zu zarte Striche). Cinzel ist in Figma nur in 3 Weights verfügbar
(Regular/Bold/Black), kein Semibold. Cinzel Bold wirkte zu plakativ.

**Lösung: Marcellus Regular @ 12px (`font/size/sm`)** für alle UPPERCASE-Labels.
Marcellus hat natürlich dickere Striche, klassisch-elegant, deutlich besser lesbar.
Cinzel bleibt für 18px+ Headlines (App-Bar-Title, Card-Title — wo Mixed Case/Small Caps gut funktioniert).

| Größe | Token | Schrift | Modus | Verwendung |
|---|---|---|---|---|
| 9 px | (kein Token) | Marcellus Regular | UPPERCASE | Badge-Numbers (selten) |
| **12 px** | **`font/size/sm`** | **Marcellus Regular** | **UPPERCASE +0.5/+1.0** | **Tab-Labels, Chapter, Author, Relevance, Section-Headlines** |
| 14 px | `font/size/md` | Marcellus oder Special Elite (User-Input) | Mixed Case | Body small |
| 16 px | `font/size/lg` | Cormorant Garamond (Source) / Special Elite (Input) | Mixed Case | Body default, Reading-Text |
| 18 px | `font/size/xl` | Cinzel Regular | Mixed Case (Small-Caps-Wirkung) | Card-Title |
| 22 px | `font/size/2xl` | Cinzel Regular | Mixed Case | AppBar-Title — Buch-Titel-Look |

Die `font/size/xs` (11) Variable bleibt im Token-Set für mögliche zukünftige Caption-Use-Cases —
aktuell wird sie nicht verwendet.

### 6.2 Google Fonts — Verfügbarkeit

Alle vier Familien sind Google Fonts (kostenlos, OFL-Lizenz):

- [Cinzel](https://fonts.google.com/specimen/Cinzel) — Google Fonts: 400/500/600/700/800/900. **In Figma installiert nur: 400, 700, 900** → bei Bedarf Family komplett installieren.
- [Marcellus](https://fonts.google.com/specimen/Marcellus) — nur Regular (400) — Single-Weight ist typisch für historische Schriften, das ist das Konzept
- [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) — Weights: 300, 400, 500, 600, 700 + Italics
- [Special Elite](https://fonts.google.com/specimen/Special+Elite) — nur 400 Regular (Single-Weight by design)

In Expo via `expo-font`:
```typescript
import { useFonts } from 'expo-font'
useFonts({
  'Cinzel': require('./assets/fonts/Cinzel-Regular.ttf'),
  'Cinzel-Bold': require('./assets/fonts/Cinzel-Bold.ttf'),
  'Marcellus': require('./assets/fonts/Marcellus-Regular.ttf'),
  'CormorantGaramond': require('./assets/fonts/CormorantGaramond-Regular.ttf'),
  'CormorantGaramond-Italic': require('./assets/fonts/CormorantGaramond-Italic.ttf'),
  'SpecialElite': require('./assets/fonts/SpecialElite-Regular.ttf'),
})
```

Folgen für `figma-ragapp-guide.md`:
- Phase 2.2 wird auf M3-Naming umgestellt (passiert in dieser Session)
- Phase 8 (Dark Mode) bleibt unverändert — funktioniert weiter genauso

---

## 7. Konkrete nächste Klicks (Schritt 1 ausführen)

### 7.1 Material Theme Builder Plugin installieren

1. Figma-Design-File `ragapp-Layout` öffnen
2. Toolbar oben → Resources-Symbol (das mit dem Stecker) → Tab **„Plugins"**
3. Suche: **„Material Theme Builder"** — der mit dem Google-Logo (offiziell von Material Design)
4. **„Run"** klicken → Plugin öffnet sich am rechten Rand

### 7.2 Theme importieren

1. Im Plugin oben rechts auf **„Import"** (Pfeil nach oben)
2. JSON-Datei wählen: `ragapp/config/material-theme.json` (im ragapp-Repo)
3. Plugin lädt das Theme — du siehst die Color-Roles auf einem Demo-Frame
4. Im Plugin: **„Export"** → Sektion **„Variables"** → **„Create variables"** klicken

Das Plugin legt jetzt automatisch an:
- Eine Variables Collection (typisch `Material Theme` benannt)
- Modes `light` und `dark`
- Alle ~50 M3-Color-Tokens als Variables

### 7.3 Sanity-Check via MCP

Wenn Variables fertig angelegt sind, melde dich kurz —
ich rufe `get_variable_defs` auf das File auf und verifiziere die Werte.

---

## 8. TabBar Component-Set (gebaut 2026-05-10)

### 8.1 Struktur

```
TabBar (Component Set, Page: Design System, ID: 37:86)
├── active=Suche      (Node 31:2)
├── active=Übersicht  (Node 37:2)
├── active=Lesen      (Node 37:23)
├── active=Notizen    (Node 37:44)
└── active=KI-Chat    (Node 37:65)

Jede Variant: 393×80, Auto-Layout Horizontal, padding-bottom 24 (iOS Safe Area)
Fill:    Schemes/Surface           Top-Border: Schemes/Outline Variant (1px)
Children: 5× Tab (Auto-Layout Vertical, gap 4)
  ├── Icon (FRAME 24×24, fills=[])
  │    └── Vector (Material Icon SVG-Path, fill bound to Primary | OnSurfaceVariant)
  └── Label (TEXT Cinzel 11px UPPERCASE, letter-spacing +0.5, fill bound wie Icon)
```

Material Icons (gefilled): `Search` · `Dashboard` · `MenuBook` · `StickyNote2` · `Chat`

### 8.2 Color-Logic

| Tab-State | Icon-Vector | Label |
|---|---|---|
| Active   | `Schemes/Primary` (`#4B5C92` light, `#B4C5FF` dark)              | `Schemes/Primary` |
| Inactive | `Schemes/On Surface Variant` (`#45464F` light, `#C5C6D0` dark)   | `Schemes/On Surface Variant` |

Dark-Mode-Support automatisch durch Variable-Bindings.

### 8.3 Polish-Backlog

- Aktiver Tab könnte einen **Active-Indicator als Pill** bekommen (Material 3 Standard):
  Pill in `Schemes/Secondary Container` als Background hinter dem Icon, BorderRadius 16.
  Macht den aktiven Tab deutlich sichtbarer als nur Color-Switch.
- Touch-Feedback (Pressed-State) — kommt erst beim React-Native-Mapping.

---

## 9. Erkenntnisse zu `use_figma` (für künftige Plugin-Skripts)

| Pattern | Regel |
|---|---|
| **Write-Operations** | NIE mit `throw new Error(...)` enden — Figma rollt die ganze Transaction zurück. Stattdessen: `figma.notify('msg')` + Resultat in `figma.root.setSharedPluginData('rag', 'lastBuild', JSON.stringify(...))` ablegen. |
| **Read-Operations** | `throw new Error('PAYLOAD: ' + JSON.stringify(...))` ist OK als Output-Vehikel, weil nichts persistiert werden muss. |
| **Read-back** | In einem Folge-Call: `figma.root.getSharedPluginData('rag', 'lastBuild')` + `throw` |
| **SVG-Import** | `figma.createNodeFromSvg(svgString)` erzeugt einen FRAME-Wrapper mit eigenem Fill. Variable-Bindings nur auf den inneren VECTOR setzen; den Frame mit `node.fills = []` transparent machen. |
| **Cloning + Re-Binding** | Beim Klonen einer Component und anschließendem Re-Bind muss der **Fallback-Color im Paint** mit dem echten Variable-Wert übereinstimmen — Figma rendert sonst in manchen Variants die Fallback statt der gebundenen Variable (`{r:1,g:1,b:1}` → weiße Icons). |
| **Variant-Sets** | `figma.combineAsVariants([components], page)`; Component-Namen müssen `property=value` sein, der Set-Name wird nachträglich gesetzt. |
| **Fonts** | `await figma.loadFontAsync({ family, style })` VOR `createText()`/`fontName=`. Custom Google Fonts (Cinzel, Cormorant Garamond, Special Elite) sind in Figma verfügbar. |

---

## 10. AppBar Component (gebaut 2026-05-10)

### 10.1 Struktur

```
AppBar (Component, Page: Design System, ID: 43:2)
  Auto-Layout Horizontal, 393×64, padding 8/16, gap 8
  Fill:    Schemes/Surface    Stroke-Bottom: Schemes/Outline Variant (1px)
  ├── Title (TEXT, Cinzel 22px, fill: Schemes/On Surface, layoutSizing FILL)
  ├── OfflineIcon (FRAME 24×24, Material Icon CloudOff)
  │    └── Vector (fill: Schemes/On Surface Variant)
  └── Avatar (FRAME 32×32, BorderRadius 16, fill: Schemes/Primary)
        └── Person (FRAME 20×20, Material Icon Person, fill: Schemes/On Primary)
```

### 10.2 Component Properties (statt Variants!)

| Property | Type | Default | Effekt |
|---|---|---|---|
| `Title` | TEXT | `"Suche"` | bindet an `Title.characters` — Instance kann frei umbenannt werden |
| `Offline` | BOOLEAN | `false` | bindet an `OfflineIcon.visible` — Icon erscheint nur bei `true` |

### 10.3 Variants vs. Properties — Designentscheidung

| Property-Art | Wann zu nutzen? |
|---|---|
| **Variants** (TabBar-Style) | Wenn sich **mehrere visuelle Eigenschaften gleichzeitig** ändern (z.B. Active-State ändert Icon-Color UND Label-Color für jeweils 1 von 5 Tabs) |
| **Component Properties** (AppBar-Style) | Wenn nur **einzelne Sub-Elemente** ändern (Text-Inhalt, ein Icon ein/aus) — vermeidet Variant-Explosion |

→ Für die 14 möglichen AppBar-States (7 Screens × 2 Offline-Modes) hätten Variants 14 Komponenten erzeugt. Mit 2 Properties: 1 Component, alle Konfigurationen möglich.

### 10.4 Plugin-API-Snippets

```javascript
// Property anlegen (gibt Property-Key zurück: "Title#43:0")
const titleProp = component.addComponentProperty('Title', 'TEXT', 'Suche');
const offlineProp = component.addComponentProperty('Offline', 'BOOLEAN', false);

// Property an Sub-Element binden
textNode.componentPropertyReferences = { characters: titleProp };
iconFrame.componentPropertyReferences = { visible: offlineProp };

// Instance erzeugen + Properties setzen
const inst = component.createInstance();
inst.setProperties({ [titleProp]: 'Lesen', [offlineProp]: true });
```

---

## 11. SearchBar Component (gebaut 2026-05-10)

### 11.1 Struktur

```
SearchBar (Component, Page: Design System, ID: 51:24)
  Auto-Layout Horizontal, 393×56, padding 8/16, gap 12
  BorderRadius 28 (Pill)    Fill: Schemes/Surface Container    clipsContent: false
  ├── SearchIcon (FRAME 24×24, Material Search SVG, fill: Schemes/On Surface Variant)
  ├── Placeholder (TEXT, **Special Elite 14px**, fill: Schemes/Outline (gedämpft), FILL horizontal)
  └── Filter (FRAME 24×24, clipsContent: false)
        ├── FilterIcon (Material FilterList SVG, fill: Schemes/On Surface Variant)
        └── Badge (FRAME 14×14, BorderRadius 7, fill: Schemes/Primary, position x=14 y=-4)
              └── BadgeNumber (TEXT, Cinzel 9px, fill: Schemes/On Primary)
```

### 11.2 Component Properties

| Property | Type | Default | Effekt |
|---|---|---|---|
| `Placeholder` | TEXT | `"Bücher, Vorträge durchsuchen…"` | bindet an `Placeholder.characters` |
| `Filter Count` | TEXT | `"2"` | bindet an `BadgeNumber.characters` |
| `Show Badge` | BOOLEAN | `true` | bindet an `Badge.visible` — Badge hidden, wenn 0 Filter aktiv |

### 11.3 Typografie-Entscheidung: Special Elite für Such-Input

Begründung: Der Such-Input ist die Hauptstelle, an der **der Nutzer selbst tippt**. Die Schreibmaschinen-Schrift macht das visuell explizit — der Cursor blinkt in Special Elite. Konsistent zur Typografie-Strategie (`derived = von Mensch/Maschine getippt`).

**Placeholder-Polish (2026-05-11):** Special Elite hat eine dichte Strichführung; bei 16px wirkte der Placeholder fast wie regulärer Text, nicht wie "leer / lädt ein zum Tippen". → Placeholder auf **14px + `Schemes/Outline`** (heller grau #757680, statt onSurfaceVariant #45464F) reduziert. Macht den Input klar als "noch unausgefüllt" lesbar.

Badge bleibt bei Marcellus 9px (UI-Element, strukturell).

---

## 12. ResultCard Component (gebaut 2026-05-10)

### 12.1 Struktur

```
ResultCard (Component, Page: Design System, ID: 53:24, 361×Auto)
  Auto-Layout Vertical, padding 16/16, gap 8, CornerRadius 16
  Fill: Schemes/Surface Container Low    Stroke: Schemes/Outline Variant (1px)
  DropShadow: y=2, blur=8, color=rgba(0,0,0,0.08)  ← "library card" Elevation
  ├── Header (Frame, Auto-Layout Horizontal, gap 8, align MIN top)
  │     ├── TitleBlock (Auto-Layout Vertical, gap 4, FILL horizontal)
  │     │     ├── Title (Cinzel 18px, fill Schemes/On Surface)
  │     │     └── Chapter (Cinzel 11px UPPERCASE +0.5, fill Schemes/Primary)
  │     └── TypeIcon (Material MenuBook 24×24, fill Schemes/On Surface Variant)
  ├── Excerpt (Cormorant Garamond 16px / line-height 175%, fill Schemes/On Surface)
  └── Footer (Auto-Layout Horizontal, gap 6, align center)
        ├── Author (Cinzel 11px UPPERCASE +1, fill Schemes/On Surface Variant)
        ├── Separator (Cinzel "•" 11px)
        └── Relevance (Cinzel 11px UPPERCASE +1)
```

### 12.2 Component Properties

| Property | Type | Default |
|---|---|---|
| `Title` | TEXT | `"Die Philosophie der Freiheit"` |
| `Chapter` | TEXT | `"KAPITEL 9 — DIE IDEE DER FREIHEIT"` |
| `Show Chapter` | BOOLEAN | `true` |
| `Excerpt` | TEXT | `"Der Mensch ist frei, insofern er in jedem…"` (voller Steiner-Originaltext) |
| `Author` | TEXT | `"RUDOLF STEINER"` |
| `Relevance` | TEXT | `"RELEVANZ 92%"` |
| `Show Relevance` | BOOLEAN | `true` → versteckt Separator UND Relevance gleichzeitig |

### 12.3 Erkenntnisse zu Component Properties

| Detail | Verhalten |
|---|---|
| **`addComponentProperty(name, type, defaultValue)`** | Setzt Property-Wert UND überschreibt die existing `characters`, wenn an Text-Node gebunden. → bei langem Master-Default lieber direkt den vollen Wert als `defaultValue` übergeben. |
| **`editComponentProperty(key, { defaultValue })`** | Updated Property-Default nachträglich — Master-Text wird sofort neu gerendert. |
| **Mehrere Bindings pro Node** | `componentPropertyReferences = { characters: propA, visible: propB }` — ein Node kann an mehrere Properties gebunden sein. |
| **Property auf mehrere Nodes** | Eine BOOLEAN-Property kann an `visible` mehrerer Nodes gebunden werden (z.B. `Show Relevance` versteckt Separator UND Relevance gleichzeitig). |

### 12.4 Typografie-Strategie in Aktion

Diese Component ist der erste Ort, an dem alle drei Schriften ihre Rollen gleichzeitig zeigen:

- **Cinzel** in Title, Chapter, Author, Relevance → **Struktur / UI / Metadata**
- **Cormorant Garamond** im Excerpt → **Source-Text (Steiners eigene Worte)**
- (Special Elite wäre hier bei Notiz-Cards — kommt mit NoteCard)

Der Nutzer erkennt allein an der Schrift, was Steiner-Original ist (Cormorant) und was App-Metadata ist (Cinzel). Diese visuelle Trennung ist im MVP wichtig, weil später KI-Antworten in Special Elite hinzukommen — dann sind alle drei "Schichten" gleichzeitig auf dem Screen sichtbar und sofort unterscheidbar.

---

## 13. Suche / Default Screen (gebaut 2026-05-10)

### 13.1 Komposition

```
Frame "Suche / Default" (393×852, CornerRadius 44, fill Schemes/Surface, clipsContent)
  Page: Tab / Suche    ID: 57:2
  ├── AppBar Instance @ (0, 0)         Title="Suche", Offline=true
  ├── SearchSection Frame @ (0, 64)    Auto-Layout 16/16 padding, 393×72
  │     └── SearchBar Instance         FILL horizontal (361 wide)
  ├── Content Frame @ (0, 136)         Auto-Layout Vertical, 393×636, padding 8/16, gap 12
  │     ├── ResultCard 1               Philosophie der Freiheit, Relevanz 92%
  │     ├── ResultCard 2               Theosophie, Relevanz 87%
  │     └── ResultCard 3               Geheimwissenschaft im Umriss, Relevanz 81%
  └── TabBar Instance @ (0, 772)       Variant: active=Suche
```

### 13.2 Was dieser Screen demonstriert

Erstmals sind **alle drei Schriften und ihre Bedeutungen gleichzeitig sichtbar**:

| Layer | Schrift | Im Screen sichtbar bei |
|---|---|---|
| UI-Strukturen | Cinzel | AppBar-Title "SUCHE", Tab-Labels, Card-Titles, Author/Relevance, Badge "2" |
| User-Eingabe | **Special Elite** | SearchBar-Placeholder "Bücher, Vorträge durchsuchen…" |
| Steiner-Originaltexte | **Cormorant Garamond** | Alle 3 Excerpts der ResultCards |

Diese visuelle Trennung wird im fertigen Suche-Screen noch deutlicher, wenn:
- User echte Suche eintippt (Special Elite Cursor)
- Cards aufklappen und längere Originaltexte zeigen (Cormorant)
- KI-Zusammenfassung darüber gelegt wird (Special Elite, künftig)

### 13.3 Offene Polish-Punkte

| Punkt | Status / Idee |
|---|---|
| SearchBar-Placeholder umbricht auf 2 Zeilen | ✅ **Gelöst (2026-05-11):** Special Elite 14px + Outline-Grau, passt 1-zeilig |
| Card-Shadows | ✅ **Gelöst (2026-05-11):** DropShadow y=2, blur=8, rgba(0,0,0,0.08) |
| Marcellus 11px vs Cinzel Bold | ✅ **Gelöst (2026-05-11):** Marcellus auf 12px erhöht, deutlich besser unterscheidbar |
| Status-Bar (iOS Notch / Dynamic Island) | Aktuell nicht modelliert. Bei Bedarf ein 47px-Frame oben mit Notch-Mock. |
| Pull-to-refresh / Loading-State | Nicht im MVP. |
| Active-Indicator Pill in TabBar | Optional, M3-style Pill hinter aktivem Icon |

---

## 14. ResultCard Variant Set (gebaut 2026-05-11)

### 14.1 Struktur

```
ResultCard (Component-Set 76:80)
├── type=buch              MenuBook Icon (📖)
├── type=vortrag           Mic Icon (🎙)
├── type=gespräch          Forum Icon (💬)
├── type=zitat             FormatQuote Icon (")
└── type=zusammenfassung   Summarize Icon (☰)
```

**8 Properties total:**
- 7 Component-Properties: Title, Chapter, Show Chapter, Excerpt, Author, Relevance, Show Relevance
- 1 Variant-Property: `type` (5 Values)

### 14.2 Bau-Strategie

1. Master umbenannt zu `type=buch`
2. 4× clone, jeder mit ersetztem TypeIcon (Material-Icon-SVG)
3. `figma.combineAsVariants([master, ...clones], dsPage)` ergab den Set
4. Figma konsolidiert die Property-Keys automatisch — alle Variants teilen sich die 7 Component-Properties

### 14.3 Erkenntnis: combineAsVariants & Property-Keys

Beim Klonen einer Component bekommen die Property-Definitions neue Keys (mit neuer Component-ID-Suffix). Die `componentPropertyReferences` auf Sub-Nodes pointen aber weiter auf die ALTEN Keys.

**Aber:** `figma.combineAsVariants(...)` führt ein automatisches Merging durch — Properties mit gleichem Namen werden konsolidiert. Nach Combine: Alle Variants haben dieselben 7 Property-Keys auf Set-Ebene (sichtbar via `set.componentPropertyDefinitions`).

→ Existierende Instances bleiben funktionsfähig und bekommen automatisch die Default-Variant zugewiesen.

### 14.4 Demo auf Suche-Page

3 Instances zeigen jetzt verschiedene Typen:
- Card 1: Philosophie der Freiheit (buch)
- Card 2: Theosophie (vortrag) — Mic-Icon
- Card 3: Geheimwissenschaft im Umriss (zitat) — Quote-Icon

→ So sieht eine realistische semantische Suche aus: gemischte Resultate aus verschiedenen Content-Typen, sofort visuell unterscheidbar.

---

## 15. Nächste Schritte (Stand: 2026-05-11)

1. **Tab / Übersicht Screen** — Buch-Grid mit Cover-Komponenten
2. **Tab / Lesen Screen** — Hauptfläche für Cormorant Garamond als Buchtext
3. **Tab / KI-Chat Screen** — Special Elite für KI-Antworten
4. **Tab / Notizen Screen** — User-eigene Notizen, ggf. Marcellus-basiert
5. **Konto + Einstellungen Screens** — Material-3-Settings-Pattern
6. **Active-Indicator Pill** in TabBar (optional Polish)
7. **Style Dictionary Pipeline** für `theme.ts`-Generierung (siehe `figma-ragapp-guide.md` Phase 6)

---

## Anhang: Datei-Referenz

```
ragapp/
├── config/
│   └── material-theme.json    ← Single Source of Truth für Tokens
└── plans/
    ├── ragapp-gesamtplan.md   ← übergeordneter Plan
    ├── figma-ragapp-guide.md  ← Workflow-Beschreibung (zu aktualisieren)
    └── figma-import-stand.md  ← dieses Dokument
```
