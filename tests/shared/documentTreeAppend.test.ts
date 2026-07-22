import {
  buildDocumentOutline,
  parseDocumentTree,
  updateSection,
} from '@/data/lib/documentTree';

describe('updateSection append', () => {
  it('appends a missing ## chapter on nearly empty document', () => {
    const before = '# Arbeitstext über Absatz 28\n\n**Zusammenfassung**\n';
    const result = updateSection(
      before,
      ['## 1. Zusammenfassung von Absatz 28'],
      'In diesem Absatz wird die Frage beantwortet.',
    );
    expect(result.applied).toBe(true);
    const tree = parseDocumentTree(result.content);
    expect(tree.sections.some((s) => s.heading.includes('Zusammenfassung von Absatz 28'))).toBe(true);
    expect(result.content).toContain('In diesem Absatz wird die Frage beantwortet.');
    const outline = buildDocumentOutline(result.content);
    expect(outline.sections.length).toBeGreaterThanOrEqual(1);
  });

  it('strips duplicated heading from content body', () => {
    const before = '# Titel\n\n';
    const result = updateSection(
      before,
      ['## Kapitel 1'],
      '## Kapitel 1\n\nErster Absatz.',
    );
    expect(result.applied).toBe(true);
    expect(result.content).toContain('## Kapitel 1');
    expect(result.content.match(/## Kapitel 1/g)?.length).toBe(1);
    expect(result.content).toContain('Erster Absatz.');
  });
});
