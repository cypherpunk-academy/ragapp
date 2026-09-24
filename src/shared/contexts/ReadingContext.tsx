import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type Paragraph from '@/data/db/models/Paragraph';
import { SourceRepository } from '@/data/repositories/SourceRepository';

type ContributionsOverlay = {
  paragraph: Paragraph;
  sourceId: string;
};

type SummaryReadTarget = {
  sourceId: string;
  segmentIndex: number | null;
};

type ChunkPreviewOverlay = {
  sourceId: string;
  chunkId: string;
  title?: string | null;
  /** MVP: ein Chunk; Volltext aus Suche oder Folge-API. */
  initialText: string;
  /** Zweiter Tap: zum Kapitel-/Vortragsanfang im Lesen-Tab. */
  readTarget?: SummaryReadTarget;
  /** Woher das Overlay geöffnet wurde — bestimmt das Ziel des „Zurück"-Buttons nach einem Sprung ins Lesen-Tab. */
  origin?: 'search' | 'chat';
};

export type ReadingSourceHint = {
  author?: string;
  title?: string;
  venue?: string;
  lectureDate?: string;
};

type ReadingTarget = {
  sourceId: string;
  segmentIndex: number | null;
  paragraphId: string | null;
  /** Zeichen-Offset des Zitatanfangs im Absatztext — nur gesetzt bei Sprung aus einer Zitat-Suche. */
  markerOffset: number | null;
  /** Zähler, der bei jedem navigateToRead hochzählt — erzwingt erneutes Feuern des Marker-Effekts auch bei gleichem Ziel. */
  navSeq: number;
  /** Metadaten aus dem Suchtreffer — Fallback wenn Source nicht in der lokalen DB. */
  sourceHint?: ReadingSourceHint;
};

type ReadingContextValue = {
  target: ReadingTarget;
  contributions: ContributionsOverlay | null;
  chunkPreview: ChunkPreviewOverlay | null;
  /** Setzt Scroll-Ziel und wechselt zum Lesen-Tab (Pager-Index siehe TAB_INDEX_READ). */
  navigateToRead: (t: Omit<ReadingTarget, 'sourceId' | 'markerOffset' | 'navSeq'> & { sourceId?: string; markerOffset?: number | null; pushHistory?: boolean; fromParagraphId?: string; fromSearch?: 'search' | 'chat'; switchTab?: boolean; sourceHint?: ReadingSourceHint }) => void;
  /** Navigiert zum vorherigen Eintrag im Seitenverweis-Verlauf. */
  navigateBack: () => void;
  /** Seitenverweis-Verlauf (nicht leer = Zurück-Button anzeigen). */
  navigationHistory: ReadingTarget[];
  /** Wechselt zurück zum KI-Suche-Tab (nach Navigation aus der Suche). */
  navigateToSearch: () => void;
  /** true wenn die aktuelle Leseposition aus der KI-Suche oder den Chat-Quellenverweisen geöffnet wurde. */
  searchReturnActive: boolean;
  /** Woher die aktuelle Leseposition kam — bestimmt das Ziel des „Zurück”-Buttons. */
  searchReturnOrigin: 'search' | 'chat' | null;
  /**
   * Zähler: wird hochgezählt wenn der User explizit auf den Übersicht-Tab tippt.
   * OverviewScreen reagiert darauf und zeigt die Bücherübersicht (resettet selectedSource).
   */
  overviewResetKey: number;
  /** Vom Layout aufgerufen wenn der Übersicht-Tab-Button gedrückt wird. */
  resetOverview: () => void;
  openContributions: (paragraph: Paragraph, sourceId?: string) => void;
  closeContributions: () => void;
  openChunkPreview: (payload: ChunkPreviewOverlay) => void;
  closeChunkPreview: () => void;
  /** Wird vom Layout injiziert. */
  _registerTabNav: (fn: (index: number) => void) => void;
};

const LAST_SOURCE_KEY = 'lastActiveSourceId';

/** Synchron zu PagerView-Reihenfolge in app/(tabs)/_layout.tsx */
export const TAB_INDEX_OVERVIEW = 1;
export const TAB_INDEX_READ = 2;
export const TAB_INDEX_SEARCH = 3;

const ReadingContext = createContext<ReadingContextValue>({
  target: { sourceId: '', segmentIndex: null, paragraphId: null, markerOffset: null, navSeq: 0 },
  contributions: null,
  chunkPreview: null,
  navigateToRead: () => {},
  navigateBack: () => {},
  navigationHistory: [],
  navigateToSearch: () => {},
  searchReturnActive: false,
  searchReturnOrigin: null,
  openContributions: () => {},
  closeContributions: () => {},
  openChunkPreview: () => {},
  closeChunkPreview: () => {},
  _registerTabNav: () => {},
  overviewResetKey: 0,
  resetOverview: () => {},
});

export function ReadingProvider({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<ReadingTarget>({
    sourceId: '',
    segmentIndex: null,
    paragraphId: null,
    markerOffset: null,
    navSeq: 0,
  });

  const targetRef = useRef(target);
  targetRef.current = target;

  const [navigationHistory, setNavigationHistory] = useState<ReadingTarget[]>([]);
  const navigationHistoryRef = useRef<ReadingTarget[]>([]);
  navigationHistoryRef.current = navigationHistory;

  useEffect(() => {
    AsyncStorage.getItem(LAST_SOURCE_KEY).then(async (id) => {
      if (id) {
        setTarget((prev) => ({ ...prev, sourceId: id }));
      } else {
        // No last-read source stored — default to the first primary source.
        const sub = SourceRepository.observePrimary().subscribe((sources) => {
          if (sources.length > 0) {
            setTarget((prev) => prev.sourceId ? prev : { ...prev, sourceId: sources[0].id });
          }
          sub.unsubscribe();
        });
      }
    });
  }, []);

  const tabNavRef = useRef<((index: number) => void) | null>(null);

  const _registerTabNav = useCallback((fn: (index: number) => void) => {
    tabNavRef.current = fn;
  }, []);

  const [overviewResetKey, setOverviewResetKey] = useState(0);
  const resetOverview = useCallback(() => setOverviewResetKey((k) => k + 1), []);

  const [contributions, setContributions] = useState<ContributionsOverlay | null>(null);
  const [chunkPreview, setChunkPreview] = useState<ChunkPreviewOverlay | null>(null);
  const [searchReturnActive, setSearchReturnActive] = useState(false);
  const [searchReturnOrigin, setSearchReturnOrigin] = useState<'search' | 'chat' | null>(null);

  const navigateToRead = useCallback(
    ({ sourceId, segmentIndex, paragraphId, markerOffset, pushHistory, fromParagraphId, fromSearch, switchTab = true, sourceHint }: Omit<ReadingTarget, 'sourceId' | 'markerOffset' | 'navSeq'> & { sourceId?: string; markerOffset?: number | null; pushHistory?: boolean; fromParagraphId?: string; fromSearch?: 'search' | 'chat'; switchTab?: boolean; sourceHint?: ReadingSourceHint }) => {
      const resolvedSourceId = sourceId ?? targetRef.current.sourceId;
      if (pushHistory) {
        const historyEntry = fromParagraphId != null
          ? { ...targetRef.current, paragraphId: fromParagraphId, markerOffset: null }
          : { ...targetRef.current, markerOffset: null };
        setNavigationHistory((prev) => [...prev, historyEntry]);
      }
      if (fromSearch) {
        setSearchReturnActive(true);
        setSearchReturnOrigin(fromSearch);
      } else if (!pushHistory) {
        // Normal non-search navigation resets the search return button
        setSearchReturnActive(false);
        setSearchReturnOrigin(null);
      }
      setTarget((prev) => ({
        sourceId: resolvedSourceId,
        segmentIndex,
        paragraphId,
        markerOffset: markerOffset ?? null,
        navSeq: prev.navSeq + 1,
        sourceHint: sourceHint ?? undefined,
      }));
      if (resolvedSourceId) AsyncStorage.setItem(LAST_SOURCE_KEY, resolvedSourceId);
      if (switchTab) tabNavRef.current?.(TAB_INDEX_READ);
    },
    [],
  );

  const navigateBack = useCallback(() => {
    const history = navigationHistoryRef.current;
    if (history.length === 0) return;
    const prev = history[history.length - 1]!;
    setNavigationHistory((h) => h.slice(0, -1));
    setTarget(prev);
    if (prev.sourceId) AsyncStorage.setItem(LAST_SOURCE_KEY, prev.sourceId);
    tabNavRef.current?.(TAB_INDEX_READ);
  }, []);

  const navigateToSearch = useCallback(() => {
    setSearchReturnActive(false);
    setSearchReturnOrigin(null);
    tabNavRef.current?.(TAB_INDEX_SEARCH);
  }, []);

  const openContributions = useCallback(
    (paragraph: Paragraph, sourceId?: string) => {
      setContributions({ paragraph, sourceId: sourceId ?? targetRef.current.sourceId });
    },
    [],
  );

  const closeContributions = useCallback(() => setContributions(null), []);

  const openChunkPreview = useCallback((payload: ChunkPreviewOverlay) => {
    setChunkPreview(payload);
  }, []);

  const closeChunkPreview = useCallback(() => setChunkPreview(null), []);

  return (
    <ReadingContext.Provider
      value={{
        target,
        contributions,
        chunkPreview,
        navigateToRead,
        navigateBack,
        navigationHistory,
        navigateToSearch,
        searchReturnActive,
        searchReturnOrigin,
        openContributions,
        closeContributions,
        openChunkPreview,
        closeChunkPreview,
        _registerTabNav,
        overviewResetKey,
        resetOverview,
      }}
    >
      {children}
    </ReadingContext.Provider>
  );
}

export function useReading() {
  return useContext(ReadingContext);
}
