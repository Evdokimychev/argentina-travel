"use client";

import type { ReactNode } from "react";
import type { SessionUser } from "@/types/user";

export default function AccessGate({
  allowed,
  fallback,
  children,
}: {
  allowed: boolean;
  fallback: ReactNode;
  children: ReactNode;
}) {
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}

export function accessGateForUser(
  user: SessionUser | null,
  check: (actor: SessionUser | null) => boolean
): boolean {
  return check(user);
}
