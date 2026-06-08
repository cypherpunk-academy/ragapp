import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type Paragraph from '@/data/db/models/Paragraph';

export type ContributionsTab = 'notes' | 'conversations';

type ContributionsOverlay = {
  paragraph: Paragraph;
  tab: ContributionsTab;
  sourceId: string;
};

type ConversationDetailOverlay = {
  talkId: string;
  /** Absatz, von dem aus das Gespräch geöffnet wurde (Fundstelle). Null = kein Anchor (z. B. aus Suche). */
  anchorParagraphId: string | null;
  /** MVP: erste Runde (0) als Einstieg an der Fundstelle. */
  anchorTurnIndex: number;
};

type ChunkPreviewOverlay = {
  sourceId: string;
  chunkId: string;
  title?: string | null;
  /** MVP: ein Chunk; Volltext aus Suche oder Folge-API. */
  initialText: string;
};

type ReadingTarget = {
  sourceId: string;
  segmentIndex: number | null;
  paragraphId: string | null;
};

type ReadingContextValue = {
  target: ReadingTarget;
  contributions: ContributionsOverlay | null;
  conversationDetail: ConversationDetailOverlay | null;
  chunkPreview: ChunkPreviewOverlay | null;
  chatTalkId: string | null;
  /** Setzt Scroll-Ziel und wechselt zum Lesen-Tab (Pager-Index siehe TAB_INDEX_READ). */
  navigateToRead: (t: Omit<ReadingTarget, 'sourceId'> & { sourceId?: string }) => void;
  /** Wechselt zum KI-Chat-Tab ohne vorgeladenes Gespräch. */
  navigateToChat: () => void;
  /**
   * Zähler: wird hochgezählt wenn der User explizit auf den Übersicht-Tab tippt.
   * OverviewScreen reagiert darauf und zeigt die Bücherübersicht (resettet selectedSource).
   */
  overviewResetKey: number;
  /** Vom Layout aufgerufen wenn der Übersicht-Tab-Button gedrückt wird. */
  resetOverview: () => void;
  /** Wechselt zum KI-Chat-Tab und lädt das angegebene Gespräch vor. */
  navigateToChatWithTalk: (talkId: string) => void;
  openContributions: (paragraph: Paragraph, tab?: ContributionsTab, sourceId?: string) => void;
  closeContributions: () => void;
  openConversationDetail: (talkId: string, anchorParagraphId?: string | null, anchorTurnIndex?: number) => void;
  closeConversationDetail: () => void;
  openChunkPreview: (payload: ChunkPreviewOverlay) => void;
  closeChunkPreview: () => void;
  /** Wird vom Layout injiziert. */
  _registerTabNav: (fn: (index: number) => void) => void;
};

const LAST_SOURCE_KEY = 'lastActiveSourceId';

/** Synchron zu PagerView-Reihenfolge in app/(tabs)/_layout.tsx */
const TAB_INDEX_READ = 1;
const TAB_INDEX_CHAT = 2;

const ReadingContext = createContext<ReadingContextValue>({
  target: { sourceId: '', segmentIndex: null, paragraphId: null },
  contributions: null,
  conversationDetail: null,
  chunkPreview: null,
  chatTalkId: null,
  navigateToRead: () => {},
  navigateToChat: () => {},
  navigateToChatWithTalk: () => {},
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
  });

  const targetRef = useRef(target);
  targetRef.current = target;

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

  const navigateToRead = useCallback(
    ({ sourceId, segmentIndex, paragraphId }: Omit<ReadingTarget, 'sourceId'> & { sourceId?: string }) => {
      const resolvedSourceId = sourceId ?? targetRef.current.sourceId;
      setTarget({ sourceId: resolvedSourceId, segmentIndex, paragraphId });
      if (resolvedSourceId) AsyncStorage.setItem(LAST_SOURCE_KEY, resolvedSourceId);
      tabNavRef.current?.(TAB_INDEX_READ);
    },
    [],
  );

  const navigateToChat = useCallback(() => {
    tabNavRef.current?.(TAB_INDEX_CHAT);
  }, []);

  const navigateToChatWithTalk = useCallback((talkId: string) => {
    setChatTalkId(talkId);
    tabNavRef.current?.(TAB_INDEX_CHAT);
  }, []);

  const openContributions = useCallback(
    (paragraph: Paragraph, tab: ContributionsTab = 'notes', sourceId?: string) => {
      setContributions({ paragraph, tab, sourceId: sourceId ?? targetRef.current.sourceId });
    },
    [],
  );

  const closeContributions = useCallback(() => setContributions(null), []);

  const openConversationDetail = useCallback(
    (talkId: string, anchorParagraphId: string | null = null, anchorTurnIndex = 0) => {
      setConversationDetail({ talkId, anchorParagraphId, anchorTurnIndex });
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
        navigateToRead,
        navigateToChat,
        navigateToChatWithTalk,
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
