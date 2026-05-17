# Figma → App: Workflow

**Stand:** 2026-05-17  
**Figma:** [ragapp-Layout](https://www.figma.com/design/T6s2FocVkibx6pUG9A4uvw/ragapp-Layout) · fileKey `T6s2FocVkibx6pUG9A4uvw`  
**Inventar (Screens, Node-IDs, Komponenten):** [`inventory.md`](./inventory.md)  
**M3-Farben in Figma importieren:** [`material-theme-import.md`](./material-theme-import.md)

---

## Übersicht

```
Figma (Layout, Dev Mode)          design/tokens/*.json          App
─────────────────────────         ─────────────────────         ───
Screens & Komponenten      →      (manuell pflegen)      →      src/features/, src/components/
M3 Theme Builder           →      material-theme.json  →      npm run build:theme
Spacing / Radius / …       →      tokens.json          →      → theme.generated.ts
Schriften / textStyles     →      (nicht in JSON)      →      theme.semantic.ts (manuell)
```

**Komponenten** werden in React Native **manuell** umgesetzt (Dev Mode als Referenz).  
**Token-Werte** (Farben, Abstände, Ecken) kommen aus JSON + `npm run build:theme`.

Einstieg für die Repo-Struktur: [`../README.md`](../README.md).

---

## Navigation (4 Tabs)

Suche · Übersicht · Lesen · KI-Chat. Notizen nur unter **Lesen → Beiträge** (kein eigener Tab). Details: [`inventory.md`](./inventory.md) §0.

---

## Design-Tokens → App

### Quellen im Repo

| Datei | Inhalt | Typische Änderung |
|-------|--------|-------------------|
| [`../tokens/material-theme.json`](../tokens/material-theme.json) | M3-Farben light/dark | Material Theme Builder → Export → Datei ersetzen |
| [`../tokens/tokens.json`](../tokens/tokens.json) | Spacing, Radius, fontSize, fontWeight, lineHeight, `color.*` | JSON editieren oder aus Figma-Variables manuell übernehmen |

### Build

```bash
npm run build:theme
```

Erzeugt [`../../src/theme.generated.ts`](../../src/theme.generated.ts):

- `lightColors`, `darkColors` (primär aus `material-theme.json`)
- `spacing`, `borderRadius`, `fontSize`, …

Die App importiert alles über [`../../src/theme.ts`](../../src/theme.ts).

### Manuell (nicht im Build)

[`../../src/theme.semantic.ts`](../../src/theme.semantic.ts): Google-Font-Namen, `textStyles` (Cinzel/Marcellus/…), M3-`typography` ohne `fontFamily`. Nur anfassen, wenn sich **Schriften** oder semantische Text-Styles in Figma ändern.

Skript: [`../../scripts/build-theme.mjs`](../../scripts/build-theme.mjs).

---

## Wenn sich etwas ändert

### Farben, Abstände, Ecken

1. Passende JSON unter `design/tokens/` aktualisieren (siehe Tabelle oben).
2. `npm run build:theme`
3. App neu laden — Komponenten unverändert lassen, solange sie `colors.*` / `spacing.*` nutzen.

### Layout / neue UI-Teile

1. Figma (Dev Mode oder MCP) — Maße, Farben als Token-Namen notieren.
2. React-Komponente in `src/components/` oder `src/features/` anpassen.
3. Keine Hardcoded-Hex-Werte; Werte aus `theme.ts`.

### Neue Screens

1. Frame in Figma anlegen (iPhone 14 Pro, 393×852) — [`inventory.md`](./inventory.md) ergänzen.
2. Screen in der App implementieren.
3. Wiederverwendbare Teile: `AppBar`, `TabBar`, … aus `src/components/`.

---

## Figma-Datei (Kurzreferenz)

**Pages:** `_Cover` · `Design System` · `Tab / Suche` · `Tab / Übersicht` · `Tab / Lesen` · `Tab / KI-Chat` · `Konto` · `Einstellungen` · `Flows` · `Archive`

Details: [`file.md`](./file.md).

**Variables in Figma:** Collection `material-theme` (M3-Farben), `Tokens` (Spacing, Typo, Radius). Setup und Re-Import: [`material-theme-import.md`](./material-theme-import.md).

---

## Was nicht Teil dieses Workflows ist

- Kein automatischer Figma → GitHub-Export
- Keine GitHub Actions für Tokens
- Kein Style Dictionary (ersetzt durch `scripts/build-theme.mjs`)

Tokens Studio kann beim manuellen Export von Variables nach `tokens.json` helfen — ist aber kein Pflicht-Tool.
