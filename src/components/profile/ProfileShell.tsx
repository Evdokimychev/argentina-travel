"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import AccessGate from "@/components/auth/AccessGate";
import { canAccessTouristCabinet } from "@/lib/permissions";
import ProfileSidebar, { ProfileMobileHeader } from "@/components/profile/ProfileSidebar";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";

export default function ProfileShell({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, openAuth } = useAuth();

  const loginFallback = (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="font-display text-2xl font-bold text-charcoal">Личный кабинет</h1>
        <p className="mt-3 text-sm text-slate">
          Войдите в аккаунт, чтобы управлять избранным, бронированиями и отзывами
        </p>
        <Button type="button" className="mt-6" onClick={() => openAuth()}>
          Войти
        </Button>
      </div>
    </div>
  );

  if (!isAuthenticated || !user) {
    return loginFallback;
  }

  return (
    <AccessGate allowed={canAccessTouristCabinet(user)} fallback={loginFallback}>
      <div className="bg-pampas pb-16">
        <ProfileMobileHeader userName={user.fullName} />

        <div className={cn(siteContainerClass, "py-4 md:py-6")}>
          <div className="mb-4 hidden md:block">
            <Link href="/" className="text-sm text-slate transition-colors hover:text-brand">
              ← На главную
            </Link>
            <h1 className="mt-1 font-display text-2xl font-bold text-charcoal">Личный кабинет</h1>
          </div>

          <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)] md:items-start">
            <aside className="md:sticky md:top-[calc(var(--site-header-height,72px)+1rem)] md:rounded-3xl md:border md:border-gray-200 md:bg-white md:p-4 md:shadow-sm">
              <ProfileSidebar userName={user.fullName} avatarUrl={user.avatarUrl} />
            </aside>

            <div className="min-w-0">{children}</div>
          </div>
        </div>
      </div>
    </AccessGate>
  );
}
