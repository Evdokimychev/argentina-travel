"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isSupabaseForumEnabled } from "@/lib/auth-mode";
import { cn } from "@/lib/cn";
import { FORUM_REPORT_REASON_LABELS, type ForumReportReason } from "@/lib/forum/forum-types";

const REPORT_OPTIONS: Array<{ value: ForumReportReason; label: string }> = [
  { value: "spam", label: "Спам или реклама" },
  { value: "offensive", label: "Оскорбления" },
  { value: "fake", label: "Подозрительная информация" },
  { value: "irrelevant", label: "Не по теме" },
  { value: "other", label: "Другое" },
];

type ForumReportButtonProps = {
  postId: string;
  className?: string;
};

export default function ForumReportButton({ postId, className }: ForumReportButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ForumReportReason>("spam");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isSupabaseForumEnabled()) return null;

  async function handleSubmit() {
    if (!user) return;
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/forum/posts/${postId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Не удалось отправить жалобу");
      setMessage("Жалоба отправлена модераторам. Спасибо.");
      setOpen(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Ошибка");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1 text-xs text-slate transition-colors hover:text-sky"
      >
        <Flag className="h-3.5 w-3.5" strokeWidth={1.75} />
        Пожаловаться
      </button>

      {open ? (
        <div className="absolute right-0 z-10 mt-2 w-72 rounded-xl border border-border-subtle bg-surface-elevated p-4 shadow-lg">
          <p className="text-sm font-medium text-charcoal">Жалоба на сообщение</p>
          <label className="mt-3 block text-xs text-slate">
            Причина
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value as ForumReportReason)}
              className="mt-1 w-full rounded-lg border border-border-subtle bg-surface px-2 py-1.5 text-sm text-charcoal"
            >
              {REPORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {FORUM_REPORT_REASON_LABELS[option.value]}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-3 block text-xs text-slate">
            Комментарий (необязательно)
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-border-subtle bg-surface px-2 py-1.5 text-sm text-charcoal"
            />
          </label>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleSubmit()}
              className="rounded-lg bg-sky px-3 py-1.5 text-xs font-medium text-white hover:bg-sky/90 disabled:opacity-60"
            >
              Отправить
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-slate hover:text-charcoal"
            >
              Отмена
            </button>
          </div>
        </div>
      ) : null}

      {message ? <p className="mt-1 text-xs text-success">{message}</p> : null}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
