"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";
import {
  fetchQuickExplorePayload,
  getQuickExploreCacheSnapshot,
  scheduleQuickExplorePrefetch,
  subscribeQuickExploreCache,
} from "@/lib/quick-explore/client-cache";
import type { QuickExplorePayload } from "@/lib/quick-explore/types";

type QuickExploreContextValue = {
  payload: QuickExplorePayload | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const QuickExploreContext = createContext<QuickExploreContextValue | null>(null);

const SERVER_SNAPSHOT = { data: null, error: null, loading: false };

export function QuickExploreProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribeQuickExploreCache,
    getQuickExploreCacheSnapshot,
    () => SERVER_SNAPSHOT
  );

  useEffect(() => {
    scheduleQuickExplorePrefetch();
  }, []);

  const refresh = useCallback(async () => {
    try {
      await fetchQuickExplorePayload(true);
    } catch {
      // Error is stored in the module cache and exposed via snapshot.
    }
  }, []);

  return (
    <QuickExploreContext.Provider
      value={{
        payload: snapshot.data,
        loading: snapshot.loading,
        error: snapshot.error,
        refresh,
      }}
    >
      {children}
    </QuickExploreContext.Provider>
  );
}

export function useQuickExplore(): QuickExploreContextValue {
  const context = useContext(QuickExploreContext);
  if (!context) {
    throw new Error("useQuickExplore must be used within QuickExploreProvider");
  }
  return context;
}
