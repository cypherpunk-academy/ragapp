import { formatQuoteClipboardText } from '@/shared/lib/formatQuoteClipboard';

describe('formatQuoteClipboardText', () => {
  it('joins quote with author and work title', () => {
    expect(
      formatQuoteClipboardText(
        'Ein freies Geistesleben schafft Interessen.',
        'Rudolf Steiner',
        'Aufsätze über die Dreigliederung',
      ),
    ).toBe(
      'Ein freies Geistesleben schafft Interessen.\n\n— Rudolf Steiner, Aufsätze über die Dreigliederung',
    );
  });

  it('omits placeholder author em dash', () => {
    expect(formatQuoteClipboardText('Nur das Zitat.', '—', 'Werk')).toBe(
      'Nur das Zitat.\n\n— Werk',
    );
  });

  it('returns quote alone when no source parts', () => {
    expect(formatQuoteClipboardText('  Nur Text  ', '—')).toBe('Nur Text');
  });
});
