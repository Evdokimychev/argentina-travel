"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { useAuth } from "@/context/AuthContext";
import { cabinetPanelClass, cabinetPageSubtitleClass, cabinetPageTitleClass } from "@/lib/cabinet-ui";
import { cn } from "@/lib/cn";

type PrivacySettingsSectionProps = {
  className?: string;
};

export default function PrivacySettingsSection({ className }: PrivacySettingsSectionProps) {
  const { user } = useAuth();
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  if (!user) return null;

  async function handleExport() {
    setExportLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/privacy/export", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(typeof payload.error === "string" ? payload.error : "Export failed");
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `privacy-export-${user!.id}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage({ type: "success", text: "Файл с вашими данными загружен." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Не удалось выгрузить данные",
      });
    } finally {
      setExportLoading(false);
    }
  }

  async function handleDeleteRequest() {
    const confirmed = window.confirm(
      "Отправить запрос на удаление аккаунта и персональных данных? После подтверждения заявка автоматически обрабатывается в защищённом GDPR-пайплайне."
    );
    if (!confirmed) return;

    setDeleteLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/privacy/delete-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(typeof payload.error === "string" ? payload.error : "Request failed");
      }
      setReason("");
      setMessage({
        type: "success",
        text: "Запрос принят. После подтверждения администратором мы автоматически завершим обезличивание и отправим уведомление на email.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Не удалось отправить запрос",
      });
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <section className={cn(cabinetPanelClass, className)}>
      <h2 className={cabinetPageTitleClass}>Конфиденциальность</h2>
      <p className={cabinetPageSubtitleClass}>
        Выгрузка персональных данных и запрос на удаление аккаунта (GDPR)
      </p>

      <div className="mt-5 space-y-5">
        <div className="rounded-xl border border-gray-100 bg-surface-muted/40 p-4">
          <h3 className="text-sm font-semibold text-charcoal">Выгрузка данных</h3>
          <p className="mt-1 text-sm text-slate">
            Скачайте JSON с бронированиями, отзывами и сообщениями, связанными с вашим аккаунтом.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            loading={exportLoading}
            loadingLabel="Готовим файл…"
            onClick={() => void handleExport()}
          >
            Скачать мои данные
          </Button>
        </div>

        <div className="rounded-xl border border-gray-100 bg-surface-muted/40 p-4">
          <h3 className="text-sm font-semibold text-charcoal">Удаление аккаунта</h3>
          <p className="mt-1 text-sm text-slate">
            Запрос попадает в очередь операций. После проверки мы удалим или анонимизируем ваши
            данные, кроме записей, которые нужно хранить по закону (например, платёжные документы).
          </p>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Причина (необязательно)"
            rows={3}
            className="mt-3"
          />
          <Button
            type="button"
            variant="destructive"
            className="mt-3"
            loading={deleteLoading}
            loadingLabel="Отправляем…"
            onClick={() => void handleDeleteRequest()}
          >
            Запросить удаление
          </Button>
        </div>
      </div>

      {message ? (
        <InlineFeedback
          variant={message.type}
          title={message.type === "success" ? "Готово" : "Ошибка"}
          description={message.text}
          className="mt-4"
        />
      ) : null}
    </section>
  );
}
