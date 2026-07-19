"use client";

import dynamic from "next/dynamic";

const SiteSearch = dynamic(() => import("@/components/SiteSearch"), {
  ssr: false,
});

/**
 * Extra client boundary: Next can preload this tiny shell with the layout,
 * while the full local search index stays behind the first rendered request.
 */
export default function SiteSearchOnDemand() {
  return <SiteSearch initialOpen />;
}
