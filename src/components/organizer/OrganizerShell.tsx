"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth, useCanAccessOrganizerPanel } from "@/context/AuthContext";
import AccessGate from "@/components/auth/AccessGate";
import { canAccessOrganizerPanel } from "@/lib/permissions";
import { userHasAccountRole } from "@/types/user";
import OrganizerSidebar, {
  isOrganizerEditorRoute,
  OrganizerMobileHeader,
  OrganizerMobileNav,
} from "@/components/organizer/OrganizerSidebar";
import { cn } from "@/lib/cn";
import {
  cabinetContentGapClass,
  cabinetMobileBottomInsetClass,
  cabinetPanelClass,
  cabinetShellClass,
} from "@/lib/cabinet-ui";
import { siteContainerClass } from "@/lib/site-container";

export default function OrganizerShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, authHydrated, openAuth } = useAuth();
  const hasOrganizerAccess = useCanAccessOrganizerPanel(user);

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

  if (!authHydrated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div className={cn(cabinetPanelClass, "text-center text-sm text-slate")}>
          Проверяем сессию…
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return loginFallback;
  }

  const connectRoleFallback = (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <div className={cn(cabinetPanelClass, "mx-auto max-w-lg")}>
        <h1 className="font-display text-2xl font-bold text-charcoal">Подайте заявку организатора</h1>
        <p className="mt-3 text-sm text-slate">
          Аккаунт <span className="font-medium text-charcoal">{user.fullName}</span> зарегистрирован
          как турист. Заполните анкету — после проверки мы откроем доступ к кабинету.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={() => router.push("/join")}>
            Подать заявку
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
      <div className={cn(cabinetShellClass, cabinetMobileBottomInsetClass)}>
        <OrganizerMobileHeader />
        {!isOrganizerEditorRoute(pathname) ? <OrganizerMobileNav /> : null}

        <div className={cn(siteContainerClass, cabinetContentGapClass)}>
          <OrganizerSidebar userName={user.fullName} avatarUrl={user.avatarUrl} />

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </AccessGate>
  );
}
