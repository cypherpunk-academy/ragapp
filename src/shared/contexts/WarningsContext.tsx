import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { findOrphanParagraphRefs } from '@/shared/lib/orphanParagraphRefs';

export type AppWarning = { id: string; message: string };

type WarningsContextValue = {
  warnings: AppWarning[];
  setWarning: (id: string, message: string | null) => void;
};

const WarningsContext = createContext<WarningsContextValue>({
  warnings: [],
  setWarning: () => {},
});

export function WarningsProvider({ children }: { children: React.ReactNode }) {
  const [warningsMap, setWarningsMap] = useState<Map<string, string>>(new Map());

  const setWarning = useCallback((id: string, message: string | null) => {
    setWarningsMap((prev) => {
      const next = new Map(prev);
      if (message == null) {
        next.delete(id);
      } else {
        next.set(id, message);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    void findOrphanParagraphRefs().then((r) => {
      if (r.hasOrphans) {
        console.warn(
          '[WarningsContext] orphan-refs:',
          r.orphans.map((o) => `${o.kind}:${o.id} → paragraph:${o.paragraphId}`).join(', '),
        );
      }
    });
  }, []);

  const warnings: AppWarning[] = Array.from(warningsMap.entries()).map(([id, message]) => ({ id, message }));

  return (
    <WarningsContext.Provider value={{ warnings, setWarning }}>
      {children}
    </WarningsContext.Provider>
  );
}

export function useWarnings() {
  return useContext(WarningsContext);
}
