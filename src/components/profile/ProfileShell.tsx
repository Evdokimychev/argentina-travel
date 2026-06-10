"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import AccessGate from "@/components/auth/AccessGate";
import { canAccessTouristCabinet } from "@/lib/permissions";
import ProfileSidebar, {
  ProfileMobileHeader,
  ProfileMobileNav,
} from "@/components/profile/ProfileSidebar";
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
      <div className="bg-pampas">
        <ProfileMobileHeader />
        <ProfileMobileNav />

        <div className={cn(siteContainerClass, "flex items-start gap-4 py-4")}>
          <ProfileSidebar userName={user.fullName} avatarUrl={user.avatarUrl} />

          <div className="min-w-0 flex-1">
            <div className="min-h-[calc(100vh-var(--site-header-height,72px)-2rem)] rounded-3xl md:min-h-[calc(100vh-var(--site-header-height,72px)-2.5rem)]">
              {children}
            </div>
          </div>
        </div>
      </div>
    </AccessGate>
  );
}
