"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ForumPostBody from "@/components/forum/ForumPostBody";
import ForumReportButton from "@/components/forum/ForumReportButton";
import type { ForumThreadDetail } from "@/lib/forum/forum-types";
import { formatDateShort } from "@/lib/utils";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/cn";

export default function ForumThreadView({ thread }: { thread: ForumThreadDetail }) {
  const { user } = useAuth();
  const router = useRouter();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRead = thread.categoryPublicRead || Boolean(user);
  const canReply = Boolean(user) && !thread.locked;

  async function handleReply(event: React.FormEvent) {
    event.preventDefault();
    if (!canReply) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/forum/threads/${thread.id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Не удалось отправить ответ");

      setBody("");
      router.refresh();
    } catch (replyError) {
      setError(replyError instanceof Error ? replyError.message : "Ошибка");
    } finally {
      setSubmitting(false);
    }
  }

  if (!canRead) {
    return (
      <div className={cn(siteContainerClass, "py-12")}>
        <div className="mx-auto max-w-xl rounded-2xl border border-border-subtle bg-surface-elevated p-8 text-center">
          <Lock className="mx-auto h-8 w-8 text-slate" />
          <h1 className="mt-4 font-heading text-xl font-bold text-charcoal">Тема для участников</h1>
          <p className="mt-2 text-sm text-slate">Войдите в аккаунт, чтобы читать и отвечать.</p>
          <Link href="/join" className="mt-4 inline-block text-sm font-medium text-sky hover:underline">
            Войти или зарегистрироваться
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-muted pb-16">
      <div className={cn(siteContainerClass, "py-8 md:py-12")}>
        <div className="mx-auto max-w-3xl">
          <nav className="text-sm text-slate">
            <Link href="/forum" className="hover:text-sky">
              Форум
            </Link>
            <span className="mx-2">/</span>
            <Link href={`/forum/${thread.categorySlug}`} className="hover:text-sky">
              {thread.categoryTitle}
            </Link>
          </nav>

          <header className="mt-4 rounded-2xl border border-border-subtle bg-surface-elevated p-5">
            <h1 className="font-display text-2xl font-bold text-charcoal md:text-3xl">{thread.title}</h1>
            <p className="mt-2 text-sm text-slate">
              {thread.author.displayName} · {formatDateShort(thread.createdAt)}
              {thread.locked ? " · тема закрыта" : null}
            </p>
          </header>

          <ol className="mt-6 space-y-4">
            {thread.posts.map((post, index) => (
              <li
                key={post.id}
                className="rounded-2xl border border-border-subtle bg-surface-elevated p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-charcoal">{post.author.displayName}</p>
                    <p className="text-xs text-slate">
                      {formatDateShort(post.createdAt)}
                      {post.editedAt ? " · изменено" : null}
                      {index === 0 ? " · автор темы" : null}
                    </p>
                  </div>
                  <ForumReportButton postId={post.id} />
                </div>
                <ForumPostBody body={post.body} className="mt-3" />
              </li>
            ))}
          </ol>

          <section className="mt-8 rounded-2xl border border-border-subtle bg-surface-elevated p-5">
            <h2 className="font-heading text-lg font-bold text-charcoal">Ответить</h2>
            {canReply ? (
              <form onSubmit={(event) => void handleReply(event)} className="mt-4 space-y-3">
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  required
                  rows={5}
                  className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm"
                  placeholder="Ваш ответ. Простая разметка: **жирный**, *курсив*."
                />
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-sky px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {submitting ? "Отправка…" : "Отправить ответ"}
                </button>
              </form>
            ) : thread.locked ? (
              <p className="mt-3 text-sm text-slate">Тема закрыта для новых сообщений.</p>
            ) : (
              <p className="mt-3 text-sm text-slate">
                <Link href="/join" className="font-medium text-sky hover:underline">
                  Войдите
                </Link>
                , чтобы участвовать в обсуждении.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
