/**
 * Document Tree — Parser/Outline/Serializer/Patcher für Arbeitstexte.
 * Contract §2 (filo-arbeitstext-contract.md), Filo Phase G.
 *
 * Regeln: `#` = Titel (genau eine Zeile), `##` = Kapitel, `###` = Unterabschnitt,
 * Absatz = Textblock getrennt durch Leerzeile(n). Keine Tabellen im MVP.
 */

export type ParagraphId = string; // z. B. "ch1.p2"
export type HeadingPath = string[]; // z. B. ["## Kapitel 2: …", "### Feld 1 — Geist → Recht"]

export type DocumentParagraph = {
  id: ParagraphId;
  text: string;
};

export type DocumentSubsection = {
  /** Vollständige `###`-Zeile inkl. Marker. */
  heading: string;
  headingPath: HeadingPath;
  paragraphs: DocumentParagraph[];
};

export type DocumentSection = {
  /** Vollständige `##`-Zeile inkl. Marker; leer ("") für Absätze vor der ersten Überschrift. */
  heading: string;
  headingPath: HeadingPath;
  paragraphs: DocumentParagraph[];
  children: DocumentSubsection[];
};

export type DocumentTree = {
  title: string;
  sections: DocumentSection[];
};

export type DocumentOutline = {
  title: string;
  sections: Array<{
    heading: string;
    paragraphs: Array<{ id: string; preview: string }>;
    children: Array<{
      heading: string;
      paragraphs: Array<{ id: string; preview: string }>;
    }>;
  }>;
};

export type DocumentPatchResult = {
  content: string;
  /** false wenn die Adresse (paragraph_id/heading_path) nicht gefunden wurde — content unverändert. */
  applied: boolean;
};

const HEADING_RE = /^(#{1,3})\s+(.+)$/;
const PREVIEW_MAX_CHARS = 80;

function splitParagraphBlocks(block: string): string[] {
  return block
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Erste `#`-Zeile — Arbeitstext-Titel. Für Titelsuche in der Bibliothek (§5.4). */
export function extractDocumentTitle(content: string): string {
  const line = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return line ?? 'Ohne Titel';
}

export function parseDocumentTree(content: string): DocumentTree {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  let title = 'Ohne Titel';
  let bodyStartIdx = 0;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i]!.trim();
    const m = HEADING_RE.exec(trimmed);
    if (m && m[1] === '#') {
      title = m[2]!.trim();
      bodyStartIdx = i + 1;
      break;
    }
    if (trimmed) break; // Nicht-leere Zeile vor erstem '#' — kein Titel gefunden.
  }

  const sections: DocumentSection[] = [];
  let chapterIndex = 0;
  let current: DocumentSection = { heading: '', headingPath: [], paragraphs: [], children: [] };
  let currentSub: DocumentSubsection | null = null;
  let buffer: string[] = [];
  let paraCounter = 0;

  const flushParagraphs = () => {
    const text = buffer.join('\n');
    buffer = [];
    const blocks = splitParagraphBlocks(text);
    const target = currentSub ?? current;
    for (const block of blocks) {
      paraCounter += 1;
      target.paragraphs.push({ id: `ch${chapterIndex}.p${paraCounter}`, text: block });
    }
  };

  const hasContent = (s: DocumentSection) =>
    s.heading !== '' || s.paragraphs.length > 0 || s.children.length > 0;

  for (let i = bodyStartIdx; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();
    const m = HEADING_RE.exec(trimmed);

    if (m && m[1] === '##') {
      flushParagraphs();
      if (hasContent(current)) sections.push(current);
      chapterIndex += 1;
      paraCounter = 0;
      currentSub = null;
      current = { heading: trimmed, headingPath: [trimmed], paragraphs: [], children: [] };
      continue;
    }
    if (m && m[1] === '###') {
      flushParagraphs();
      paraCounter = 0;
      currentSub = { heading: trimmed, headingPath: [...current.headingPath, trimmed], paragraphs: [] };
      current.children.push(currentSub);
      continue;
    }
    if (m && m[1] === '#') {
      // Titel ist genau eine Zeile — weitere `#`-Zeilen werden ignoriert.
      continue;
    }
    buffer.push(line);
  }
  flushParagraphs();
  if (hasContent(current)) sections.push(current);

  return { title, sections };
}

function normalizePreview(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length > PREVIEW_MAX_CHARS
    ? `${normalized.slice(0, PREVIEW_MAX_CHARS)}…`
    : normalized;
}

/** Outline fürs Chat-Request-Feld `document_outline` (Contract §3) — geht ans Modell. */
export function buildDocumentOutline(content: string): DocumentOutline {
  const tree = parseDocumentTree(content);
  return {
    title: tree.title,
    sections: tree.sections.map((s) => ({
      heading: s.heading,
      paragraphs: s.paragraphs.map((p) => ({ id: p.id, preview: normalizePreview(p.text) })),
      children: s.children.map((c) => ({
        heading: c.heading,
        paragraphs: c.paragraphs.map((p) => ({ id: p.id, preview: normalizePreview(p.text) })),
      })),
    })),
  };
}

export function serializeDocumentTree(tree: DocumentTree): string {
  const lines: string[] = [`# ${tree.title}`, ''];
  for (const section of tree.sections) {
    if (section.heading) lines.push(section.heading, '');
    for (const p of section.paragraphs) lines.push(p.text, '');
    for (const child of section.children) {
      lines.push(child.heading, '');
      for (const p of child.paragraphs) lines.push(p.text, '');
    }
  }
  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

type ParagraphLocation = {
  section: DocumentSection;
  sub: DocumentSubsection | null;
  index: number;
};

function findParagraphLocation(tree: DocumentTree, paragraphId: ParagraphId): ParagraphLocation | null {
  for (const section of tree.sections) {
    const idx = section.paragraphs.findIndex((p) => p.id === paragraphId);
    if (idx !== -1) return { section, sub: null, index: idx };
    for (const sub of section.children) {
      const subIdx = sub.paragraphs.findIndex((p) => p.id === paragraphId);
      if (subIdx !== -1) return { section, sub, index: subIdx };
    }
  }
  return null;
}

type HeadingLocation = { section: DocumentSection; sub: DocumentSubsection | null };

/** Doppelte `###`-Titel disambiguieren nur über vollständiges `heading_path` mit Parent-`##`. */
function findByHeadingPath(tree: DocumentTree, headingPath: HeadingPath): HeadingLocation | null {
  if (headingPath.length === 0) return null;
  const section = tree.sections.find((s) => s.heading === headingPath[0]);
  if (!section) return null;
  if (headingPath.length === 1) return { section, sub: null };
  const sub = section.children.find((c) => c.heading === headingPath[1]);
  if (!sub) return null;
  return { section, sub };
}

/** `update_paragraph` — einen Absatz ersetzen. */
export function updateParagraph(content: string, paragraphId: ParagraphId, newText: string): DocumentPatchResult {
  const tree = parseDocumentTree(content);
  const loc = findParagraphLocation(tree, paragraphId);
  if (!loc) return { content, applied: false };
  const target = loc.sub ?? loc.section;
  target.paragraphs[loc.index] = { id: paragraphId, text: newText.trim() };
  return { content: serializeDocumentTree(tree), applied: true };
}

/** `insert_paragraph_after` — neuen Absatz danach einfügen. */
export function insertParagraphAfter(content: string, paragraphId: ParagraphId, newText: string): DocumentPatchResult {
  const tree = parseDocumentTree(content);
  const loc = findParagraphLocation(tree, paragraphId);
  if (!loc) return { content, applied: false };
  const target = loc.sub ?? loc.section;
  target.paragraphs.splice(loc.index + 1, 0, { id: `${paragraphId}.new`, text: newText.trim() });
  return { content: serializeDocumentTree(tree), applied: true };
}

/** `delete_paragraph` — Absatz entfernen. */
export function deleteParagraph(content: string, paragraphId: ParagraphId): DocumentPatchResult {
  const tree = parseDocumentTree(content);
  const loc = findParagraphLocation(tree, paragraphId);
  if (!loc) return { content, applied: false };
  const target = loc.sub ?? loc.section;
  target.paragraphs.splice(loc.index, 1);
  return { content: serializeDocumentTree(tree), applied: true };
}

/** `update_heading` — Überschrift umbenennen (Titel-Zeile bleibt via `#` separat, § 5.3.1). */
export function updateHeading(content: string, headingPath: HeadingPath, newHeadingText: string): DocumentPatchResult {
  const tree = parseDocumentTree(content);
  const loc = findByHeadingPath(tree, headingPath);
  if (!loc) return { content, applied: false };
  const level = headingPath.length === 1 ? '##' : '###';
  const newHeading = `${level} ${newHeadingText.replace(/^#+\s*/, '').trim()}`;
  if (loc.sub) loc.sub.heading = newHeading;
  else loc.section.heading = newHeading;
  return { content: serializeDocumentTree(tree), applied: true };
}

function normalizeSectionHeading(raw: string, level: '##' | '###'): string {
  const stripped = raw.replace(/^#+\s*/, '').trim();
  return `${level} ${stripped}`;
}

/**
 * `update_section` — Block unter Überschrift ersetzen.
 * Fehlt die Ziel-Überschrift (häufig bei leerem Arbeitstext / „als Kapitel schreiben“),
 * wird ein neuer `##`- bzw. `###`-Abschnitt angehängt — kein stilles `applied: false`.
 */
export function updateSection(content: string, headingPath: HeadingPath, newBodyText: string): DocumentPatchResult {
  if (headingPath.length === 0) return { content, applied: false };
  const tree = parseDocumentTree(content);
  let loc = findByHeadingPath(tree, headingPath);

  if (!loc) {
    if (headingPath.length === 1) {
      const heading = normalizeSectionHeading(headingPath[0]!, '##');
      const section: DocumentSection = {
        heading,
        headingPath: [heading],
        paragraphs: [],
        children: [],
      };
      tree.sections.push(section);
      loc = { section, sub: null };
    } else if (headingPath.length === 2) {
      const chapterHeading = normalizeSectionHeading(headingPath[0]!, '##');
      let section = tree.sections.find(
        (s) => s.heading === chapterHeading || s.heading === headingPath[0],
      );
      if (!section) {
        // Versuch exakter Match inkl. Rohpfad (Modell liefert manchmal schon "## …")
        section = tree.sections.find((s) => s.heading === headingPath[0]);
      }
      if (!section) {
        section = {
          heading: chapterHeading,
          headingPath: [chapterHeading],
          paragraphs: [],
          children: [],
        };
        tree.sections.push(section);
      }
      const subHeading = normalizeSectionHeading(headingPath[1]!, '###');
      const existingSub = section.children.find(
        (c) => c.heading === subHeading || c.heading === headingPath[1],
      );
      if (existingSub) {
        loc = { section, sub: existingSub };
      } else {
        const sub: DocumentSubsection = {
          heading: subHeading,
          headingPath: [section.heading, subHeading],
          paragraphs: [],
        };
        section.children.push(sub);
        loc = { section, sub };
      }
    } else {
      return { content, applied: false };
    }
  }

  // Modell legt die Überschrift oft nochmal in `content` — nicht als Absatz speichern.
  let body = newBodyText.trim();
  const firstLine = body.split('\n')[0]?.trim() ?? '';
  const targetHeading = (loc.sub ?? loc.section).heading;
  if (
    firstLine
    && (firstLine === targetHeading
      || firstLine === headingPath[headingPath.length - 1]
      || normalizeSectionHeading(firstLine, loc.sub ? '###' : '##') === targetHeading)
  ) {
    body = body.slice(firstLine.length).replace(/^\n+/, '').trim();
  }

  const newParagraphs = splitParagraphBlocks(body).map((text, i) => ({
    id: `${headingPath.join('.')}.p${i + 1}`,
    text,
  }));
  if (loc.sub) loc.sub.paragraphs = newParagraphs;
  else loc.section.paragraphs = newParagraphs;
  return { content: serializeDocumentTree(tree), applied: true };
}

/** `#`-Titel umbenennen (nicht Teil des `update_document`-Operationssatzes, aber via § 5.3.1 "Benenne den Arbeitstext um"). */
export function renameDocumentTitle(content: string, newTitle: string): string {
  const tree = parseDocumentTree(content);
  tree.title = newTitle.trim();
  return serializeDocumentTree(tree);
}
