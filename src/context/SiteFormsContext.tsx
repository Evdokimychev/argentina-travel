"use client";

import { createContext, useContext } from "react";
import { DEFAULT_SITE_FORMS } from "@/lib/cms/site-globals/normalize";
import type { SiteFormsGlobal } from "@/types/site-globals";

type SiteFormsContextValue = {
  settings: SiteFormsGlobal;
  captchaSiteKey: string | null;
};

const SiteFormsContext = createContext<SiteFormsContextValue>({
  settings: DEFAULT_SITE_FORMS,
  captchaSiteKey: null,
});

export function SiteFormsProvider({
  children,
  settings,
  captchaSiteKey,
}: SiteFormsContextValue & { children: React.ReactNode }) {
  return (
    <SiteFormsContext.Provider value={{ settings, captchaSiteKey }}>
      {children}
    </SiteFormsContext.Provider>
  );
}

export function useSiteForms(): SiteFormsContextValue {
  return useContext(SiteFormsContext);
}
