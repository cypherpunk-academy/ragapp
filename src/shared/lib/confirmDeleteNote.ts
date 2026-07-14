import { Alert } from 'react-native';

/** Native Bestätigung vor dem Löschen eines Arbeitstexts. */
export function confirmDeleteNote(onConfirm: () => void): void {
  Alert.alert(
    'Arbeitstext löschen?',
    'Dieser Arbeitstext wird unwiderruflich gelöscht.',
    [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: onConfirm },
    ],
  );
}
