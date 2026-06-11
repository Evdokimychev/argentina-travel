"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function AuthQueryHandlerInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openAuth, isAuthenticated } = useAuth();

  useEffect(() => {
    const auth = searchParams.get("auth");
    if (auth !== "sign-in" || isAuthenticated) return;

    const role = searchParams.get("role");
    openAuth(role === "organizer" ? "organizer" : "default");

    const next = new URLSearchParams(searchParams.toString());
    next.delete("auth");
    next.delete("role");
    const query = next.toString();
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
