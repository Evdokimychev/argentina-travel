"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

type BlogIndexUrlSyncProps = {
  onTagFromUrl: (tag: string | null) => void;
  onCategoryFromUrl: (category: string | null) => void;
  onScrollToResults: () => void;
};

function BlogIndexUrlSyncContent({
  onTagFromUrl,
  onCategoryFromUrl,
  onScrollToResults,
}: BlogIndexUrlSyncProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const tagFromUrl = searchParams.get("tag")?.trim() || null;
    const categoryFromUrl = searchParams.get("category")?.trim() || null;

    onTagFromUrl(tagFromUrl);
    if (categoryFromUrl) {
      onCategoryFromUrl(categoryFromUrl);
      onScrollToResults();
    } else if (tagFromUrl) {
      onScrollToResults();
    }
  }, [searchParams, onTagFromUrl, onCategoryFromUrl, onScrollToResults]);

  return null;
}

/** Isolated useSearchParams — keeps BlogIndexView catalog from suspending with an empty fallback. */
export default function BlogIndexUrlSync(props: BlogIndexUrlSyncProps) {
  return (
    <Suspense fallback={null}>
      <BlogIndexUrlSyncContent {...props} />
    </Suspense>
  );
}
