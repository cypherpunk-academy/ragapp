import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type Paragraph from '@/data/db/models/Paragraph';
import { registerChatNavigation } from '@/shared/lib/chatNavigation';

type ContributionsOverlay = {
  paragraph: Paragraph;
  sourceId: string;
};

type ConversationDetailOverlay = {
  talkId: string;
  sourceId: string;
  /** Absatz, von dem aus das Gespräch geöffnet wurde (Fundstelle). Null = kein Anchor (z. B. aus Suche). */
  anchorParagraphId: string | null;
  /** MVP: erste Runde (0) als Einstieg an der Fundstelle. */
  anchorTurnIndex: number;
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

type ReadingTarget = {
  sourceId: string;
  segmentIndex: number | null;
  paragraphId: string | null;
  /** Zeichen-Offset des Zitatanfangs im Absatztext — nur gesetzt bei Sprung aus einer Zitat-Suche. */
  markerOffset: number | null;
  /** Zähler, der bei jedem navigateToRead hochzählt — erzwingt erneutes Feuern des Marker-Effekts auch bei gleichem Ziel. */
  navSeq: number;
};

type ReadingContextValue = {
  target: ReadingTarget;
  contributions: ContributionsOverlay | null;
  conversationDetail: ConversationDetailOverlay | null;
  chunkPreview: ChunkPreviewOverlay | null;
  chatTalkId: string | null;
  /** Note-ID, die im Chat verknüpft werden soll, sobald ein Gespräch existiert (z. B. „Mit Philo bearbeiten" ohne aktives Gespräch). */
  chatPendingLinkNoteId: string | null;
  /** Absatz-ID, mit der ein neues Gespräch verankert werden soll (z. B. „Philo zu diesem Absatz fragen"). */
  chatPendingParagraphId: string | null;
  /** Setzt Scroll-Ziel und wechselt zum Lesen-Tab (Pager-Index siehe TAB_INDEX_READ). */
  navigateToRead: (t: Omit<ReadingTarget, 'sourceId' | 'markerOffset' | 'navSeq'> & { sourceId?: string; markerOffset?: number | null; pushHistory?: boolean; fromParagraphId?: string; fromSearch?: 'search' | 'chat'; switchTab?: boolean }) => void;
  /** Navigiert zum vorherigen Eintrag im Seitenverweis-Verlauf. */
  navigateBack: () => void;
  /** Seitenverweis-Verlauf (nicht leer = Zurück-Button anzeigen). */
  navigationHistory: ReadingTarget[];
  /** Wechselt zum KI-Chat-Tab ohne vorgeladenes Gespräch. */
  navigateToChat: () => void;
  /** Wechselt zurück zum KI-Suche-Tab (nach Navigation aus der Suche). */
  navigateToSearch: () => void;
  /** true wenn die aktuelle Leseposition aus der KI-Suche oder den Chat-Quellenverweisen geöffnet wurde. */
  searchReturnActive: boolean;
  /** Woher die aktuelle Leseposition kam — bestimmt das Ziel des „Zurück"-Buttons. */
  searchReturnOrigin: 'search' | 'chat' | null;
  /**
   * Zähler: wird hochgezählt wenn der User explizit auf den Übersicht-Tab tippt.
   * OverviewScreen reagiert darauf und zeigt die Bücherübersicht (resettet selectedSource).
   */
  overviewResetKey: number;
  /** Vom Layout aufgerufen wenn der Übersicht-Tab-Button gedrückt wird. */
  resetOverview: () => void;
  /** Wechselt zum KI-Chat-Tab und lädt das angegebene Gespräch vor. */
  navigateToChatWithTalk: (talkId: string) => void;
  /** Wechselt zum KI-Chat-Tab und merkt eine Note zum Verknüpfen vor („Mit Philo bearbeiten"). */
  navigateToChatWithPendingLink: (noteId: string) => void;
  /** Vom Chat-Tab aufgerufen, sobald `chatPendingLinkNoteId` übernommen wurde. */
  consumeChatPendingLink: () => void;
  /** Wechselt zum KI-Chat-Tab und merkt einen Absatz zur Verankerung eines neuen Gesprächs vor. */
  navigateToChatWithParagraph: (paragraphId: string) => void;
  /** Vom Chat-Tab aufgerufen, sobald `chatPendingParagraphId` übernommen wurde. */
  consumeChatPendingParagraph: () => void;
  openContributions: (paragraph: Paragraph, sourceId?: string) => void;
  closeContributions: () => void;
  openConversationDetail: (talkId: string, anchorParagraphId?: string | null, anchorTurnIndex?: number, sourceId?: string) => void;
  closeConversationDetail: () => void;
  openChunkPreview: (payload: ChunkPreviewOverlay) => void;
  closeChunkPreview: () => void;
  /** Wird vom Layout injiziert. */
  _registerTabNav: (fn: (index: number) => void) => void;
};

const LAST_SOURCE_KEY = 'lastActiveSourceId';

/** Synchron zu PagerView-Reihenfolge in app/(tabs)/_layout.tsx */
export const TAB_INDEX_CHAT = 0;
export const TAB_INDEX_OVERVIEW = 1;
export const TAB_INDEX_READ = 2;
export const TAB_INDEX_SEARCH = 3;

const ReadingContext = createContext<ReadingContextValue>({
  target: { sourceId: '', segmentIndex: null, paragraphId: null, markerOffset: null, navSeq: 0 },
  contributions: null,
  conversationDetail: null,
  chunkPreview: null,
  chatTalkId: null,
  chatPendingLinkNoteId: null,
  chatPendingParagraphId: null,
  navigateToRead: () => {},
  navigateBack: () => {},
  navigationHistory: [],
  navigateToChat: () => {},
  navigateToSearch: () => {},
  searchReturnActive: false,
  searchReturnOrigin: null,
  navigateToChatWithTalk: () => {},
  navigateToChatWithPendingLink: () => {},
  consumeChatPendingLink: () => {},
  navigateToChatWithParagraph: () => {},
  consumeChatPendingParagraph: () => {},
  openContributions: () => {},
  closeContributions: () => {},
  openConversationDetail: () => {},
  closeConversationDetail: () => {},
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
    AsyncStorage.getItem(LAST_SOURCE_KEY).then((id) => {
      if (id) setTarget((prev) => ({ ...prev, sourceId: id }));
    });
  }, []);

  const tabNavRef = useRef<((index: number) => void) | null>(null);

  const _registerTabNav = useCallback((fn: (index: number) => void) => {
    tabNavRef.current = fn;
  }, []);

  const [overviewResetKey, setOverviewResetKey] = useState(0);
  const resetOverview = useCallback(() => setOverviewResetKey((k) => k + 1), []);

  const [contributions, setContributions] = useState<ContributionsOverlay | null>(null);
  const [conversationDetail, setConversationDetail] = useState<ConversationDetailOverlay | null>(null);
  const [chunkPreview, setChunkPreview] = useState<ChunkPreviewOverlay | null>(null);
  const [chatTalkId, setChatTalkId] = useState<string | null>(null);
  const [chatPendingLinkNoteId, setChatPendingLinkNoteId] = useState<string | null>(null);
  const [chatPendingParagraphId, setChatPendingParagraphId] = useState<string | null>(null);
  const [searchReturnActive, setSearchReturnActive] = useState(false);
  const [searchReturnOrigin, setSearchReturnOrigin] = useState<'search' | 'chat' | null>(null);

  const navigateToRead = useCallback(
    ({ sourceId, segmentIndex, paragraphId, markerOffset, pushHistory, fromParagraphId, fromSearch, switchTab = true }: Omit<ReadingTarget, 'sourceId' | 'markerOffset' | 'navSeq'> & { sourceId?: string; markerOffset?: number | null; pushHistory?: boolean; fromParagraphId?: string; fromSearch?: 'search' | 'chat'; switchTab?: boolean }) => {
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

  const navigateToChat = useCallback(() => {
    setSearchReturnActive(false);
    setSearchReturnOrigin(null);
    setConversationDetail(null);
    setContributions(null);
    tabNavRef.current?.(TAB_INDEX_CHAT);
  }, []);

  const navigateToSearch = useCallback(() => {
    setSearchReturnActive(false);
    setSearchReturnOrigin(null);
    tabNavRef.current?.(TAB_INDEX_SEARCH);
  }, []);

  const navigateToChatWithTalk = useCallback((talkId: string) => {
    setConversationDetail(null);
    setContributions(null);
    setChatTalkId(talkId);
    tabNavRef.current?.(TAB_INDEX_CHAT);
  }, []);

  const navigateToChatWithPendingLink = useCallback((noteId: string) => {
    setConversationDetail(null);
    setContributions(null);
    setChatPendingLinkNoteId(noteId);
    tabNavRef.current?.(TAB_INDEX_CHAT);
  }, []);

  useEffect(() => {
    registerChatNavigation(navigateToChatWithPendingLink);
  }, [navigateToChatWithPendingLink]);

  const consumeChatPendingLink = useCallback(() => setChatPendingLinkNoteId(null), []);

  const navigateToChatWithParagraph = useCallback((paragraphId: string) => {
    setConversationDetail(null);
    setContributions(null);
    setChatPendingParagraphId(paragraphId);
    tabNavRef.current?.(TAB_INDEX_CHAT);
  }, []);

  const consumeChatPendingParagraph = useCallback(() => setChatPendingParagraphId(null), []);

  const openContributions = useCallback(
    (paragraph: Paragraph, sourceId?: string) => {
      setContributions({ paragraph, sourceId: sourceId ?? targetRef.current.sourceId });
    },
    [],
  );

  const closeContributions = useCallback(() => setContributions(null), []);

  const openConversationDetail = useCallback(
    (talkId: string, anchorParagraphId: string | null = null, anchorTurnIndex = 0, sourceId = '') => {
      setConversationDetail({ talkId, sourceId, anchorParagraphId, anchorTurnIndex });
    },
    [],
  );

  const closeConversationDetail = useCallback(() => setConversationDetail(null), []);

  const openChunkPreview = useCallback((payload: ChunkPreviewOverlay) => {
    setChunkPreview(payload);
  }, []);

  const closeChunkPreview = useCallback(() => setChunkPreview(null), []);

  return (
    <ReadingContext.Provider
      value={{
        target,
        contributions,
        conversationDetail,
        chunkPreview,
        chatTalkId,
        chatPendingLinkNoteId,
        chatPendingParagraphId,
        navigateToRead,
        navigateBack,
        navigationHistory,
        navigateToChat,
        navigateToSearch,
        searchReturnActive,
        searchReturnOrigin,
        navigateToChatWithTalk,
        navigateToChatWithPendingLink,
        consumeChatPendingLink,
        navigateToChatWithParagraph,
        consumeChatPendingParagraph,
        openContributions,
        closeContributions,
        openConversationDetail,
        closeConversationDetail,
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
