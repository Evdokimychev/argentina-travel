"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { CmsDocument } from "@/types/cms-content";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CMS_AUTHOR_ARTICLE_TYPES,
  type CmsAuthorArticleType,
} from "@/types/cms-content";
import {
  AUTHOR_ARTICLE_STATUS_LABELS,
  AUTHOR_ARTICLE_TYPE_LABELS,
  type AuthorArticleWorkflow,
} from "@/lib/cms/author-article-workflow";
import { trackProductEvent } from "@/lib/analytics/product-events";

export default function OrganizerArticlesListClient() {
  const router = useRouter();
  const [articles, setArticles] = useState<CmsDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workflows, setWorkflows] = useState<Record<string, AuthorArticleWorkflow>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newExcerpt, setNewExcerpt] = useState("");
  const [newType, setNewType] = useState<CmsAuthorArticleType>("story");

  async function loadArticles() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/organizer/articles");
      const data = (await res.json()) as {
        articles?: CmsDocument[];
        workflows?: Record<string, AuthorArticleWorkflow>;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Не удалось загрузить статьи");
      setArticles(data.articles ?? []);
      setWorkflows(data.workflows ?? {});
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить статьи");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadArticles();
  }, []);

  async function createArticle() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/organizer/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, excerpt: newExcerpt, articleType: newType }),
      });
      const data = (await res.json()) as { document?: CmsDocument; error?: string };
      if (!res.ok || !data.document) throw new Error(data.error ?? "Ошибка");
      trackProductEvent("article_draft_created", {
        entityType: "author_article",
        entityId: data.document.id,
        source: "organizer_articles",
      });
      router.push(`/organizer/articles/${encodeURIComponent(data.document.id)}/edit`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Не удалось создать статью");
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-charcoal">Мои статьи</h1>
          <p className="mt-1 text-sm text-slate">
            Экспертные материалы и обзоры туров — визуальный конструктор блоков
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)} loading={creating}>
          <Plus className="mr-1.5 h-4 w-4" />
          Новая статья
        </Button>
      </div>

      <section className={`${cabinetCardClass} p-5`}>
        {error ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/20 bg-error-muted px-4 py-3 text-sm text-error" role="alert">
            <span>{error}</span>
            <Button type="button" size="sm" variant="outline" onClick={() => void loadArticles()}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              Повторить
            </Button>
          </div>
        ) : null}
        {loading ? (
          <div className="space-y-3" aria-label="Загружаем статьи">
            {[0, 1, 2].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-surface-muted" />)}
          </div>
        ) : articles.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Статей пока нет"
            description="Создайте первый материал. Он появится как черновик и будет сохраняться автоматически."
            action={{ label: "Создать статью", onClick: () => setCreateOpen(true) }}
            variant="cabinet"
          />
        ) : (
          <ul className="divide-y divide-gray-100">
            {articles.map((article) => (
              <li key={article.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium text-charcoal">{article.title}</p>
                  <p className="text-xs text-slate">
                    {AUTHOR_ARTICLE_STATUS_LABELS[workflows[article.id]?.status ?? "draft"]}
                    {article.body.kind === "author_article" && article.body.articleType
                      ? ` · ${AUTHOR_ARTICLE_TYPE_LABELS[article.body.articleType]}`
                      : ""}
                    {` · обновлено ${new Date(article.updatedAt).toLocaleString("ru-RU")}`}
                  </p>
                  {workflows[article.id]?.status === "changes_requested" && workflows[article.id]?.note ? (
                    <p className="mt-1 text-xs text-error">{workflows[article.id].note}</p>
                  ) : null}
                </div>
                <Link
                  href={`/organizer/articles/${encodeURIComponent(article.id)}/edit`}
                  className="text-sm font-medium text-sky hover:underline"
                >
                  Редактировать
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="ym-hide-content" data-private-content="true">
          <DialogHeader>
            <DialogTitle>Новая статья</DialogTitle>
            <DialogDescription>Создайте содержательный черновик. Публикация произойдёт только после проверки редактором.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <label className="block text-sm font-medium text-charcoal">
              Тип материала
              <select
                value={newType}
                onChange={(event) => setNewType(event.target.value as CmsAuthorArticleType)}
                className="mt-1 min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm"
              >
                {CMS_AUTHOR_ARTICLE_TYPES.map((type) => (
                  <option key={type} value={type}>{AUTHOR_ARTICLE_TYPE_LABELS[type]}</option>
                ))}
              </select>
            </label>
            <Input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Заголовок" />
            <Textarea value={newExcerpt} onChange={(event) => setNewExcerpt(event.target.value)} placeholder="Кратко: какую пользу получит читатель" className="min-h-24" />
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Отмена</Button>
            <Button
              type="button"
              onClick={() => void createArticle()}
              loading={creating}
              disabled={newTitle.trim().length < 8}
            >
              Создать черновик
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
