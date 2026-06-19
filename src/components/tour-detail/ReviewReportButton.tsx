"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isSupabaseReviewsEnabled } from "@/lib/auth-mode";
import { cn } from "@/lib/cn";

const REPORT_OPTIONS = [
  { value: "spam", label: "Спам или реклама" },
  { value: "offensive", label: "Оскорбления или ненормативная лексика" },
  { value: "fake", label: "Подозрение на фальсификацию" },
  { value: "irrelevant", label: "Не относится к туру" },
  { value: "other", label: "Другое" },
] as const;

type ReviewReportButtonProps = {
  reviewId: string;
  className?: string;
};

export default function ReviewReportButton({ reviewId, className }: ReviewReportButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REPORT_OPTIONS)[number]["value"]>("spam");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isSupabaseReviewsEnabled() || reviewId.startsWith("tripster-")) {
    return null;
  }

  async function handleSubmit() {
    if (!user) return;
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details: details.trim() || undefined }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Не удалось отправить жалобу");
      setMessage("Жалоба принята — модератор проверит отзыв.");
      setOpen(false);
      setDetails("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Ошибка отправки");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <div className={cn("mt-3", className)}>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate transition-colors hover:text-charcoal"
        >
          <Flag className="h-3.5 w-3.5" aria-hidden />
          Пожаловаться на отзыв
        </button>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
          <p className="text-sm font-medium text-charcoal">Жалоба на отзыв</p>
          <fieldset className="mt-3 space-y-2">
            {REPORT_OPTIONS.map((option) => (
              <label key={option.value} className="flex cursor-pointer items-start gap-2 text-sm text-slate">
                <input
                  type="radio"
                  name={`report-${reviewId}`}
                  value={option.value}
                  checked={reason === option.value}
                  onChange={() => setReason(option.value)}
                  className="mt-0.5"
                />
                {option.label}
              </label>
            ))}
          </fieldset>
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Дополнительные детали (необязательно)"
            className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal outline-none ring-sky/30 focus:ring-2"
          />
          {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleSubmit()}
              className="rounded-lg bg-charcoal px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
            >
              {submitting ? "Отправка…" : "Отправить жалобу"}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-slate"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
      {message ? <p className="mt-2 text-xs text-emerald-700">{message}</p> : null}
    </div>
  );
}
