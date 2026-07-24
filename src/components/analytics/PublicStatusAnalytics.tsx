"use client";

import { useEffect } from "react";
import { trackPublic404, trackPublic503 } from "@/lib/analytics/gtm-events";

export function Public404Analytics() {
  useEffect(() => {
    trackPublic404();
  }, []);
  return null;
}

export function Public503Analytics({
  slug,
  errorClass,
}: {
  slug?: string;
  errorClass?: string;
}) {
  useEffect(() => {
    trackPublic503({ slug, errorClass });
  }, [errorClass, slug]);
  return null;
}
