"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  readAdminDarkSidebar,
  readAdminDenseTables,
  writeAdminDarkSidebar,
  writeAdminDenseTables,
} from "@/lib/admin/layout-prefs";
import { cn } from "@/lib/cn";

type AdminLayoutPrefsValue = {
  denseTables: boolean;
  darkSidebar: boolean;
  setDenseTables: (value: boolean) => void;
  setDarkSidebar: (value: boolean) => void;
  toggleDenseTables: () => void;
  toggleDarkSidebar: () => void;
  tableClass: string;
  thClass: string;
  tdClass: string;
};

const AdminLayoutPrefsContext = createContext<AdminLayoutPrefsValue | null>(null);

export function AdminLayoutPrefsProvider({ children }: { children: React.ReactNode }) {
  const [denseTables, setDenseTablesState] = useState(false);
  const [darkSidebar, setDarkSidebarState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDenseTablesState(readAdminDenseTables());
    setDarkSidebarState(readAdminDarkSidebar());
    setHydrated(true);
  }, []);

  const setDenseTables = useCallback((value: boolean) => {
    setDenseTablesState(value);
    writeAdminDenseTables(value);
  }, []);

  const setDarkSidebar = useCallback((value: boolean) => {
    setDarkSidebarState(value);
    writeAdminDarkSidebar(value);
  }, []);

  const toggleDenseTables = useCallback(() => {
    setDenseTablesState((prev) => {
      const next = !prev;
      writeAdminDenseTables(next);
      return next;
    });
  }, []);

  const toggleDarkSidebar = useCallback(() => {
    setDarkSidebarState((prev) => {
      const next = !prev;
      writeAdminDarkSidebar(next);
      return next;
    });
  }, []);

  const tableClass = denseTables ? "text-xs" : "text-sm";
  const thClass = cn("font-medium text-slate", denseTables ? "px-3 py-2" : "px-4 py-3");
  const tdClass = denseTables ? "px-3 py-1.5" : "px-4 py-3";

  const value = useMemo(
    () => ({
      denseTables: hydrated ? denseTables : false,
      darkSidebar: hydrated ? darkSidebar : false,
      setDenseTables,
      setDarkSidebar,
      toggleDenseTables,
      toggleDarkSidebar,
      tableClass,
      thClass,
      tdClass,
    }),
    [
      hydrated,
      denseTables,
      darkSidebar,
      setDenseTables,
      setDarkSidebar,
      toggleDenseTables,
      toggleDarkSidebar,
      tableClass,
      thClass,
      tdClass,
    ]
  );

  return (
    <AdminLayoutPrefsContext.Provider value={value}>{children}</AdminLayoutPrefsContext.Provider>
  );
}

export function useAdminLayoutPrefs() {
  const ctx = useContext(AdminLayoutPrefsContext);
  if (!ctx) {
    throw new Error("useAdminLayoutPrefs must be used within AdminLayoutPrefsProvider");
  }
  return ctx;
}
