# ragapp Design System

Design-Tokens, Figma-Dokumentation und die Anbindung an die Expo-App.

## Tokens in der App (Kurz-Checkliste)

1. **Design in Figma** anpassen (Layout siehe [`figma/inventory.md`](./figma/inventory.md)).
2. **JSON im Repo** aktualisieren:
   - **Farben** → [`tokens/material-theme.json`](./tokens/material-theme.json) (Export aus [Material Theme Builder](https://m3.material.io/theme-builder) in Figma)
   - **Abstände, Ecken, Schriftgrößen** → [`tokens/tokens.json`](./tokens/tokens.json)
3. **`npm run build:theme`** im Projektroot ausführen.
4. App starten — Farben/Abstände kommen aus [`../src/theme.generated.ts`](../src/theme.generated.ts).
5. **Schriften / Text-Styles** (Cinzel, Marcellus, `textStyles`) nur bei Bedarf in [`../src/theme.semantic.ts`](../src/theme.semantic.ts) anpassen.

Ausführlicher Ablauf: [`figma/workflow.md`](./figma/workflow.md).

## Source of Truth

| Was | Wo |
|-----|-----|
| Pixel-Layout, Komponenten | [Figma ragapp-Layout](https://www.figma.com/design/T6s2FocVkibx6pUG9A4uvw/ragapp-Layout) |
| M3-Farben | `tokens/material-theme.json` |
| Spacing, Radius, Typo-Skalen | `tokens/tokens.json` |
| Runtime (generiert) | `src/theme.generated.ts` ← `npm run build:theme` |
| Schriften & semantische Typo | `src/theme.semantic.ts` (manuell) |
| App-Import | `src/theme.ts` |
| UI-Komponenten im Code | `src/components/`, `src/features/` |

## Verzeichnis

```
design/
├── README.md
├── figma/
│   ├── workflow.md              ← Ablauf Figma ↔ Tokens ↔ App
│   ├── inventory.md           ← Screens, Node-IDs, Entscheidungen
│   ├── material-theme-import.md
│   └── file.md
└── tokens/
    ├── README.md
    ├── material-theme.json
    └── tokens.json
```

`config/material-theme.json` → Symlink auf `design/tokens/material-theme.json`.

## Screens implementieren

1. Node-ID und Aufbau in [`figma/inventory.md`](./figma/inventory.md) nachschlagen.
2. UI in `src/features/` oder `src/components/` bauen.
3. `lightColors`, `spacing`, `textStyles` aus `src/theme.ts` verwenden — keine losen Hex-Werte.

## Produkt- & Architekturpläne

[`../plans/`](../plans/) — Gesamtplan und Architektur (ohne Figma-Node-Details).
