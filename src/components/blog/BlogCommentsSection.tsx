"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Flag, Loader2, MessageSquare, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import {
  BLOG_COMMENT_REPORT_REASON_LABELS,
  type BlogComment,
  type BlogCommentReportReason,
} from "@/lib/blog-comments-types";
import { trackBlogCommentPost } from "@/lib/analytics/gtm-events";
import { cn } from "@/lib/cn";

type BlogCommentsSectionProps = {
  slug: string;
  title: string;
  className?: string;
};

function formatCommentDate(value: string): string {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function BlogCommentsSection({ slug, title, className }: BlogCommentsSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    if (!isSupabaseAuthEnabled()) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/blog/comments?slug=${encodeURIComponent(slug)}`, {
        credentials: "same-origin",
      });
      if (!response.ok) {
        setComments([]);
        return;
      }
      const payload = (await response.json()) as { comments?: BlogComment[] };
      setComments(Array.isArray(payload.comments) ? payload.comments : []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  async function submitComment(event: React.FormEvent) {
    event.preventDefault();
    if (!user) {
      setError("Войдите в аккаунт, чтобы оставить комментарий");
      return;
    }

    const trimmed = body.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/blog/comments", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, body: trimmed }),
      });

      const payload = (await response.json()) as { comment?: BlogComment; error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Не удалось отправить комментарий");
        return;
      }

      if (payload.comment) {
        setComments((prev) => [...prev, payload.comment!]);
        setBody("");
        trackBlogCommentPost({ slug, title });
      }
    } catch {
      setError("Не удалось отправить комментарий");
    } finally {
      setSubmitting(false);
    }
  }

  async function reportComment(commentId: string, reason: BlogCommentReportReason) {
    if (!user) return;

    setReportingId(commentId);
    try {
      await fetch("/api/blog/comments/report", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, reason }),
      });
    } finally {
      setReportingId(null);
    }
  }

  if (!isSupabaseAuthEnabled()) {
    return null;
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5",
        className,
      )}
      aria-label="Комментарии к статье"
    >
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-sky" aria-hidden />
        <h2 className="text-sm font-semibold text-charcoal">Комментарии</h2>
      </div>
      <p className="mt-1 text-xs text-slate">
        Обсуждение по теме статьи. Для общих вопросов —{" "}
        <Link href="/forum" className="font-medium text-sky hover:underline">
          форум
        </Link>
        .
      </p>

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-xs text-slate">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Загрузка…
        </p>
      ) : comments.length === 0 ? (
        <p className="mt-4 text-xs text-slate">Пока нет комментариев — будьте первым.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="rounded-xl border border-gray-100 bg-surface-muted/30 px-3 py-2.5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xs font-semibold text-charcoal">{comment.author.displayName}</p>
                <time className="text-2xs text-slate" dateTime={comment.createdAt}>
                  {formatCommentDate(comment.createdAt)}
                </time>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-charcoal">{comment.body}</p>
              {comment.canReport && user ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(Object.keys(BLOG_COMMENT_REPORT_REASON_LABELS) as BlogCommentReportReason[]).map(
                    (reason) => (
                      <button
                        key={reason}
                        type="button"
                        disabled={reportingId === comment.id}
                        onClick={() => reportComment(comment.id, reason)}
                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5 text-2xs text-slate hover:border-amber-200 hover:text-amber-900"
                      >
                        <Flag className="h-3 w-3" aria-hidden />
                        {BLOG_COMMENT_REPORT_REASON_LABELS[reason]}
                      </button>
                    ),
                  )}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submitComment} className="mt-4 space-y-2">
        <label htmlFor={`blog-comment-${slug}`} className="sr-only">
          Ваш комментарий
        </label>
        <textarea
          id={`blog-comment-${slug}`}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={3}
          maxLength={4000}
          placeholder={user ? "Поделитесь опытом или задайте вопрос…" : "Войдите, чтобы комментировать"}
          disabled={!user || submitting}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-charcoal placeholder:text-slate/60 focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/20"
        />
        {error ? <p className="text-xs text-amber-800">{error}</p> : null}
        <button
          type="submit"
          disabled={!user || submitting || !body.trim()}
          className="inline-flex items-center gap-1.5 rounded-full bg-sky px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Send className="h-3.5 w-3.5" aria-hidden />
          )}
          Отправить
        </button>
      </form>
    </section>
  );
}
