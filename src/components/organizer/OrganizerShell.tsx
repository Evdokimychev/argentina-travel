"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth, useCanAccessOrganizerPanel } from "@/context/AuthContext";
import AccessGate from "@/components/auth/AccessGate";
import { canAccessOrganizerPanel } from "@/lib/permissions";
import { userHasAccountRole } from "@/types/user";
import OrganizerSidebar, {
  OrganizerMobileHeader,
  OrganizerMobileNav,
} from "@/components/organizer/OrganizerSidebar";
import { cn } from "@/lib/cn";
import {
  cabinetContentGapClass,
  cabinetPanelClass,
  cabinetShellClass,
} from "@/lib/cabinet-ui";
import { siteContainerClass } from "@/lib/site-container";

export default function OrganizerShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, openAuth, addOrganizerRole } = useAuth();
  const hasOrganizerAccess = useCanAccessOrganizerPanel(user);
  const [connectLoading, setConnectLoading] = useState(false);

  async function handleConnectRole() {
    setConnectLoading(true);
    await addOrganizerRole();
    setConnectLoading(false);
  }

  const loginFallback = (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <div className={cn(cabinetPanelClass, "mx-auto max-w-lg text-center")}>
        <h1 className="font-display text-2xl font-bold text-charcoal">Кабинет организатора</h1>
        <p className="mt-3 text-sm text-slate">Войдите, чтобы управлять турами и заявками</p>
        <Button type="button" className="mt-6" onClick={() => openAuth("organizer")}>
          Войти как организатор
        </Button>
      </div>
    </div>
  );

  if (!isAuthenticated || !user) {
    return loginFallback;
  }

  const connectRoleFallback = (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <div className={cn(cabinetPanelClass, "mx-auto max-w-lg")}>
        <h1 className="font-display text-2xl font-bold text-charcoal">Подключите роль организатора</h1>
        <p className="mt-3 text-sm text-slate">
          Аккаунт <span className="font-medium text-charcoal">{user.fullName}</span> зарегистрирован
          как турист. Подключите роль организатора для доступа к кабинету.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button type="button" disabled={connectLoading} onClick={handleConnectRole}>
            {connectLoading ? "Подключаем…" : "Подключить роль"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/join")}>
            Подробнее
          </Button>
        </div>
      </div>
    </div>
  );

  const needsOrganizerRole =
    isAuthenticated && user != null && userHasAccountRole(user, "tourist") && !canAccessOrganizerPanel(user);

  if (needsOrganizerRole) {
    return connectRoleFallback;
  }

  return (
    <AccessGate allowed={hasOrganizerAccess} fallback={connectRoleFallback}>
      <div className={cabinetShellClass}>
        <OrganizerMobileHeader />
        <OrganizerMobileNav />

        <div className={cn(siteContainerClass, cabinetContentGapClass)}>
          <OrganizerSidebar userName={user.fullName} avatarUrl={user.avatarUrl} />

          <div className="min-w-0 flex-1">
            <div className="min-h-[calc(100vh-var(--site-header-full-height,72px)-2rem)] rounded-3xl md:min-h-[calc(100vh-var(--site-header-full-height,72px)-2.5rem)]">
              {children}
            </div>
          </div>
        </div>
      </div>
    </AccessGate>
  );
}
