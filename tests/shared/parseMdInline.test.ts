import { parseMdInline } from '@/shared/lib/parseMdInline';

describe('parseMdInline', () => {
  it('parses bold', () => {
    expect(parseMdInline('siehe **wichtig** hier')).toEqual([
      { text: 'siehe ' },
      { text: 'wichtig', bold: true },
      { text: ' hier' },
    ]);
  });

  it('parses italic', () => {
    expect(parseMdInline('ein *kursiv* Wort')).toEqual([
      { text: 'ein ' },
      { text: 'kursiv', italic: true },
      { text: ' Wort' },
    ]);
  });

  it('parses underline', () => {
    expect(parseMdInline('ein _unterstrichen_ Wort')).toEqual([
      { text: 'ein ' },
      { text: 'unterstrichen', underline: true },
      { text: ' Wort' },
    ]);
  });

  it('prefers ** then _ then * in mixed input', () => {
    expect(parseMdInline('**fett** und _u_ und *i*')).toEqual([
      { text: 'fett', bold: true },
      { text: ' und ' },
      { text: 'u', underline: true },
      { text: ' und ' },
      { text: 'i', italic: true },
    ]);
  });

  it('does not treat single * inside ** as italic', () => {
    expect(parseMdInline('**a*b**')).toEqual([
      { text: 'a*b', bold: true },
    ]);
  });

  it('returns plain text when no markers', () => {
    expect(parseMdInline('nur Text')).toEqual([{ text: 'nur Text' }]);
  });
});
