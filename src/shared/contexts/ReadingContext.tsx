import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import type Paragraph from '@/data/db/models/Paragraph';

export type ContributionsTab = 'notes' | 'conversations' | 'rag';

type ContributionsOverlay = {
  paragraph: Paragraph;
  tab: ContributionsTab;
  sourceId: string;
};

type ConversationDetailOverlay = {
  talkId: string;
  /** Absatz, von dem aus das Gespräch geöffnet wurde (Fundstelle). */
  anchorParagraphId: string;
  /** MVP: erste Runde (0) als Einstieg an der Fundstelle. */
  anchorTurnIndex: number;
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
  /** Setzt Scroll-Ziel und wechselt zum Lesen-Tab (Pager-Index siehe TAB_INDEX_READ). */
  navigateToRead: (t: Omit<ReadingTarget, 'sourceId'> & { sourceId?: string }) => void;
  /** Wechselt zum KI-Chat-Tab (Pager-Index siehe TAB_INDEX_CHAT). */
  navigateToChat: () => void;
  openContributions: (paragraph: Paragraph, tab?: ContributionsTab, sourceId?: string) => void;
  closeContributions: () => void;
  openConversationDetail: (talkId: string, anchorParagraphId: string, anchorTurnIndex?: number) => void;
  closeConversationDetail: () => void;
  /** Wird vom Layout injiziert. */
  _registerTabNav: (fn: (index: number) => void) => void;
};

const DEFAULT_SOURCE = 'philosophie-der-freiheit';

/** Synchron zu PagerView-Reihenfolge in app/(tabs)/_layout.tsx */
const TAB_INDEX_READ = 1;
const TAB_INDEX_CHAT = 3;

const ReadingContext = createContext<ReadingContextValue>({
  target: { sourceId: DEFAULT_SOURCE, segmentIndex: null, paragraphId: null },
  contributions: null,
  conversationDetail: null,
  navigateToRead: () => {},
  navigateToChat: () => {},
  openContributions: () => {},
  closeContributions: () => {},
  openConversationDetail: () => {},
  closeConversationDetail: () => {},
  _registerTabNav: () => {},
});

export function ReadingProvider({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<ReadingTarget>({
    sourceId: DEFAULT_SOURCE,
    segmentIndex: null,
    paragraphId: null,
  });

  const tabNavRef = useRef<((index: number) => void) | null>(null);

  const _registerTabNav = useCallback((fn: (index: number) => void) => {
    tabNavRef.current = fn;
  }, []);

  const [contributions, setContributions] = useState<ContributionsOverlay | null>(null);
  const [conversationDetail, setConversationDetail] = useState<ConversationDetailOverlay | null>(null);

  const navigateToRead = useCallback(
    ({ sourceId = DEFAULT_SOURCE, segmentIndex, paragraphId }: Omit<ReadingTarget, 'sourceId'> & { sourceId?: string }) => {
      setTarget({ sourceId, segmentIndex, paragraphId });
      tabNavRef.current?.(TAB_INDEX_READ);
    },
    [],
  );

  const navigateToChat = useCallback(() => {
    tabNavRef.current?.(TAB_INDEX_CHAT);
  }, []);

  const openContributions = useCallback(
    (paragraph: Paragraph, tab: ContributionsTab = 'notes', sourceId = DEFAULT_SOURCE) => {
      setContributions({ paragraph, tab, sourceId });
    },
    [],
  );

  const closeContributions = useCallback(() => setContributions(null), []);

  const openConversationDetail = useCallback(
    (talkId: string, anchorParagraphId: string, anchorTurnIndex = 0) => {
      setConversationDetail({ talkId, anchorParagraphId, anchorTurnIndex });
    },
    [],
  );

  const closeConversationDetail = useCallback(() => setConversationDetail(null), []);

  return (
    <ReadingContext.Provider
      value={{
        target,
        contributions,
        conversationDetail,
        navigateToRead,
        navigateToChat,
        openContributions,
        closeContributions,
        openConversationDetail,
        closeConversationDetail,
        _registerTabNav,
      }}
    >
      {children}
    </ReadingContext.Provider>
  );
}

export function useReading() {
  return useContext(ReadingContext);
}
