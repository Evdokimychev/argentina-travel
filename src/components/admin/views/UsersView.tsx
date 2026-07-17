"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminContext } from "@/context/AdminContext";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import { USER_MANAGEABLE_ROLES } from "@/lib/admin/user-identity-management";
import { cabinetCardClass, cabinetTableHeaderClass, cabinetTableWrapClass } from "@/lib/cabinet-ui";
import type { AccountRoleDb } from "@/types/database";

type AdminUserRow = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  roles: AccountRoleDb[];
  activeRole: AccountRoleDb;
  isBlocked: boolean;
  adminNotes: string | null;
  createdAt: string;
};

type UsersResponse = { users?: AdminUserRow[]; total?: number; limit?: number; offset?: number };

const FILTER_ROLES: AccountRoleDb[] = ["tourist", "organizer", "admin"];

const ROLE_LABELS: Record<AccountRoleDb, string> = {
  tourist: "Турист",
  organizer: "Организатор",
  admin: "Администратор",
};

function UserBlockButton({
  userId,
  isBlocked,
  onDone,
}: {
  userId: string;
  isBlocked: boolean;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const action = isBlocked ? "разблокировать" : "заблокировать";
    const confirmed = window.confirm(
      isBlocked
        ? "Разблокировать вход этого пользователя?"
        : "Заблокировать вход и завершить активные сеансы этого пользователя?",
    );
    if (!confirmed) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBlocked: !isBlocked }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? `Не удалось ${action} пользователя`);
      }
      onDone();
    } catch (toggleError) {
      alert(toggleError instanceof Error ? toggleError.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size="sm" variant="outline" disabled={busy} onClick={() => void toggle()}>
      {isBlocked ? "Разблокировать" : "Заблокировать"}
    </Button>
  );
}

function UserManagePanel({
  user,
  onDone,
}: {
  user: AdminUserRow;
  onDone: () => void;
}) {
  const [roles, setRoles] = useState<AccountRoleDb[]>(
    user.roles.filter((role) => role !== "admin").length
      ? user.roles.filter((role) => role !== "admin")
      : ["tourist"]
  );
  const [activeRole, setActiveRole] = useState<AccountRoleDb>(
    user.activeRole === "admin" ? "tourist" : user.activeRole,
  );
  const [adminNotes, setAdminNotes] = useState(user.adminNotes ?? "");
  const [busy, setBusy] = useState(false);

  function toggleRole(role: AccountRoleDb) {
    setRoles((prev) => {
      if (prev.includes(role)) {
        const next = prev.filter((r) => r !== role);
        return next.length ? next : ["tourist"];
      }
      return [...prev, role];
    });
  }

  async function save() {
    const rolesChanged =
      [...roles].sort().join(",") !== [...user.roles.filter((role) => role !== "admin")].sort().join(",") ||
      activeRole !== user.activeRole;
    if (
      rolesChanged &&
      !window.confirm("Сохранить новые роли пользователя? Изменение сразу повлияет на доступ к кабинету.")
    ) {
      return;
    }
    setBusy(true);
    try {
      const safeRoles = roles.length ? roles : (["tourist"] as AccountRoleDb[]);
      const safeActive = safeRoles.includes(activeRole) ? activeRole : safeRoles[0];
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roles: safeRoles,
          activeRole: safeActive,
          adminNotes: adminNotes.trim() || null,
        }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Ошибка сохранения");
      }
      onDone();
    } catch (saveError) {
      alert(saveError instanceof Error ? saveError.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50/80 p-4 text-sm">
      <p className="font-medium text-charcoal">{user.fullName}</p>
      <p className="text-xs leading-relaxed text-slate">
        Роль организатора можно выдать только после одобрения заявки. Доступ администраторов
        настраивается отдельно в разделе «Команда и доступы».
      </p>
      <div className="flex flex-wrap gap-2">
        {USER_MANAGEABLE_ROLES.map((role) => (
          <label key={role} className="flex items-center gap-2 text-xs text-charcoal">
            <input
              type="checkbox"
              checked={roles.includes(role)}
              onChange={() => toggleRole(role)}
            />
            {ROLE_LABELS[role]}
          </label>
        ))}
      </div>
      <label className="block space-y-1 text-xs text-slate">
        Активная роль
        <NativeSelect
          value={activeRole}
          onChange={(e) => setActiveRole(e.target.value as AccountRoleDb)}
        >
          {(roles.length ? roles : USER_MANAGEABLE_ROLES).map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </NativeSelect>
      </label>
      <label className="block space-y-1 text-xs text-slate">
        Заметки администратора
        <Input value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
      </label>
      <Button size="sm" disabled={busy} onClick={() => void save()}>
        Сохранить
      </Button>
    </div>
  );
}

export default function UsersView() {
  const { hasCapability } = useAdminContext();
  const canManage = hasCapability("users.manage");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [roleFilter, setRoleFilter] = useState<AccountRoleDb | "">("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "blocked">("");
  const [page, setPage] = useState(0);
  const [manageId, setManageId] = useState<string | null>(null);
  const queryUrl = useMemo(() => {
    const params = new URLSearchParams({ limit: "50", offset: String(page * 50) });
    if (deferredSearch) params.set("q", deferredSearch);
    if (roleFilter) params.set("role", roleFilter);
    if (statusFilter) params.set("status", statusFilter);
    return `/api/admin/users?${params.toString()}`;
  }, [deferredSearch, page, roleFilter, statusFilter]);
  const { data, loading, error, refresh } = useAdminApi<UsersResponse>(queryUrl);
  const users = useMemo(() => data?.users ?? [], [data?.users]);
  const total = data?.total ?? 0;
  const managedUser = users.find((user) => user.id === manageId);

  return (
    <CapabilityGate capability="users.view">
      <AdminPageShell>
        <AdminPageHeader
          title="Пользователи"
          subtitle={`Все аккаунты платформы · найдено ${total}`}
          actions={
            <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
              Обновить
            </Button>
          }
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className={`${cabinetCardClass} space-y-4 p-4 sm:p-6`}>
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); setManageId(null); }}
              placeholder="Поиск по имени, email, роли…"
              className="sm:max-w-md"
            />

            <div className="flex flex-wrap gap-3">
              <NativeSelect
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value as AccountRoleDb | ""); setPage(0); setManageId(null); }}
                className="sm:max-w-[180px]"
                aria-label="Фильтр по роли"
              >
                <option value="">Все роли</option>
                {FILTER_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </NativeSelect>
              <NativeSelect
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as "" | "active" | "blocked"); setPage(0); setManageId(null); }}
                className="sm:max-w-[180px]"
                aria-label="Фильтр по статусу"
              >
                <option value="">Все статусы</option>
                <option value="active">Активные</option>
                <option value="blocked">Заблокированные</option>
              </NativeSelect>
            </div>

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
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-10 text-center text-slate">
                        {loading ? "Загрузка…" : "Пользователи не найдены"}
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className={manageId === user.id ? "bg-sky/5" : undefined}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-charcoal">{user.fullName}</p>
                          <p className="text-xs text-slate">{user.email ?? "—"}</p>
                          {user.isBlocked ? (
                            <span className="text-xs font-medium text-red-600">Заблокирован</span>
                          ) : null}
                          {user.adminNotes ? (
                            <p className="mt-1 text-xs text-slate">Заметка: {user.adminNotes}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-slate">
                          {user.roles.map((r) => ROLE_LABELS[r] ?? r).join(", ")}
                          <br />
                          <span className="text-xs">активна: {ROLE_LABELS[user.activeRole] ?? user.activeRole}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate">{formatAdminWhen(user.createdAt)}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {canManage && !user.roles.includes("admin") ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setManageId(user.id === manageId ? null : user.id)}
                                >
                                  {manageId === user.id ? "Скрыть" : "Управление"}
                                </Button>
                                <UserBlockButton
                                  userId={user.id}
                                  isBlocked={user.isBlocked}
                                  onDone={() => void refresh()}
                                />
                              </>
                            ) : null}
                            {user.roles.includes("admin") ? (
                              <span className="text-xs text-slate">
                                Доступы: раздел «Команда»
                              </span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate">Показано {users.length} из {total}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={loading || page === 0} onClick={() => { setPage((value) => Math.max(0, value - 1)); setManageId(null); }}>
                  Назад
                </Button>
                <Button size="sm" variant="outline" disabled={loading || (page + 1) * 50 >= total} onClick={() => { setPage((value) => value + 1); setManageId(null); }}>
                  Дальше
                </Button>
              </div>
            </div>
          </section>

          {canManage && managedUser && !managedUser.roles.includes("admin") ? (
            <aside>
              <UserManagePanel
                user={managedUser}
                onDone={() => {
                  void refresh();
                  setManageId(null);
                }}
              />
            </aside>
          ) : null}
        </div>
      </AdminPageShell>
    </CapabilityGate>
  );
}
