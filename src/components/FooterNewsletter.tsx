"use client";

import { useState } from "react";
import { Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { useSiteFeedback } from "@/context/SiteFeedbackContext";
import { normalizeSiteError } from "@/lib/site-feedback/normalize-error";
import type { SiteFeedbackMessage } from "@/types/site-feedback";
import { trackNewsletterSubscribe } from "@/lib/analytics/gtm-events";
import { tokenCardSurfaceClass } from "@/lib/design-tokens";
import { cn } from "@/lib/cn";

export default function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<SiteFeedbackMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const feedback = useSiteFeedback();

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
      trackNewsletterSubscribe({ source: "footer" });
      feedback.success({
        title: "Подписка оформлена",
        description: "Мы будем присылать новости о турах и советы по Аргентине.",
      });
    } catch (submitError) {
      const normalized = normalizeSiteError(submitError, {
        title: "Не удалось оформить подписку",
        steps: ["Проверьте правильность email", "Попробуйте ещё раз через минуту"],
      });
      setError(normalized);
      feedback.showError(normalized);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <InlineFeedback
        variant="success"
        title="Спасибо за подписку!"
        description="Мы отправим новости о турах и советы по Аргентине на ваш email."
        className="mt-6"
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "relative mt-6 overflow-hidden p-4 sm:p-5",
        tokenCardSurfaceClass,
        "border-sky/15 bg-gradient-to-br from-sky/[0.07] via-surface-elevated to-surface-elevated dark:from-sky/[0.1]",
      )}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-sky/10 blur-2xl"
        aria-hidden
      />
      <p className="relative flex items-center gap-2 font-heading text-sm font-semibold text-foreground">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky/12 text-sky ring-1 ring-sky/20">
          <Mail className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </span>
        Подписка на новости
        <Sparkles className="ml-auto h-3.5 w-3.5 text-sky/70" aria-hidden />
      </p>
      <p className="relative mt-2 text-xs leading-relaxed text-slate">
        Туры, акции и практические советы по Аргентине — без спама, раз в две недели.
      </p>
      {error ? (
        <InlineFeedback
          variant="error"
          title={error.title}
          description={error.description}
          steps={error.steps}
          className="relative mt-3"
        />
      ) : null}
      <div className="relative mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="email@example.com"
          className="h-10 flex-1 border-border-subtle bg-surface-elevated/90"
          aria-label="Email для подписки"
          disabled={loading}
          required
        />
        <Button type="submit" className="shrink-0 sm:px-5" loading={loading} loadingLabel="Подписываем…">
          Подписаться
        </Button>
      </div>
    </form>
  );
}
