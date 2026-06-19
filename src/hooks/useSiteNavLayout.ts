"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getSiteNavBarSections,
  type SiteNavBarLayout,
} from "@/data/site-nav";

export function useSiteNavLayout() {
  const [layout, setLayout] = useState<SiteNavBarLayout>("wide");

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
    const sync = () => setLayout(media.matches ? "wide" : "compact");
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const { primarySections, overflowSections } = useMemo(
    () => getSiteNavBarSections(layout),
    [layout]
  );

  return {
    layout,
    primarySections,
    overflowSections,
    showNavIndex: layout === "wide",
  };
}
