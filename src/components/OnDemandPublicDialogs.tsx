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
  const [searchInitiallyOpen, setSearchInitiallyOpen] = useState(false);
  const [mapInitiallyOpen, setMapInitiallyOpen] = useState(false);

  useEffect(() => {
    function requestSearch() {
      if (!searchEnabled) return;
      if (searchMounted) return;
      setSearchInitiallyOpen(true);
      setSearchMounted(true);
    }

    function requestMap() {
      if (mapMounted) return;
      setMapInitiallyOpen(true);
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

  return (
    <>
      {searchMounted ? <SiteSearch initialOpen={searchInitiallyOpen} /> : null}
      {mapMounted ? <QuickExploreDialogHost initialOpen={mapInitiallyOpen} /> : null}
    </>
  );
}
