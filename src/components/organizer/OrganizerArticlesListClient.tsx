"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { CmsDocument } from "@/types/cms-content";
import { EmptyState } from "@/components/ui/empty-state";

export default function OrganizerArticlesListClient() {
  const router = useRouter();
  const [articles, setArticles] = useState<CmsDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadArticles() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/organizer/articles");
      const data = (await res.json()) as { articles?: CmsDocument[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Не удалось загрузить статьи");
      setArticles(data.articles ?? []);
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
        body: JSON.stringify({ title: "Новая статья" }),
      });
      const data = (await res.json()) as { document?: CmsDocument; error?: string };
      if (!res.ok || !data.document) throw new Error(data.error ?? "Ошибка");
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
        <Button type="button" onClick={() => void createArticle()} loading={creating}>
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
            action={{ label: "Создать статью", onClick: () => void createArticle() }}
            variant="cabinet"
          />
        ) : (
          <ul className="divide-y divide-gray-100">
            {articles.map((article) => (
              <li key={article.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium text-charcoal">{article.title}</p>
                  <p className="text-xs text-slate">
                    {article.status} · обновлено {new Date(article.updatedAt).toLocaleString("ru-RU")}
                  </p>
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
    </div>
  );
}
