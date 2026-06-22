"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import PageBreadcrumbs from "@/components/navigation/PageBreadcrumbs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { siteContainerClass } from "@/lib/site-container";
import {
  EXPERT_CATEGORY_LABELS,
  type LocalExpertView,
} from "@/types/local-experts";
import { cn } from "@/lib/cn";

type ExpertInquiryFormProps = {
  expert: LocalExpertView;
};

function ExpertInquiryForm({ expert }: ExpertInquiryFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user) {
      router.push(`/?auth=sign-in&next=/experts/${expert.slug}`);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/experts/${expert.slug}/inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const json = (await res.json()) as {
        error?: string;
        messageHref?: string | null;
      };

      if (!res.ok) {
        throw new Error(json.error ?? "Не удалось отправить");
      }

      setMessage("");
      setSuccess("Сообщение отправлено.");
      if (json.messageHref) {
        setSuccess("Сообщение отправлено. Открываем переписку…");
        window.setTimeout(() => router.push(json.messageHref!), 800);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="font-heading text-xl font-bold text-charcoal">Написать эксперту</h2>
      <p className="mt-2 text-sm text-slate">
        Опишите задачу или вопрос. Ответ придёт в раздел «Сообщения» личного кабинета.
      </p>

      {!user ? (
        <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm text-slate">
          <Link href={`/?auth=sign-in&next=/experts/${expert.slug}`} className="font-medium text-sky hover:underline">
            Войдите
          </Link>
          , чтобы отправить сообщение.
        </div>
      ) : (
        <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-3">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={5}
            required
            maxLength={4000}
            placeholder="Например: нужен гид на 2 дня в Игуасу в июле, группа 4 человека…"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
          <Button type="submit" disabled={busy || !message.trim()}>
            {busy ? "Отправка…" : "Отправить"}
          </Button>
        </form>
      )}
    </section>
  );
}

type ExpertDetailViewProps = {
  expert: LocalExpertView;
};

export default function ExpertDetailView({ expert }: ExpertDetailViewProps) {
  return (
    <div className="pb-16">
      <div className={cn(siteContainerClass, "py-8")}>
        <PageBreadcrumbs
          items={[
            { label: "Главная", href: "/" },
            { label: "Локальные эксперты", href: "/experts" },
            { label: expert.name },
          ]}
        />

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <article>
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-sky/10 text-xl font-bold text-sky">
                {expert.name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h1 className="font-heading text-3xl font-bold text-charcoal">{expert.name}</h1>
                <p className="mt-1 flex items-center gap-1 text-slate">
                  <MapPin className="h-4 w-4" aria-hidden />
                  {expert.city}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {expert.categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full bg-gray-50 px-3 py-1 text-sm font-medium text-charcoal"
                >
                  {EXPERT_CATEGORY_LABELS[category]}
                </span>
              ))}
            </div>

            <p className="mt-2 text-sm text-slate">
              Языки: {expert.languages.map((lang) => lang.toUpperCase()).join(", ")}
            </p>

            <div className="prose prose-slate mt-8 max-w-none">
              <p className="whitespace-pre-wrap text-base leading-relaxed text-charcoal">
                {expert.bio}
              </p>
            </div>
          </article>

          <aside className="space-y-4">
            <ExpertInquiryForm expert={expert} />
          </aside>
        </div>
      </div>
    </div>
  );
}
