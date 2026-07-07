"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSiteFeedback } from "@/context/SiteFeedbackContext";
import { clearAuthNextPath, storeAuthNextPath } from "@/lib/auth-redirect";

function AuthQueryHandlerInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openAuth, isAuthenticated, logout } = useAuth();
  const feedback = useSiteFeedback();

  useEffect(() => {
    const auth = searchParams.get("auth");
    const next = searchParams.get("next");
    const errorCode = searchParams.get("error");

    if (next?.startsWith("/")) {
      storeAuthNextPath(next);
    }

    if (errorCode === "account-blocked") {
      logout();
      feedback.showError({
        title: "Аккаунт заблокирован",
        description: "Доступ к личному кабинету ограничен администратором.",
        steps: [
          "Если считаете это ошибкой — напишите в поддержку",
          "Укажите email, с которым регистрировались",
        ],
        action: { label: "Контакты", href: "/contacts" },
      });
      const cleaned = new URLSearchParams(searchParams.toString());
      cleaned.delete("error");
      const query = cleaned.toString();
      router.replace(query ? `/?${query}` : "/", { scroll: false });
      return;
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
  }, [feedback, isAuthenticated, logout, openAuth, router, searchParams]);

  return null;
}

export default function AuthQueryHandler() {
  return (
    <Suspense fallback={null}>
      <AuthQueryHandlerInner />
    </Suspense>
  );
}
