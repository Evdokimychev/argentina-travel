"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { SITE_MAP_OPEN_EVENT } from "@/lib/site-map-events";
import { SITE_SEARCH_OPEN_EVENT } from "@/lib/site-search-open";

const SiteSearch = dynamic(() => import("@/components/SiteSearch"), { ssr: false });
const QuickExploreDialogHost = dynamic(
  () => import("@/components/quick-explore/QuickExploreDialogHost"),
  { ssr: false },
);

export default function OnDemandPublicDialogs({ searchEnabled = true }: { searchEnabled?: boolean }) {
  const [searchMounted, setSearchMounted] = useState(false);
  const [mapMounted, setMapMounted] = useState(false);
  const [pendingSearchOpen, setPendingSearchOpen] = useState(false);
  const [pendingMapOpen, setPendingMapOpen] = useState(false);

  useEffect(() => {
    function requestSearch() {
      if (!searchEnabled) return;
      if (searchMounted) return;
      setPendingSearchOpen(true);
      setSearchMounted(true);
    }

    function requestMap() {
      if (mapMounted) return;
      setPendingMapOpen(true);
      setMapMounted(true);
    }

    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        requestSearch();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(SITE_SEARCH_OPEN_EVENT, requestSearch);
    window.addEventListener(SITE_MAP_OPEN_EVENT, requestMap);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(SITE_SEARCH_OPEN_EVENT, requestSearch);
      window.removeEventListener(SITE_MAP_OPEN_EVENT, requestMap);
    };
  }, [mapMounted, searchEnabled, searchMounted]);

  useEffect(() => {
    if (!pendingSearchOpen || !searchMounted) return;
    const timer = window.setTimeout(() => {
      setPendingSearchOpen(false);
      window.dispatchEvent(new CustomEvent(SITE_SEARCH_OPEN_EVENT));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pendingSearchOpen, searchMounted]);

  useEffect(() => {
    if (!pendingMapOpen || !mapMounted) return;
    const timer = window.setTimeout(() => {
      setPendingMapOpen(false);
      window.dispatchEvent(new CustomEvent(SITE_MAP_OPEN_EVENT));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [mapMounted, pendingMapOpen]);

  return (
    <>
      {searchMounted ? <SiteSearch /> : null}
      {mapMounted ? <QuickExploreDialogHost /> : null}
    </>
  );
}
