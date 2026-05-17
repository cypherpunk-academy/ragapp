import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

type ReadingTarget = {
  sourceId: string;
  segmentIndex: number | null;
  paragraphId: string | null;
};

type ReadingContextValue = {
  target: ReadingTarget;
  /** Setzt Scroll-Ziel und wechselt zum Lesen-Tab (index 2). */
  navigateToRead: (t: Omit<ReadingTarget, 'sourceId'> & { sourceId?: string }) => void;
  /** Wird vom Layout injiziert. */
  _registerTabNav: (fn: (index: number) => void) => void;
};

const DEFAULT_SOURCE = 'philosophie-der-freiheit';

const ReadingContext = createContext<ReadingContextValue>({
  target: { sourceId: DEFAULT_SOURCE, segmentIndex: null, paragraphId: null },
  navigateToRead: () => {},
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

  const navigateToRead = useCallback(
    ({ sourceId = DEFAULT_SOURCE, segmentIndex, paragraphId }: Omit<ReadingTarget, 'sourceId'> & { sourceId?: string }) => {
      setTarget({ sourceId, segmentIndex, paragraphId });
      tabNavRef.current?.(2);
    },
    [],
  );

  return (
    <ReadingContext.Provider value={{ target, navigateToRead, _registerTabNav }}>
      {children}
    </ReadingContext.Provider>
  );
}

export function useReading() {
  return useContext(ReadingContext);
}
