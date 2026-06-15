"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = email.trim();
    if (!value) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, source: "footer" }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Не удалось оформить подписку.");
      }

      setSubmitted(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Не удалось оформить подписку."
      );
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <p className="mt-6 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm text-slate shadow-card">
        Спасибо! Мы отправим новости о турах и советы по Аргентине на ваш email.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-card sm:p-5"
    >
      <p className="flex items-center gap-2 font-heading text-sm font-semibold text-charcoal">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky/10 text-sky">
          <Mail className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </span>
        Подписка на новости
      </p>
      <p className="mt-2 text-xs leading-relaxed text-slate">
        Туры, акции и советы по Аргентине
      </p>
      {error ? <p className="mt-2 text-xs text-error">{error}</p> : null}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="email@example.com"
          className="h-10 flex-1"
          aria-label="Email для подписки"
          disabled={loading}
          required
        />
        <Button type="submit" className="shrink-0 sm:px-5" disabled={loading}>
          {loading ? "…" : "Подписаться"}
        </Button>
      </div>
    </form>
  );
}
