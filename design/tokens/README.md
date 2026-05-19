# Design Tokens (JSON)

| Datei | Inhalt |
|-------|--------|
| `material-theme.json` | M3-Farben (light/dark), Seed `#184FC5` — [Material Theme Builder](https://m3.material.io/theme-builder) |
| `tokens.json` | Spacing, `borderRadius`, `fontSize`, `fontWeight`, `lineHeight`, optionale `color.*` |

## In die App übernehmen

```bash
npm run build:theme
```

→ [`../../src/shared/theme/generated.ts`](../../src/shared/theme/generated.ts)

Schriften und `textStyles`: [`../../src/shared/theme/semantic.ts`](../../src/shared/theme/semantic.ts) (manuell).

Figma-Import der Farben: [`../figma/material-theme-import.md`](../figma/material-theme-import.md).  
Gesamtworkflow: [`../figma/workflow.md`](../figma/workflow.md).
