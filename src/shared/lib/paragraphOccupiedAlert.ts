import { Alert } from 'react-native';
import type Note from '@/data/db/models/Note';

type ParagraphOccupiedOptions = {
  onOpen?: (note: Note) => void;
  onLink?: (note: Note) => void;
  linkLabel?: string;
};

/** Dialog when a paragraph already has an Arbeitstext — no silent overwrite. */
export function alertParagraphOccupied(existingNote: Note, opts: ParagraphOccupiedOptions = {}): void {
  const buttons: Array<{ text: string; style?: 'cancel' | 'default' | 'destructive'; onPress?: () => void }> = [
    { text: 'Abbrechen', style: 'cancel' },
  ];
  if (opts.onOpen) {
    buttons.push({ text: 'Öffnen', onPress: () => opts.onOpen!(existingNote) });
  }
  if (opts.onLink) {
    buttons.push({
      text: opts.linkLabel ?? 'Im Chat verknüpfen',
      onPress: () => opts.onLink!(existingNote),
    });
  }
  Alert.alert(
    'Arbeitstext vorhanden',
    'Zu diesem Absatz gibt es bereits einen Arbeitstext.',
    buttons,
  );
}

/** Dateninkonsistenz: mehr als ein Arbeitstext mit derselben paragraph_id. */
export function alertMultipleParagraphNotes(notes: Note[], onPick: (note: Note) => void): void {
  Alert.alert(
    'Mehrere Arbeitstexte',
    'An diesem Absatz sind mehrere Arbeitstexte verknüpft. Bitte wähle einen zum Öffnen.',
    [
      ...notes.map((n, i) => ({
        text: `Arbeitstext ${i + 1}`,
        onPress: () => onPick(n),
      })),
      { text: 'Abbrechen', style: 'cancel' as const },
    ],
  );
}
