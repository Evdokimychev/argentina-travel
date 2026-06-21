"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { CmsDocument } from "@/types/cms-content";

export default function OrganizerArticlesListClient() {
  const [articles, setArticles] = useState<CmsDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function loadArticles() {
    setLoading(true);
    try {
      const res = await fetch("/api/organizer/articles");
      const data = (await res.json()) as { articles?: CmsDocument[] };
      setArticles(data.articles ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadArticles();
  }, []);

  async function createArticle() {
    setCreating(true);
    try {
      const res = await fetch("/api/organizer/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Новая статья" }),
      });
      const data = (await res.json()) as { document?: CmsDocument; error?: string };
      if (!res.ok || !data.document) throw new Error(data.error ?? "Ошибка");
      window.location.href = `/organizer/articles/${encodeURIComponent(data.document.id)}/edit`;
    } catch (error) {
      alert(error instanceof Error ? error.message : "Не удалось создать статью");
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
        {loading ? (
          <p className="text-sm text-slate">Загрузка…</p>
        ) : articles.length === 0 ? (
          <p className="text-sm text-slate">Статей пока нет. Создайте первую — черновик сохранится автоматически.</p>
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
