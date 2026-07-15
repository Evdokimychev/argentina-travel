"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { ActiveWorkspace, UserExperienceHydration } from "@/types/user-experience";

const GUEST_EXPERIENCE: UserExperienceHydration = {
  authenticated: false,
  roles: [],
  activeWorkspace: null,
  primaryIntent: null,
  onboardingState: "not_started",
  profileCompleteness: 0,
  pendingActions: [],
  notificationSummary: { pending: 0, unread: null },
  safePersonalizationContext: {
    profileCompletenessBucket: "empty",
    hasUpcomingTrip: false,
  },
};

type ExperienceContextValue = {
  experience: UserExperienceHydration;
  loading: boolean;
  switchWorkspace: (workspace: ActiveWorkspace) => Promise<{ ok: boolean; error?: string }>;
};

const ExperienceContext = createContext<ExperienceContextValue | null>(null);

export function UserExperienceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { authHydrated, isAuthenticated } = useAuth();
  const [experience, setExperience] = useState(GUEST_EXPERIENCE);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authHydrated) return;
    if (!isAuthenticated) {
      setExperience(GUEST_EXPERIENCE);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    fetch("/api/auth/experience", { signal: controller.signal, credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) throw new Error("experience unavailable");
        setExperience((await response.json()) as UserExperienceHydration);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [authHydrated, isAuthenticated]);

  const switchWorkspace = useCallback(
    async (workspace: ActiveWorkspace) => {
      const response = await fetch("/api/auth/workspace", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { context?: UserExperienceHydration; href?: string; error?: string }
        | null;
      if (!response.ok || !payload?.context || !payload.href) {
        return { ok: false, error: payload?.error ?? "Не удалось переключить режим" };
      }
      setExperience(payload.context);
      router.push(payload.href);
      router.refresh();
      return { ok: true };
    },
    [router],
  );

  const value = useMemo(
    () => ({ experience, loading, switchWorkspace }),
    [experience, loading, switchWorkspace],
  );
  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useUserExperience() {
  const context = useContext(ExperienceContext);
  if (!context) throw new Error("useUserExperience must be used within UserExperienceProvider");
  return context;
}
