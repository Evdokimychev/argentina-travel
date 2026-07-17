"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import AdminStatusChip from "@/components/admin/AdminStatusChip";
import { Button } from "@/components/ui/button";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { EmptyState } from "@/components/ui/empty-state";
import { AdminListSkeleton } from "@/components/ui/skeleton";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import type { ModerationQueueItem } from "@/lib/admin/moderation-server";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import InlineFeedback from "@/components/feedback/InlineFeedback";

type ModerationResponse = { items?: ModerationQueueItem[]; count?: number };

const REVIEW_REPORT_REASON_LABELS: Record<string, string> = {
  spam: "Спам",
  offensive: "Оскорбления",
  fake: "Подозрение на фальсификацию",
  irrelevant: "Не относится к туру",
  other: "Другое",
};

export default function ModerationView() {
  const { data, loading, error, refresh } = useAdminApi<ModerationResponse>("/api/admin/moderation");
  const items = data?.items ?? [];
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; message: string } | null>(null);

  async function resolveItem(
    item: ModerationQueueItem,
    action: "approve" | "reject" | "hide_comment" | "restore_comment" | "dismiss_report",
    note?: string,
  ) {
    setBusyId(item.id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/moderation/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          note,
          expectedQueueStatus: item.status,
          expectedQueueVersion: item.queueVersion,
          expectedEntityStatus: item.entityStatus,
          expectedEntityVersion: item.entityVersion,
          expectedRelatedStatus: item.relatedStatus,
          expectedRelatedVersion: item.relatedVersion,
          expectedReportStatus: item.blogCommentReport?.reportStatus,
          expectedCommentStatus: item.blogCommentReport?.commentStatus,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        if (res.status === 409) await refresh();
        throw new Error(json.error ?? "Ошибка модерации");
      }
      setRejectingId(null);
      setRejectNote("");
      const successMessage =
        action === "hide_comment"
          ? "Комментарий скрыт"
          : action === "restore_comment"
            ? "Комментарий восстановлен"
            : action === "dismiss_report"
              ? "Жалоба отклонена"
              : action === "approve"
                ? "Материал одобрен"
                : "Материал возвращён автору";
      setFeedback({
        variant: "success",
        message: successMessage,
      });
      await refresh();
    } catch (resolveError) {
      setFeedback({
        variant: "error",
        message: resolveError instanceof Error ? resolveError.message : "Не удалось выполнить действие",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <CapabilityGate capability="marketplace.moderation">
      <AdminPageShell>
        <AdminPageHeader
          title="Модерация"
          subtitle="Туры, статьи, отзывы, форум и жалобы на комментарии — в одной очереди"
          actions={
            <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
              Обновить
            </Button>
          }
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {feedback ? (
          <InlineFeedback
            variant={feedback.variant}
            title={feedback.variant === "success" ? "Готово" : "Не удалось завершить модерацию"}
            description={feedback.message}
          />
        ) : null}

        <section className={`${cabinetCardClass} overflow-hidden`}>
          <h2 className="border-b border-gray-100 px-5 py-4 font-heading text-lg font-bold text-charcoal">
            Очередь ({items.length})
          </h2>
          <p className="border-b border-gray-100 px-5 py-3 text-sm text-slate">
            Недавно скрытые комментарии остаются здесь, чтобы решение можно было отменить.
          </p>
          {loading ? (
            <AdminListSkeleton rows={4} />
          ) : items.length === 0 ? (
            <EmptyState
              variant="admin"
              icon={ShieldCheck}
              title="Нет элементов на модерации"
              description="Новые туры, отзывы, материалы и жалобы появятся здесь автоматически."
              action={{
                label: "Каталог туров",
                href: "/admin/marketplace/tours",
                variant: "outline",
              }}
            />
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((item) => (
                <li key={item.id} className="space-y-3 px-5 py-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminStatusChip domain="moderation-entity" value={item.entityType} />
                    <AdminStatusChip domain="moderation" value={item.status} />
                    <span className="text-slate">{formatAdminWhen(item.createdAt)}</span>
                  </div>

                  {item.entityType !== "blog_comment_report" &&
                  (item.entityVersion === null || item.entityStatus === null) ? (
                    <InlineFeedback
                      variant="info"
                      title="Материал изменился или недоступен"
                      description="Обновите очередь перед принятием решения."
                    />
                  ) : null}

                  {item.reviewReport ? (
                    <>
                      <p className="font-medium text-charcoal">{item.reviewReport.reviewTourTitle}</p>
                      <p className="text-slate">
                        {item.reviewReport.reviewTourSlug} · оценка {item.reviewReport.reviewRating}/5
                        {item.reviewReport.reporterName
                          ? ` · жалоба от ${item.reviewReport.reporterName}`
                          : ""}
                      </p>
                      <p className="text-slate">
                        Причина:{" "}
                        {REVIEW_REPORT_REASON_LABELS[item.reviewReport.reason] ??
                          item.reviewReport.reason}
                      </p>
                      {item.reviewReport.details ? (
                        <p className="rounded-xl bg-gray-50 p-3 text-charcoal">
                          {item.reviewReport.details}
                        </p>
                      ) : null}
                      <p className="rounded-xl bg-gray-50 p-3 text-charcoal">
                        {item.reviewReport.reviewText}
                      </p>
                      <Link
                        href={`/tours/${item.reviewReport.reviewTourSlug}#reviews`}
                        className="text-sky hover:underline"
                      >
                        Отзыв на странице тура
                      </Link>
                    </>
                  ) : item.review ? (
                    <>
                      <p className="font-medium text-charcoal">{item.review.tourTitle}</p>
                      <p className="text-slate">
                        {item.review.tourSlug} · оценка {item.review.rating}/5
                        {item.review.authorName ? ` · ${item.review.authorName}` : ""}
                      </p>
                      <p className="rounded-xl bg-gray-50 p-3 text-charcoal">{item.review.text}</p>
                      <Link
                        href={`/tours/${item.review.tourSlug}`}
                        className="text-sky hover:underline"
                      >
                        Страница тура
                      </Link>
                    </>
                  ) : item.blogCommentReport ? (
                    <>
                      <p className="font-medium text-charcoal">
                        Комментарий к статье «{item.blogCommentReport.articleSlug}»
                      </p>
                      <p className="text-slate">
                        Автор: {item.blogCommentReport.commentAuthorName} · статус: {item.blogCommentReport.commentStatus}
                        {item.blogCommentReport.reporterName
                          ? ` · жалоба от ${item.blogCommentReport.reporterName}`
                          : ""}
                      </p>
                      <p className="text-slate">Причина: {item.blogCommentReport.reasonLabel}</p>
                      {item.blogCommentReport.details ? (
                        <p className="rounded-xl bg-amber-50 p-3 text-amber-900">
                          {item.blogCommentReport.details}
                        </p>
                      ) : null}
                      <p className="rounded-xl bg-gray-50 p-3 text-charcoal">
                        {item.blogCommentReport.commentBody}
                      </p>
                      <Link
                        href={`/blog/${encodeURIComponent(item.blogCommentReport.articleSlug)}#comments`}
                        className="text-sky hover:underline"
                      >
                        Открыть статью
                      </Link>
                    </>
                  ) : item.forumPost ? (
                    <>
                      <p className="font-medium text-charcoal">{item.forumPost.threadTitle}</p>
                      <p className="text-slate">
                        {item.forumPost.categoryTitle}
                        {item.forumPost.authorName ? ` · ${item.forumPost.authorName}` : ""}
                      </p>
                      {item.forumPost.reasonLabel ? (
                        <p className="text-slate">Причина: {item.forumPost.reasonLabel}</p>
                      ) : null}
                      {item.forumPost.details ? (
                        <p className="rounded-xl bg-gray-50 p-3 text-charcoal">{item.forumPost.details}</p>
                      ) : null}
                      <p className="rounded-xl bg-gray-50 p-3 text-charcoal">{item.forumPost.body}</p>
                      {item.forumPost.categorySlug ? (
                        <Link
                          href={`/forum/${item.forumPost.categorySlug}`}
                          className="text-sky hover:underline"
                        >
                          Раздел форума
                        </Link>
                      ) : null}
                    </>
                  ) : item.tour ? (
                    <>
                      <p className="font-medium text-charcoal">{item.tour.title}</p>
                      <p className="text-slate">
                        {item.tour.productType === "excursion" ? "Экскурсия" : "Тур"} · {item.tour.slug} · организатор {item.tour.ownerUserId}
                      </p>
                      <p className="text-slate">
                        Статус каталога:{" "}
                        <AdminStatusChip domain="tour-catalog" value={item.tour.status} className="ml-1" />
                        · модерация:{" "}
                        <AdminStatusChip domain="moderation" value={item.tour.moderationStatus} />
                      </p>
                      <Link href={`/${item.tour.productType === "excursion" ? "excursions" : "tours"}/${item.tour.slug}`} className="text-sky hover:underline">
                        Открыть на сайте
                      </Link>
                    </>
                  ) : item.entityType === "author_article" ? (
                    <>
                      <p className="font-medium text-charcoal">
                        {typeof item.metadata.title === "string" ? item.metadata.title : "Статья организатора"}
                      </p>
                      <p className="text-slate">Материал организатора ожидает редакционной проверки.</p>
                      <Link
                        href={`/admin/content/documents/${encodeURIComponent(item.entityId)}`}
                        className="text-sky hover:underline"
                      >
                        Открыть статью в редакторе
                      </Link>
                    </>
                  ) : (
                    <p className="text-slate">
                      {item.entityType} #{item.entityId}
                    </p>
                  )}

                  {item.reason ? <p className="text-slate">{item.reason}</p> : null}

                  {item.blogCommentReport ? (
                    <div className="flex flex-wrap gap-2">
                      {item.blogCommentReport.commentStatus !== "hidden" ? (
                        <Button
                          size="sm"
                          disabled={busyId === item.id}
                          onClick={() => void resolveItem(item, "hide_comment")}
                        >
                          Скрыть комментарий
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={busyId === item.id}
                          onClick={() => {
                            if (window.confirm("Восстановить комментарий на публичной странице?")) {
                              void resolveItem(item, "restore_comment");
                            }
                          }}
                        >
                          Восстановить комментарий
                        </Button>
                      )}
                      {item.blogCommentReport.reportStatus === "pending" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === item.id}
                          onClick={() => {
                            if (window.confirm("Отклонить жалобу без изменения комментария?")) {
                              void resolveItem(item, "dismiss_report");
                            }
                          }}
                        >
                          Отклонить жалобу
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={
                          busyId === item.id ||
                          item.entityVersion === null ||
                          item.entityStatus === null
                        }
                        onClick={() => void resolveItem(item, "approve")}
                      >
                        {item.entityType === "review_report"
                          ? "Скрыть отзыв"
                          : item.entityType === "forum_post"
                            ? "Скрыть сообщение"
                            : "Одобрить"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          busyId === item.id ||
                          item.entityVersion === null ||
                          item.entityStatus === null
                        }
                        onClick={() => {
                          setRejectingId(item.id);
                          setRejectNote("");
                        }}
                      >
                        {item.entityType === "review_report" || item.entityType === "forum_post"
                          ? "Отклонить жалобу"
                          : "Отклонить"}
                      </Button>
                    </div>
                  )}
                  {!item.blogCommentReport && rejectingId === item.id ? (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <label className="text-sm font-medium text-charcoal" htmlFor={`reject-note-${item.id}`}>
                        Что нужно исправить
                      </label>
                      <textarea
                        id={`reject-note-${item.id}`}
                        value={rejectNote}
                        onChange={(event) => setRejectNote(event.target.value)}
                        className="mt-2 min-h-24 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                        placeholder="Напишите автору конкретный и понятный комментарий"
                      />
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={
                            rejectNote.trim().length < 8 ||
                            busyId === item.id ||
                            item.entityVersion === null ||
                            item.entityStatus === null
                          }
                          onClick={() => void resolveItem(item, "reject", rejectNote.trim())}
                        >
                          Вернуть на доработку
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setRejectingId(null)}>
                          Отмена
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
