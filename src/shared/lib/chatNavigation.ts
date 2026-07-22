/**
 * Modul-Level-Bridge für Navigation zum Chat außerhalb des ReadingProvider-Baums.
 * ReadingContext registriert die Funktion; andere Screens (z. B. ArbeitstexteScreen)
 * rufen sie direkt auf.
 */

type PendingLinkFn = (noteId: string) => void;

let _navigateToChatWithPendingLink: PendingLinkFn | null = null;

export function registerChatNavigation(fn: PendingLinkFn) {
  _navigateToChatWithPendingLink = fn;
}

export function navigateToChatWithPendingLink(noteId: string) {
  _navigateToChatWithPendingLink?.(noteId);
}
