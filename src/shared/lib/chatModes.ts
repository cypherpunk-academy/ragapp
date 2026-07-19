import type { ChatMode } from '@/shared/types/ragrun';

/** Welle 5c — Chat/Nachdenken-Modus-Auswahl (Filo §10 Phase C, Contract §3). */
export const CHAT_MODES: { value: ChatMode; label: string }[] = [
  { value: 'chat', label: 'Chat' },
  { value: 'nachdenken', label: 'Nachdenken' },
];

export function chatModeLabel(mode: ChatMode | string | null | undefined): string {
  return CHAT_MODES.find((m) => m.value === mode)?.label ?? CHAT_MODES[0].label;
}
