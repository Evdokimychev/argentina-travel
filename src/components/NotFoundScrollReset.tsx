"use client";

import { useEffect } from "react";

/** 404 has no hash targets — reset scroll so the message is not hidden below the footer. */
export default function NotFoundScrollReset() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return null;
}
