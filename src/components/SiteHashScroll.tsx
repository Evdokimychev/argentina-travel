"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { scrollToSiteAnchor, scrollToSiteHashWhenReady } from "@/lib/scroll-anchor";

export default function SiteHashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    const timer = window.setTimeout(() => scrollToSiteHashWhenReady(hash, "auto"), 100);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) scrollToSiteAnchor(hash, "smooth");
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return null;
}
