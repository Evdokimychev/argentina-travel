"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import ForumPostBody from "@/components/forum/ForumPostBody";
import ForumReportButton from "@/components/forum/ForumReportButton";
import { Button } from "@/components/ui/button";
import { SmartTextarea } from "@/components/ui/smart-textarea";
import type { ForumThreadDetail } from "@/lib/forum/forum-types";
import { sanitizeForumBody } from "@/lib/forum/forum-body";
import { formatDateShort } from "@/lib/utils";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/cn";

export default function ForumThreadView({ thread }: { thread: ForumThreadDetail }) {
  const { user } = useAuth();
  const router = useRouter();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const canRead = thread.categoryPublicRead || Boolean(user);
  const canReply = Boolean(user) && !thread.locked;

  async function handleReply(event: React.FormEvent) {
    event.preventDefault();
    if (!canReply) return;

    const nextBodyError = validateBody(body);
    setBodyError(nextBodyError);
    if (nextBodyError) return;

    setSubmitting(true);
    setFormError(null);

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
      setFormError(
        replyError instanceof Error ? replyError.message : "Не удалось отправить ответ"
      );
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
              <form onSubmit={(event) => void handleReply(event)} className="mt-4 space-y-4">
                <SmartTextarea
                  id="forum-reply-body"
                  label="Текст ответа"
                  value={body}
                  onValueChange={(value) => {
                    setBody(value);
                    setBodyError(null);
                    setFormError(null);
                  }}
                  error={bodyError}
                  validate={validateBody}
                  required
                  rows={5}
                  maxLength={10_000}
                  hint="Можно использовать простую разметку: **жирный**, *курсив* и списки."
                  placeholder="Напишите ответ по теме обсуждения"
                />
                {formError ? (
                  <InlineFeedback
                    variant="error"
                    title="Не удалось отправить ответ"
                    description={formError}
                  />
                ) : null}
                <Button
                  type="submit"
                  loading={submitting}
                  loadingLabel="Отправляем…"
                >
                  Отправить ответ
                </Button>
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

function validateBody(value: string): string | null {
  const result = sanitizeForumBody(value);
  return "error" in result ? result.error : null;
}
