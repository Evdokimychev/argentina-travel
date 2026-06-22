"use client";

import { useState } from "react";
import { Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { useSiteFeedback } from "@/context/SiteFeedbackContext";
import { normalizeSiteError } from "@/lib/site-feedback/normalize-error";
import { trackNewsletterSubscribe } from "@/lib/analytics/gtm-events";
import type { SiteFeedbackMessage } from "@/types/site-feedback";
import { cn } from "@/lib/cn";

type BlogNewsletterBlockProps = {
  className?: string;
  source?: string;
};

export default function BlogNewsletterBlock({
  className,
  source = "blog_article",
}: BlogNewsletterBlockProps) {
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
        body: JSON.stringify({ email: value, source }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Не удалось оформить подписку.");
      }

      setSubmitted(true);
      trackNewsletterSubscribe({ source });
      feedback.success({
        title: "Подписка оформлена",
        description: "Мы будем присылать новые материалы и советы по Аргентине.",
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
        description="Новые статьи и советы по Аргентине — на ваш email."
        className={className}
      />
    );
  }

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border border-sky/15 bg-gradient-to-br from-sky/[0.06] to-white p-5 shadow-card sm:p-6",
        className,
      )}
      aria-labelledby="blog-newsletter-title"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-sky/10 blur-2xl"
        aria-hidden
      />
      <div className="relative">
        <p
          id="blog-newsletter-title"
          className="flex items-center gap-2 font-heading text-lg font-bold text-charcoal"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky/12 text-sky ring-1 ring-sky/20">
            <Mail className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </span>
          Подписка на журнал
          <Sparkles className="ml-auto h-3.5 w-3.5 text-sky/70" aria-hidden />
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate">
          Новые статьи, маршруты и практические советы — раз в две недели, без спама.
        </p>
        {error ? (
          <InlineFeedback
            variant="error"
            title={error.title}
            description={error.description}
            steps={error.steps}
            className="mt-3"
          />
        ) : null}
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@example.com"
            className="h-10 flex-1 border-border-subtle bg-white/90"
            aria-label="Email для подписки"
            disabled={loading}
            required
          />
          <Button type="submit" className="shrink-0 sm:px-5" loading={loading} loadingLabel="Подписываем…">
            Подписаться
          </Button>
        </form>
      </div>
    </section>
  );
}
