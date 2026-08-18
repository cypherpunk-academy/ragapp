import type { ChatMode } from '@/shared/types/ragrun';
import i18n from '@/shared/i18n';

/** Welle 5c — Chat/Nachdenken-Modus-Auswahl (Filo §10 Phase C, Contract §3). */
export function getChatModes(): { value: ChatMode; label: string }[] {
  return [
    { value: 'chat', label: i18n.t('chatModes.chat') },
    { value: 'nachdenken', label: i18n.t('chatModes.nachdenken') },
  ];
}

export function chatModeLabel(mode: ChatMode | string | null | undefined): string {
  if (mode === 'nachdenken') return i18n.t('chatModes.nachdenken');
  return i18n.t('chatModes.chat');
}
