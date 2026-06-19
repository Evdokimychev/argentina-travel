"use client";

import { Button } from "@/components/ui/button";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import { cabinetCardClass } from "@/lib/cabinet-ui";

type AuditEntry = {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  payload: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
};

type AuditResponse = { entries?: AuditEntry[] };

export default function AuditLogView() {
  const { data, loading, error, refresh } = useAdminApi<AuditResponse>("/api/admin/audit");
  const entries = data?.entries ?? [];

  return (
    <CapabilityGate capability="system.audit">
      <AdminPageShell>
        <AdminPageHeader
          title="Журнал действий"
          subtitle="Последние операции администраторов"
          actions={
            <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
              Обновить
            </Button>
          }
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <section className={`${cabinetCardClass} overflow-hidden`}>
          <ul className="divide-y divide-gray-100">
            {entries.length === 0 ? (
              <li className="px-5 py-10 text-sm text-slate">
                {loading ? "Загрузка…" : "Записей пока нет"}
              </li>
            ) : (
              entries.map((entry) => (
                <li key={entry.id} className="space-y-1 px-5 py-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-charcoal">{entry.action}</span>
                    <span className="text-slate">{formatAdminWhen(entry.created_at)}</span>
                  </div>
                  <p className="text-slate">
                    {entry.entity_type ?? "—"} · {entry.entity_id ?? "—"} ·{" "}
                    {entry.actor_user_id ?? "system"}
                  </p>
                  {entry.ip_address ? <p className="text-xs text-slate">IP: {entry.ip_address}</p> : null}
                </li>
              ))
            )}
          </ul>
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
