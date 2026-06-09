"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth, useHasOrganizerRole } from "@/context/AuthContext";
import OrganizerSidebar, {
  OrganizerMobileHeader,
  OrganizerMobileNav,
} from "@/components/organizer/OrganizerSidebar";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";

export default function OrganizerShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, openAuth, addOrganizerRole } = useAuth();
  const hasOrganizerRole = useHasOrganizerRole(user);
  const [connectLoading, setConnectLoading] = useState(false);

  async function handleConnectRole() {
    setConnectLoading(true);
    await addOrganizerRole();
    setConnectLoading(false);
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="font-display text-2xl font-bold text-charcoal">Кабинет организатора</h1>
          <p className="mt-3 text-sm text-slate">Войдите, чтобы управлять турами и заявками</p>
          <Button type="button" className="mt-6" onClick={() => openAuth("organizer")}>
            Войти как организатор
          </Button>
        </div>
      </div>
    );
  }

  if (!hasOrganizerRole) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
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
  }

  return (
    <div className="bg-pampas">
      <OrganizerMobileHeader />
      <OrganizerMobileNav />

      <div className={cn(siteContainerClass, "flex items-start gap-4 py-4")}>
        <OrganizerSidebar userName={user.fullName} avatarUrl={user.avatarUrl} />

        <div className="min-w-0 flex-1">
          <div className="min-h-[calc(100vh-var(--site-header-height,72px)-2rem)] rounded-3xl md:min-h-[calc(100vh-var(--site-header-height,72px)-2.5rem)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
