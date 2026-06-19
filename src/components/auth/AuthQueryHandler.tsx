"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { clearAuthNextPath, storeAuthNextPath } from "@/lib/auth-redirect";

function AuthQueryHandlerInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openAuth, isAuthenticated } = useAuth();

  useEffect(() => {
    const auth = searchParams.get("auth");
    const next = searchParams.get("next");

    if (next?.startsWith("/")) {
      storeAuthNextPath(next);
    }

    if (auth !== "sign-in" || isAuthenticated) return;

    const role = searchParams.get("role");
    openAuth(role === "organizer" ? "organizer" : "default");

    const cleaned = new URLSearchParams(searchParams.toString());
    cleaned.delete("auth");
    cleaned.delete("role");
    cleaned.delete("next");
    const query = cleaned.toString();
    router.replace(query ? `/?${query}` : "/", { scroll: false });
  }, [isAuthenticated, openAuth, router, searchParams]);

  return null;
}

export default function AuthQueryHandler() {
  return (
    <Suspense fallback={null}>
      <AuthQueryHandlerInner />
    </Suspense>
  );
}
