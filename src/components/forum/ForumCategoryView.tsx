"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, MessageSquare, Pin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { Button } from "@/components/ui/button";
import { SmartInput } from "@/components/ui/smart-input";
import { SmartTextarea } from "@/components/ui/smart-textarea";
import type { ForumCategory, ForumThreadSummary } from "@/lib/forum/forum-types";
import { sanitizeForumBody, sanitizeForumTitle } from "@/lib/forum/forum-body";
import { formatDateShort } from "@/lib/utils";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/cn";

export default function ForumCategoryView({
  category,
  threads,
}: {
  category: ForumCategory;
  threads: ForumThreadSummary[];
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const canRead = category.publicRead || Boolean(user);
  const canPost = Boolean(user);

  async function handleCreateThread(event: React.FormEvent) {
    event.preventDefault();
    if (!canPost) return;

    const nextTitleError = validateTitle(title);
    const nextBodyError = validateBody(body);
    setTitleError(nextTitleError);
    setBodyError(nextBodyError);
    if (nextTitleError || nextBodyError) return;

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/forum/categories/${category.slug}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      const json = (await res.json()) as {
        error?: string;
        thread?: { id: string; categorySlug: string };
      };

      if (!res.ok) throw new Error(json.error ?? "Не удалось создать тему");

      if (json.thread) {
        router.push(`/forum/${json.thread.categorySlug}/${json.thread.id}`);
        router.refresh();
      }
    } catch (createError) {
      setFormError(
        createError instanceof Error ? createError.message : "Не удалось создать тему"
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
          <h1 className="mt-4 font-heading text-xl font-bold text-charcoal">{category.title}</h1>
          <p className="mt-2 text-sm text-slate">
            Этот раздел доступен только зарегистрированным участникам.
          </p>
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
            <span className="text-charcoal">{category.title}</span>
          </nav>

          <header className="mt-4">
            <h1 className="font-display text-3xl font-bold text-charcoal">{category.title}</h1>
            {category.description ? (
              <p className="mt-2 text-slate">{category.description}</p>
            ) : null}
          </header>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {canPost ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setShowForm((value) => !value)}
                aria-expanded={showForm}
                aria-controls="forum-new-thread-form"
              >
                {showForm ? "Скрыть форму" : "Новая тема"}
              </Button>
            ) : (
              <p className="text-sm text-slate">
                <Link href="/join" className="font-medium text-sky hover:underline">
                  Войдите
                </Link>
                , чтобы создать тему.
              </p>
            )}
            {!category.publicRead ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-slate">
                <Lock className="h-3 w-3" />
                Только для участников
              </span>
            ) : null}
          </div>

          {showForm && canPost ? (
            <form
              id="forum-new-thread-form"
              onSubmit={(event) => void handleCreateThread(event)}
              className="mt-4 space-y-4 rounded-2xl border border-border-subtle bg-surface-elevated p-5"
            >
              <SmartInput
                id="forum-thread-title"
                label="Заголовок"
                value={title}
                onValueChange={(value) => {
                  setTitle(value);
                  setTitleError(null);
                  setFormError(null);
                }}
                error={titleError}
                validate={validateTitle}
                required
                maxLength={200}
                autoComplete="off"
                placeholder="Коротко опишите тему обсуждения"
              />
              <SmartTextarea
                id="forum-thread-body"
                label="Сообщение"
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
                placeholder="Расскажите подробнее, чтобы участникам было легче помочь"
              />
              {formError ? (
                <InlineFeedback
                  variant="error"
                  title="Не удалось опубликовать тему"
                  description={formError}
                />
              ) : null}
              <Button
                type="submit"
                loading={submitting}
                loadingLabel="Публикуем…"
              >
                Опубликовать тему
              </Button>
            </form>
          ) : null}

          <ul className="mt-8 divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border-subtle bg-surface-elevated">
            {threads.length === 0 ? (
              <li className="p-6 text-sm text-slate">Пока нет тем — будьте первым.</li>
            ) : (
              threads.map((thread) => (
                <li key={thread.id}>
                  <Link
                    href={`/forum/${category.slug}/${thread.id}`}
                    className="flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface-muted/60"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {thread.pinned ? (
                          <Pin className="h-3.5 w-3.5 shrink-0 text-sky" aria-label="Закреплено" />
                        ) : null}
                        <span className="font-medium text-charcoal">{thread.title}</span>
                        {thread.locked ? (
                          <span className="text-xs text-slate">· закрыта</span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-slate">
                        {thread.author.displayName} · обновлено {formatDateShort(thread.lastPostAt)}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-slate">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {thread.replyCount}
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function validateTitle(value: string): string | null {
  const result = sanitizeForumTitle(value);
  return "error" in result ? result.error : null;
}

function validateBody(value: string): string | null {
  const result = sanitizeForumBody(value);
  return "error" in result ? result.error : null;
}
