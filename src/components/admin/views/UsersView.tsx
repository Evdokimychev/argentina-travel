"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import { cabinetCardClass, cabinetTableHeaderClass, cabinetTableWrapClass } from "@/lib/cabinet-ui";

type AdminUserRow = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  roles: string[];
  activeRole: string;
  isBlocked: boolean;
  createdAt: string;
};

type UsersResponse = { users?: AdminUserRow[] };

export default function UsersView() {
  const { data, loading, error, refresh } = useAdminApi<UsersResponse>("/api/admin/users");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const users = data?.users ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => {
      const haystack = [user.fullName, user.email, user.phone, user.roles.join(" ")]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [data?.users, search]);

  return (
    <CapabilityGate capability="users.view">
      <AdminPageShell>
        <AdminPageHeader
          title="Пользователи"
          subtitle="Аккаунты платформы (последние 100)"
          actions={
            <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
              Обновить
            </Button>
          }
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <section className={`${cabinetCardClass} space-y-4 p-4 sm:p-6`}>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени, email, роли…"
            className="sm:max-w-md"
          />

          <div className={cabinetTableWrapClass}>
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className={cabinetTableHeaderClass}>
                <tr>
                  <th className="px-4 py-3 font-medium text-slate">Пользователь</th>
                  <th className="px-4 py-3 font-medium text-slate">Роли</th>
                  <th className="px-4 py-3 font-medium text-slate">Регистрация</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-slate">
                      {loading ? "Загрузка…" : "Пользователи не найдены"}
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-charcoal">{user.fullName}</p>
                        <p className="text-xs text-slate">{user.email ?? "—"}</p>
                        {user.isBlocked ? (
                          <span className="text-xs font-medium text-red-600">Заблокирован</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate">
                        {user.roles.join(", ")} · активна: {user.activeRole}
                      </td>
                      <td className="px-4 py-3 text-slate">{formatAdminWhen(user.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
