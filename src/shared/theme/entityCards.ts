import { colorWithAlpha } from '@/shared/lib/color';
import type { MaterialIconName } from './icons';

type ColorScheme = Record<string, string>;

export type EntityKind =
  | 'chunk_buch'
  | 'chunk_vortrag'
  | 'chunk_gespraech'
  | 'begriff'
  | 'zitat'
  | 'kapitel_zusammenfassung'
  | 'notiz'
  | 'talk'
  | 'typology';

type EntityCardConfig = {
  label: string;
  icon: MaterialIconName;
  accentHex: (colors: ColorScheme) => string;
};

/**
 * Farbzuordnung: kein Grau (secondary vermieden für Haupttypen).
 * Jeder Typ hat eine klar unterscheidbare Nicht-Grau-Farbe.
 */
const ENTITY_CARD_CONFIG: Record<EntityKind, EntityCardConfig> = {
  // KI-Gespräche (eigene Talks + indexierte Assistant-Talks): Tertiary (Malve/Lila)
  talk: {
    label: 'Gespräch',
    icon: 'chat',
    accentHex: (c) => c.tertiary,
  },
  chunk_gespraech: {
    label: 'Gespräch',
    icon: 'chat',
    accentHex: (c) => c.tertiary,
  },
  // Bücher: Primary (Indigo-Blau)
  chunk_buch: {
    label: 'Buch',
    icon: 'auto-stories',
    accentHex: (c) => c.primary,
  },
  // Vortrag: tiefes Lila (onTertiaryContainer)
  chunk_vortrag: {
    label: 'Vortrag',
    icon: 'mic',
    accentHex: (c) => c.onTertiaryContainer,
  },
  // Begriff: Waldgrün (klar unterscheidbar von Blau)
  begriff: {
    label: 'Begriff',
    icon: 'local-offer',
    accentHex: () => '#2E7D32',
  },
  // Zitat: Rot/Warm (error)
  zitat: {
    label: 'Zitat',
    icon: 'format-quote',
    accentHex: (c) => c.error,
  },
  // Zusammenfassung: Tiefes Orange (klar unterscheidbar von Blau und Rot)
  kapitel_zusammenfassung: {
    label: 'Zusammenfassung',
    icon: 'summarize',
    accentHex: () => '#E65100',
  },
  // Notiz: eigenständige Farbe (nicht Gespräch-Tertiary)
  notiz: {
    label: 'Notiz',
    icon: 'edit',
    accentHex: () => '#A67C52',
  },
  // Typologie: Teal (unterscheidet sich von Blau, Grün, Orange)
  typology: {
    label: 'Typologie',
    icon: 'category',
    accentHex: () => '#00695C',
  },
};

export type EntityCardStyle = {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  accentColor: string;
  label: string;
  icon: MaterialIconName;
};

/**
 * Hintergrund viel transparenter als Rahmen:
 * - Background: 5 %  (heller Hauch der Akzentfarbe)
 * - Border:    40 %  (klar sichtbarer farbiger Rahmen)
 */
export function getEntityCardStyle(
  colors: ColorScheme,
  kind: EntityKind,
  isDark = false,
): EntityCardStyle {
  const config = ENTITY_CARD_CONFIG[kind];
  const accent = config.accentHex(colors);
  return {
    backgroundColor: colorWithAlpha(accent, isDark ? 0.08 : 0.05),
    borderColor: colorWithAlpha(accent, isDark ? 0.50 : 0.40),
    borderWidth: 1,
    borderRadius: 12,
    accentColor: accent,
    label: config.label,
    icon: config.icon,
  };
}

export function entityCardLabel(kind: EntityKind): string {
  return ENTITY_CARD_CONFIG[kind].label;
}

/**
 * Leitet EntityKind aus ragrun SearchResult-Metadaten ab.
 */
export function entityKindFromSearchResult(result: {
  chunk_type?: string;
  source_type?: string;
}): EntityKind {
  const ct = result.chunk_type?.toLowerCase() ?? '';
  const st = result.source_type?.toLowerCase() ?? '';

  if (ct === 'note' || ct === 'notiz') return 'notiz';
  if (ct === 'concept' || ct === 'term' || ct === 'begriff') return 'begriff';
  if (ct === 'quote' || ct === 'zitat') return 'zitat';
  if (ct === 'chapter_summary' || ct === 'summary') return 'kapitel_zusammenfassung';
  if (ct === 'typology' || ct === 'typologie') return 'typology';
  // Indexierte KI-Gespräche (Assistant-Exports, chunk_type talk)
  if (ct === 'talk') return 'chunk_gespraech';
  if (st === 'vortrag' || st === 'lecture') return 'chunk_vortrag';
  if (st === 'gespraech' || st === 'conversation') return 'chunk_gespraech';
  return 'chunk_buch';
}
