import { Alert } from 'react-native';
import type { NoteRow } from '@/data/repositories/NoteRepository';
import i18n from '@/shared/i18n';

type ParagraphOccupiedOptions = {
  onOpen?: (note: NoteRow) => void;
  onLink?: (note: NoteRow) => void;
  linkLabel?: string;
};

/** Dialog when a paragraph already has an Arbeitstext — no silent overwrite. */
export function alertParagraphOccupied(existingNote: NoteRow, opts: ParagraphOccupiedOptions = {}): void {
  const buttons: Array<{ text: string; style?: 'cancel' | 'default' | 'destructive'; onPress?: () => void }> = [
    { text: i18n.t('common.cancel'), style: 'cancel' },
  ];
  if (opts.onOpen) {
    buttons.push({ text: i18n.t('common.open'), onPress: () => opts.onOpen!(existingNote) });
  }
  if (opts.onLink) {
    buttons.push({
      text: opts.linkLabel ?? i18n.t('alerts.linkInChat'),
      onPress: () => opts.onLink!(existingNote),
    });
  }
  Alert.alert(
    i18n.t('alerts.occupiedTitle'),
    i18n.t('alerts.occupiedBody'),
    buttons,
  );
}

/** Dateninkonsistenz: mehr als ein Arbeitstext mit derselben paragraph_id. */
export function alertMultipleParagraphNotes(notes: NoteRow[], onPick: (note: NoteRow) => void): void {
  Alert.alert(
    i18n.t('alerts.multipleTitle'),
    i18n.t('alerts.multipleBody'),
    [
      ...notes.map((n, i) => ({
        text: i18n.t('common.arbeitstextN', { n: i + 1 }),
        onPress: () => onPick(n),
      })),
      { text: i18n.t('common.cancel'), style: 'cancel' as const },
    ],
  );
}
