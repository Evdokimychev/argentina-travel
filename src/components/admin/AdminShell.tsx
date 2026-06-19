"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { canAccessAdminPanel } from "@/lib/permissions";
import { cn } from "@/lib/cn";
import { cabinetContentGapClass, cabinetPanelClass, cabinetShellClass } from "@/lib/cabinet-ui";
import { AdminProvider, useAdminContext } from "@/context/AdminContext";
import { AdminLayoutPrefsProvider } from "@/context/AdminLayoutPrefsContext";
import AdminCommandPalette from "@/components/admin/AdminCommandPalette";
import AdminSidebar, { AdminMobileHeader, AdminMobileNav } from "@/components/admin/AdminSidebar";

function AdminAccessGate({
  children,
  buildVersionChip,
}: {
  children: React.ReactNode;
  buildVersionChip?: React.ReactNode;
}) {
  const { user, isAuthenticated, authHydrated, openAuth } = useAuth();
  const { loading, error } = useAdminContext();

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
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div className={cn(cabinetPanelClass, "mx-auto max-w-lg text-center")}>
          <h1 className="font-display text-2xl font-bold text-charcoal">Админ-панель</h1>
          <p className="mt-3 text-sm text-slate">Войдите под учётной записью администратора</p>
          <Button type="button" className="mt-6" onClick={() => openAuth("default")}>
            Войти
          </Button>
        </div>
      </div>
    );
  }

  if (!canAccessAdminPanel(user)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div className={cn(cabinetPanelClass, "mx-auto max-w-lg text-center")}>
          <h1 className="font-display text-2xl font-bold text-charcoal">Нет доступа</h1>
          <p className="mt-3 text-sm text-slate">
            У аккаунта <span className="font-medium text-charcoal">{user.fullName}</span> (
            {user.email}) нет роли администратора. Проверьте, что в Supabase в таблице{" "}
            <code className="text-xs">profiles</code> у этого пользователя в массиве{" "}
            <code className="text-xs">roles</code> есть значение{" "}
            <code className="text-xs">admin</code>, затем выйдите и войдите снова.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div className={cn(cabinetPanelClass, "text-center text-sm text-slate")}>
          Загрузка прав доступа…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div className={cn(cabinetPanelClass, "text-center")}>
          <p className="text-sm text-red-600">{error}</p>
          <p className="mt-3 text-xs text-slate">
            Если роль уже назначена в Supabase — выйдите из аккаунта и войдите заново. На
            production нужен деплой ветки с админ-панелью.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cabinetShellClass}>
      <AdminMobileHeader buildVersionChip={buildVersionChip} />
      <div className={cabinetContentGapClass}>
        <AdminSidebar buildVersionChip={buildVersionChip} />
        <main className="min-w-0 flex-1 px-4 md:px-0">{children}</main>
      </div>
      <AdminMobileNav />
    </div>
  );
}

export default function AdminShell({
  children,
  buildVersionChip,
}: {
  children: React.ReactNode;
  buildVersionChip?: React.ReactNode;
}) {
  return (
    <AdminProvider>
      <AdminLayoutPrefsProvider>
        <AdminAccessGate buildVersionChip={buildVersionChip}>{children}</AdminAccessGate>
        <AdminCommandPalette />
      </AdminLayoutPrefsProvider>
    </AdminProvider>
  );
}
