import { Alert } from 'react-native';
import i18n from '@/shared/i18n';

/** Native Bestätigung vor dem Löschen eines Arbeitstexts. */
export function confirmDeleteNote(onConfirm: () => void): void {
  Alert.alert(
    i18n.t('alerts.deleteArbeitstextTitle'),
    i18n.t('alerts.deleteArbeitstextBody'),
    [
      { text: i18n.t('common.cancel'), style: 'cancel' },
      { text: i18n.t('common.delete'), style: 'destructive', onPress: onConfirm },
    ],
  );
}
