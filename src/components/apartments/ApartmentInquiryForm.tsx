"use client";

import { useRef, useState } from "react";
import TurnstileField from "@/components/forms/TurnstileField";

export default function ApartmentInquiryForm({ slug, maxGuests, minimumStayNights }: { slug: string; maxGuests: number; minimumStayNights: number }) {
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [startDate, setStartDate] = useState("");
  const idempotencyKey = useRef<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const formElement = event.currentTarget;
    setStatus("sending");
    setMessage("");
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());
    idempotencyKey.current ??= crypto.randomUUID();
    try {
      const response = await fetch(`/api/apartments/${encodeURIComponent(slug)}/inquiries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey.current,
        },
        body: JSON.stringify({ ...payload, guests: Number(payload.guests), captchaToken }),
      });
      const body = await response.json().catch(() => ({})) as { message?: string; error?: string };
      if (!response.ok) {
        setStatus("error");
        setMessage(body.error ?? "Не удалось отправить заявку. Проверьте данные и повторите.");
        return;
      }
      setStatus("success");
      setMessage(body.message ?? "Заявка принята и ожидает подтверждения.");
      formElement.reset();
      setStartDate("");
      idempotencyKey.current = null;
    } catch {
      setStatus("error");
      setMessage("Связь прервалась. Повторите отправку — дубликат заявки не создастся.");
    } finally {
      setCaptchaToken("");
      setCaptchaResetSignal((signal) => signal + 1);
    }
  }

  return (
    <form
      onSubmit={submit}
      onChange={() => {
        if (status !== "sending") idempotencyKey.current = null;
      }}
      className="space-y-4 rounded-3xl border border-border-subtle bg-white p-5 shadow-sm dark:bg-surface-elevated"
    >
      <div><h2 className="font-heading text-xl font-bold">Запросить даты</h2><p className="mt-1 text-sm text-slate">Это заявка, а не мгновенная бронь. Мы сначала подтвердим доступность и итоговые условия.</p></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Заезд<input required name="startDate" type="date" value={startDate} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setStartDate(event.target.value)} className="mt-1 w-full rounded-xl border border-border-subtle bg-transparent px-3 py-2" /></label>
        <label className="text-sm font-medium">Выезд<input required name="endDate" type="date" min={startDate || new Date().toISOString().slice(0, 10)} className="mt-1 w-full rounded-xl border border-border-subtle bg-transparent px-3 py-2" /></label>
      </div>
      <p className="text-xs text-slate">Минимум {minimumStayNights} ноч.; до {maxGuests} гостей.</p>
      <label className="block text-sm font-medium">Гостей<input required name="guests" type="number" min={1} max={maxGuests} defaultValue={1} className="mt-1 w-full rounded-xl border border-border-subtle bg-transparent px-3 py-2" /></label>
      <label className="block text-sm font-medium">Имя<input required name="name" minLength={2} className="mt-1 w-full rounded-xl border border-border-subtle bg-transparent px-3 py-2" /></label>
      <label className="block text-sm font-medium">Email<input required name="email" type="email" className="mt-1 w-full rounded-xl border border-border-subtle bg-transparent px-3 py-2" /></label>
      <label className="block text-sm font-medium">Телефон<input name="phone" className="mt-1 w-full rounded-xl border border-border-subtle bg-transparent px-3 py-2" /></label>
      <label className="block text-sm font-medium">Пожелания<textarea name="message" maxLength={2000} rows={3} className="mt-1 w-full rounded-xl border border-border-subtle bg-transparent px-3 py-2" /></label>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <TurnstileField formId="native_booking" onToken={setCaptchaToken} resetSignal={captchaResetSignal} />
      <button disabled={status === "sending"} className="w-full rounded-xl bg-wine px-4 py-3 font-semibold text-white disabled:opacity-60">{status === "sending" ? "Отправляем…" : "Отправить запрос"}</button>
      {message ? <p role={status === "error" ? "alert" : "status"} aria-live="polite" className={`text-sm ${status === "success" ? "text-emerald-700" : "text-red-700"}`}>{message}</p> : null}
    </form>
  );
}
