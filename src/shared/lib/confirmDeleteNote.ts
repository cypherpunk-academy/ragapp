import { Alert } from 'react-native';

/** Native Bestätigung vor dem Löschen einer Notiz. */
export function confirmDeleteNote(onConfirm: () => void): void {
  Alert.alert(
    'Notiz löschen?',
    'Diese Notiz wird unwiderruflich gelöscht.',
    [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: onConfirm },
    ],
  );
}
