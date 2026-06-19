"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { hasAdminCapability } from "@/lib/admin/capabilities";
import { canAccessAdminPanel } from "@/lib/permissions";
import { useAuth } from "@/context/AuthContext";
import type { AdminCapability, AdminPresetId } from "@/types/admin";

type AdminContextValue = {
  capabilities: AdminCapability[];
  preset: AdminPresetId | null;
  loading: boolean;
  error: string | null;
  hasCapability: (cap: AdminCapability) => boolean;
  refresh: () => Promise<void>;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [capabilities, setCapabilities] = useState<AdminCapability[]>([]);
  const [preset, setPreset] = useState<AdminPresetId | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !user || !canAccessAdminPanel(user)) {
      setCapabilities([]);
      setPreset(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/session");
      const data = (await res.json()) as {
        error?: string;
        capabilities?: AdminCapability[];
        preset?: AdminPresetId | null;
      };
      if (!res.ok) throw new Error(data.error ?? "Не удалось загрузить права доступа");
      setCapabilities(data.capabilities ?? []);
      setPreset(data.preset ?? null);
    } catch (loadError) {
      setCapabilities([]);
      setPreset(null);
      setError(loadError instanceof Error ? loadError.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const hasCapability = useCallback(
    (cap: AdminCapability) => hasAdminCapability(capabilities, cap),
    [capabilities]
  );

  const value = useMemo(
    () => ({ capabilities, preset, loading, error, hasCapability, refresh }),
    [capabilities, preset, loading, error, hasCapability, refresh]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdminContext() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdminContext must be used within AdminProvider");
  return ctx;
}

export function useHasAdminCapability(capability: AdminCapability): boolean {
  const { hasCapability, loading } = useAdminContext();
  if (loading) return false;
  return hasCapability(capability);
}
