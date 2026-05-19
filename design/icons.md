# Icon-Richtlinie (ragapp)

**Kurz:** In der App sind „Icons“ **Material Symbols Outlined** (SVG), keine Unicode-Emojis. Figma und Code nutzen dieselben Namen.

| Ebene | Datei | Rolle |
|-------|--------|--------|
| **Registry (maschinenlesbar)** | [`icons.json`](./icons.json) | Alle Symbole mit `material`-Name, Label, Verwendungsorten |
| **Richtlinie (lesbar)** | Diese Datei | Konvention, Größen, Figma-Workflow |
| **Figma** | [ragapp-Layout](https://www.figma.com/design/T6s2FocVkibx6pUG9A4uvw/ragapp-Layout) → Page **Design System** | Komponenten + Instances, visuelle Referenz |
| **App-Code** | [`../src/shared/theme/icons.ts`](../src/shared/theme/icons.ts) + [`../src/shared/components/AppIcon.tsx`](../src/shared/components/AppIcon.tsx) | Registry + Renderer — Import aus `@/shared/theme` |

Screen-Details und Node-IDs: [`figma/inventory.md`](./figma/inventory.md) (u. a. §16.5 Beiträge, §16.8 Icons).

---

## Warum keine Emojis?

Unicode-Emojis (📖 ✏️ 💬) sehen auf iOS/Android/Figma **unterschiedlich** aus, ignorieren Theme-Farben und sind für Screenreader unzuverlässig. Figma rendert sie in Exporten oft falsch.

Stattdessen: **Material Symbols** — monochrom, an `onSurfaceVariant` / `primary` bindbar, in Figma als SVG und in React Native über `@expo/vector-icons` (`MaterialIcons`).

Der **Beitrags-Streifen** (Stift · Sprechblase · Fadenkreuz) ist das Referenzbild für alle drei Beitrags-Indikatoren.

---

## Beitrags-Indikatoren (Beitrags-Streifen)

| Semantik | Material Symbol | Expo `MaterialIcons` | Typische Größe |
|----------|-----------------|----------------------|----------------|
| Notizen | `edit` | `edit` | 16px (Strip), 20px (Tab) |
| Gespräche | `chat_bubble_outline` | `chat-bubble-outline` | 16px / 20px |
| RAG-Treffer | `my_location` | `my-location` | 16px / 20px |

Zahlen daneben: Tabular nums, 11px, Farbe `onSurfaceVariant` (siehe `ContributionStrip`).

---

## Größen nach Kontext

Aus [`icons.json`](./icons.json) → `sizes`:

| Token | px | Kontext |
|-------|-----|---------|
| `strip` | 16 | Beitrags-Streifen unter Absatz / in Kapitelzeile |
| `menu` | 18 | Kontextmenü, Listenzeilen |
| `tabHeader` | 20 | Lesen → Beiträge Filter-Tabs |
| `appBar` | 24 | AppBar, Offline |
| `tabBar` | 24 | Untere Navigation |
| `hero` | 40 | Werk-Cover in Detail-Hero |

Default-Fill: **`onSurfaceVariant`**. Aktiv: **`primary`**.

---

## In Figma pflegen

1. **Design System**-Page: Für jedes Symbol in `icons.json` ein **24×24 Frame** mit Material-Symbol (Outlined, Weight 400, Fill 0).
2. Benennung: `Icon / contribution.notes` (gleicher Key wie JSON) — dann findet man Registry ↔ Layer 1:1.
3. **Beitrags-Streifen** als **Component** `ContributionStrip` mit drei Slots (Notizen · Gespräche · RAG) + optionale Zahl — in Screens nur Instances.
4. **Keine Emoji-Textlayer** für UI-Marker; historische Emojis in Screens durch SVG ersetzen (siehe inventory §16.8).
5. Bei neuem Icon: zuerst **`icons.json` + `src/shared/theme/icons.ts`**, dann Figma-Komponente, dann UI.

Optional später: Figma-Plugin liest `icons.json` und legt fehlende Icons an (nicht im MVP).

---

## In der App pflegen

```ts
import { ICONS, ICON_SIZES } from '@/shared/theme';
import AppIcon from '@/shared/components/AppIcon';

<AppIcon name={ICONS.contribution.notes} size="strip" color={colors.onSurfaceVariant} />
```

Neues Icon:

1. Eintrag in `design/icons.json`
2. Konstante in `src/shared/theme/icons.ts`
3. Komponente anpassen — **kein** zweites Mapping in Feature-Dateien

---

## Vollständige Liste

Alle Keys und `material`-Namen: [`icons.json`](./icons.json).

Änderungen an der Registry gehören in denselben Commit wie Figma-Update (oder kurzer Verweis im PR), damit Design und Code nicht auseinanderlaufen.
