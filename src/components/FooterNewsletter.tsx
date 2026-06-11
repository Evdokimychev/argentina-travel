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
      <p className="mt-6 text-sm text-gray-400">
        Спасибо! Мы отправим новости о турах и советы по Аргентине на ваш email.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-sm">
      <p className="flex items-center gap-2 text-sm font-medium text-gray-300">
        <Mail className="h-4 w-4 text-sun" strokeWidth={1.75} />
        Подписка на новости
      </p>
      <p className="mt-1 text-xs text-gray-500">Туры, акции и советы по Аргентине</p>
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
      <div className="mt-3 flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="email@example.com"
          className="h-10 border-gray-700 bg-charcoal/50 text-white placeholder:text-gray-500 focus:border-sky"
          aria-label="Email для подписки"
          disabled={loading}
          required
        />
        <Button type="submit" size="sm" className="shrink-0" disabled={loading}>
          {loading ? "…" : "OK"}
        </Button>
      </div>
    </form>
  );
}
