"use client";

import { Button } from "@/components/ui/button";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { PrivacyRequestStatus } from "@/types/privacy";

type PrivacyAuditEntry = {
  id: string;
  action: string;
  actorUserId: string | null;
  actorLabel: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

type PrivacyRequestItem = {
  id: string;
  user_id: string;
  userEmail: string | null;
  userFullName: string | null;
  request_type: string;
  status: PrivacyRequestStatus;
  reason: string | null;
  requested_at: string;
  processed_at: string | null;
  notes: string | null;
  auditLog?: PrivacyAuditEntry[];
};

type PrivacyRequestsResponse = {
  items?: PrivacyRequestItem[];
};

const STATUS_LABELS: Record<PrivacyRequestStatus, string> = {
  pending: "Ожидает",
  approved: "Одобрен",
  processing: "Обработка",
  completed: "Выполнен",
  rejected: "Отклонён",
  failed: "Ошибка",
};

export default function PrivacyRequestsView() {
  const { data, loading, error, refresh } = useAdminApi<PrivacyRequestsResponse>(
    "/api/admin/privacy-requests"
  );
  const items = data?.items ?? [];

  async function updateAction(id: string, action: "approve" | "reject") {
    const notes = window.prompt(
      action === "reject"
        ? "Комментарий для отклонения (необязательно)"
        : "Комментарий для запуска автоматической обработки (необязательно)"
    );

    const response = await fetch("/api/admin/privacy-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, notes: notes ?? undefined }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      window.alert(payload.error ?? "Не удалось обновить статус");
      return;
    }

    await refresh();
  }

  return (
    <CapabilityGate capability="operations.leads">
      <AdminPageShell>
        <AdminPageHeader
          title="Запросы на удаление данных"
          subtitle="GDPR soft delete: подтверждение заявок и автоматическая обработка через cron"
          actions={
            <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
              Обновить
            </Button>
          }
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <section className={`${cabinetCardClass} overflow-hidden`}>
          <ul className="divide-y divide-gray-100">
            {items.length === 0 ? (
              <li className="px-5 py-8 text-sm text-slate">
                {loading ? "Загрузка…" : "Запросов пока нет"}
              </li>
            ) : (
              items.map((item) => (
                <li key={item.id} className="space-y-3 px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-charcoal">
                        {item.userFullName || item.userEmail || item.user_id}
                      </p>
                      {item.userEmail ? (
                        <p className="text-sm text-slate">{item.userEmail}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-slate">
                        Запрошено: {formatAdminWhen(item.requested_at)}
                      </p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-charcoal">
                      {STATUS_LABELS[item.status]}
                    </span>
                  </div>

                  {item.reason ? (
                    <p className="text-sm text-slate">
                      <span className="font-medium text-charcoal">Причина:</span> {item.reason}
                    </p>
                  ) : null}

                  {item.notes ? (
                    <p className="text-sm text-slate">
                      <span className="font-medium text-charcoal">Заметка:</span> {item.notes}
                    </p>
                  ) : null}

                  {item.processed_at ? (
                    <p className="text-xs text-slate">
                      Завершено: {formatAdminWhen(item.processed_at)}
                    </p>
                  ) : null}

                  {item.status === "pending" || item.status === "failed" ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => void updateAction(item.id, "approve")}
                      >
                        Одобрить удаление
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void updateAction(item.id, "reject")}
                      >
                        Отклонить
                      </Button>
                    </div>
                  ) : null}

                  {(item.auditLog ?? []).length > 0 ? (
                    <div className="rounded-lg border border-gray-100 bg-surface-muted/40 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate">
                        Журнал действий
                      </p>
                      <ul className="mt-2 space-y-1.5 text-xs text-slate">
                        {(item.auditLog ?? []).slice(0, 6).map((entry) => (
                          <li key={entry.id}>
                            <span className="font-medium text-charcoal">{entry.actorLabel}</span>{" "}
                            — {entry.action} ({formatAdminWhen(entry.createdAt)})
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
