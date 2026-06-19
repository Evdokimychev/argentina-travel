"use client";

import { useEffect } from "react";
import { bindInteractionTrackingLifecycle } from "@/lib/personalization/interactions-client";

export default function InteractionTrackingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => bindInteractionTrackingLifecycle(), []);
  return children;
}
