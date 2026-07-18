"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { TourDetail } from "@/types";

const TourReviewPanel = dynamic(() => import("./TourReviewPanel"), {
  ssr: false,
});

type OnDemandTourReviewPanelProps = {
  tour: Pick<TourDetail, "id" | "slug" | "title" | "partnerSource">;
  organizerTourId?: string;
};

export default function OnDemandTourReviewPanel({
  tour,
  organizerTourId,
}: OnDemandTourReviewPanelProps) {
  const boundaryRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (window.location.hash === "#leave-review") {
      setMounted(true);
      return;
    }

    const boundary = boundaryRef.current;
    if (!boundary || !("IntersectionObserver" in window)) {
      setMounted(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setMounted(true);
        observer.disconnect();
      },
      { rootMargin: "700px 0px" },
    );

    observer.observe(boundary);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={boundaryRef} id="leave-review" className="scroll-mt-24">
      {mounted ? <TourReviewPanel tour={tour} organizerTourId={organizerTourId} /> : null}
    </div>
  );
}
