"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BlogSectionPageBuilder from "@/components/admin/page-builder/BlogSectionPageBuilder";
import CmsSeoPanel from "@/components/admin/CmsSeoPanel";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import { stageCmsDocumentPreviewDraft } from "@/lib/cms/cms-preview";
import { usePageBuilderAutosave } from "@/hooks/usePageBuilderAutosave";
import type { BlogPostSection } from "@/types";
import type { CmsDocument, CmsDocumentSeo } from "@/types/cms-content";

type Props = {
  documentId: string;
};

export default function OrganizerArticleEditorView({ documentId }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doc, setDoc] = useState<CmsDocument | null>(null);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [sections, setSections] = useState<BlogPostSection[]>([]);
  const [seo, setSeo] = useState<CmsDocumentSeo>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/organizer/articles/${encodeURIComponent(documentId)}`);
        const data = (await res.json()) as { document?: CmsDocument; error?: string };
        if (!res.ok || !data.document) throw new Error(data.error ?? "Не удалось загрузить статью");

        const document = data.document;
        if (document.body.kind !== "author_article") {
          throw new Error("Неверный тип документа");
        }

        setDoc(document);
        setTitle(document.title);
        setExcerpt(document.body.excerpt ?? "");
        setSections(
          (document.body.sections ?? []).map((section) => ({
            title: section.title,
            body: section.body,
            blockType: section.blockType,
            blocks: section.blocks,
          }))
        );
        setSeo(document.seo ?? {});
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    })();
  }, [documentId]);

  const savePayload = useMemo(
    () => ({ title, excerpt, sections, seo }),
    [title, excerpt, sections, seo]
  );

  const persist = useCallback(async () => {
    if (!doc) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/organizer/articles/${encodeURIComponent(documentId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          excerpt,
          sections,
          seo,
        }),
      });
      const data = (await res.json()) as { document?: CmsDocument; error?: string };
      if (!res.ok || !data.document) throw new Error(data.error ?? "Не удалось сохранить");
      setDoc(data.document);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }, [doc, documentId, title, excerpt, sections, seo]);

  usePageBuilderAutosave(savePayload, persist, { enabled: !loading && Boolean(doc) });

  function openLivePreview() {
    if (!doc || doc.body.kind !== "author_article") return;
    stageCmsDocumentPreviewDraft(documentId, {
      title: title.trim(),
      body: {
        kind: "author_article",
        excerpt: excerpt.trim(),
        authorName: doc.body.authorName,
        sections,
      },
      seo,
    });
    window.open(
      `/organizer/articles/${encodeURIComponent(documentId)}/preview?live=1`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  if (loading) {
    return <p className="text-sm text-slate">Загрузка редактора…</p>;
  }

  if (error && !doc) {
    return (
      <div className={`${cabinetCardClass} p-5 text-sm text-red-700`}>
        {error}
        <div className="mt-3">
          <Link href="/organizer/articles" className="text-sky hover:underline">
            ← К списку статей
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/organizer/articles" className="text-sm text-sky hover:underline">
            ← Мои статьи
          </Link>
          <h1 className="mt-1 font-heading text-2xl font-bold text-charcoal">Редактор статьи</h1>
          <p className="mt-1 text-sm text-slate">
            Визуальный конструктор без кода · автосохранение черновика
            {saving ? " · сохраняем…" : ""}
          </p>
        </div>
        <Button type="button" onClick={() => void persist()} loading={saving} loadingLabel="Сохраняем…">
          Сохранить
        </Button>
        <Button type="button" variant="outline" onClick={openLivePreview}>
          Предпросмотр
        </Button>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <section className={`${cabinetCardClass} space-y-4 p-5`}>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Заголовок статьи"
          className="font-heading text-lg font-semibold"
        />
        <textarea
          className="min-h-[72px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Краткое описание (лид)"
        />
      </section>

      <section className={`${cabinetCardClass} p-5`}>
        <BlogSectionPageBuilder sections={sections} onChange={setSections} />
      </section>

      <section className={`${cabinetCardClass} p-5`}>
        <CmsSeoPanel seo={seo} onChange={setSeo} pageTitle={title} excerpt={excerpt} />
      </section>
    </div>
  );
}
