import {
  buildSegmentTitleParts,
  stripSegmentTitleHtml,
} from '@/shared/lib/segmentTitleDisplay';

describe('segmentTitleDisplay', () => {
  it('strips italic HTML from GA 23 appendix title', () => {
    const raw = 'V. ANHANG <i>An das deutsche Volk und an die Kulturwelt</i>!';
    expect(stripSegmentTitleHtml(raw)).toBe(
      'V. ANHANG An das deutsche Volk und an die Kulturwelt!',
    );
  });

  it('handles uppercase I tags', () => {
    const raw = 'V. ANHANG <I>AN DAS DEUTSCHE VOLK UND AN DIE KULTURWELT</I>!';
    expect(stripSegmentTitleHtml(raw)).toBe(
      'V. ANHANG AN DAS DEUTSCHE VOLK UND AN DIE KULTURWELT!',
    );
  });

  it('builds italic parts for nested Text rendering', () => {
    expect(buildSegmentTitleParts('V. ANHANG <i>An das deutsche Volk</i>!')).toEqual([
      { text: 'V. ANHANG ', italic: false },
      { text: 'An das deutsche Volk', italic: true },
      { text: '!', italic: false },
    ]);
  });

  it('passes through titles without markup', () => {
    expect(stripSegmentTitleHtml('Kapitel 1')).toBe('Kapitel 1');
    expect(buildSegmentTitleParts('Kapitel 1')).toEqual([{ text: 'Kapitel 1', italic: false }]);
  });
});
