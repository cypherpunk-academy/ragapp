/**
 * Undo (MVP, Filo §5.4/§5.6): ein Schritt zurück. Vor jedem auto-applied Patch
 * wird der vorherige `content` hier abgelegt — max. 1 Eintrag im MVP.
 */

type UndoEntry = { noteId: string; previousContent: string };

let entry: UndoEntry | null = null;

export const documentUndoStack = {
  push(noteId: string, previousContent: string): void {
    entry = { noteId, previousContent };
  },

  peek(): UndoEntry | null {
    return entry;
  },

  /** Konsumiert den Eintrag (Rückgängig-Button) — leert den Stack danach. */
  pop(): UndoEntry | null {
    const current = entry;
    entry = null;
    return current;
  },

  clear(): void {
    entry = null;
  },
};
