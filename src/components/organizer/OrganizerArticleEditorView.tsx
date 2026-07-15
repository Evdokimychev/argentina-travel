"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import BlogSectionPageBuilder from "@/components/admin/page-builder/BlogSectionPageBuilder";
import CmsSeoPanel from "@/components/admin/CmsSeoPanel";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import { stageCmsDocumentPreviewDraft } from "@/lib/cms/cms-preview";
import { usePageBuilderAutosave } from "@/hooks/usePageBuilderAutosave";
import type { BlogPostSection } from "@/types";
import {
  CMS_AUTHOR_ARTICLE_TYPES,
  type CmsAuthorArticleRelations,
  type CmsAuthorArticleType,
  type CmsDocument,
  type CmsDocumentSeo,
} from "@/types/cms-content";
import {
  AUTHOR_ARTICLE_STATUS_LABELS,
  AUTHOR_ARTICLE_TYPE_LABELS,
  type AuthorArticleWorkflow,
} from "@/lib/cms/author-article-workflow";
import { trackProductEvent } from "@/lib/analytics/product-events";

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
  const [articleType, setArticleType] = useState<CmsAuthorArticleType>("story");
  const [relations, setRelations] = useState<CmsAuthorArticleRelations>({});
  const [workflow, setWorkflow] = useState<AuthorArticleWorkflow | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/organizer/articles/${encodeURIComponent(documentId)}`);
        const data = (await res.json()) as {
          document?: CmsDocument;
          workflow?: AuthorArticleWorkflow;
          error?: string;
        };
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
        setArticleType(document.body.articleType ?? "story");
        setRelations(document.body.relations ?? {});
        setWorkflow(data.workflow ?? null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    })();
  }, [documentId]);

  const savePayload = useMemo(
    () => ({ title, excerpt, sections, seo, articleType, relations }),
    [title, excerpt, sections, seo, articleType, relations]
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
          articleType,
          relations,
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
  }, [doc, documentId, title, excerpt, sections, seo, articleType, relations]);

  usePageBuilderAutosave(savePayload, persist, { enabled: !loading && Boolean(doc) });

  function openLivePreview() {
    if (!doc || doc.body.kind !== "author_article") return;
    stageCmsDocumentPreviewDraft(documentId, {
      title: title.trim(),
      body: {
        kind: "author_article",
        excerpt: excerpt.trim(),
        authorName: doc.body.authorName,
        articleType,
        relations,
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

  async function submitForReview() {
    if (!doc) return;
    setSubmitting(true);
    setError(null);
    try {
      const saveResponse = await fetch(`/api/organizer/articles/${encodeURIComponent(documentId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, excerpt, sections, seo, articleType, relations }),
      });
      const saveData = (await saveResponse.json()) as { document?: CmsDocument; error?: string };
      if (!saveResponse.ok || !saveData.document) {
        throw new Error(saveData.error ?? "Не удалось сохранить статью");
      }
      setDoc(saveData.document);

      const response = await fetch(
        `/api/organizer/articles/${encodeURIComponent(documentId)}/submit`,
        { method: "POST" },
      );
      const data = (await response.json()) as {
        workflow?: AuthorArticleWorkflow;
        error?: string;
        validationErrors?: string[];
      };
      if (!response.ok || !data.workflow) {
        const details = data.validationErrors?.join(". ");
        throw new Error(details || data.error || "Не удалось отправить статью");
      }
      setWorkflow(data.workflow);
      trackProductEvent("article_submitted", {
        entityType: "author_article",
        entityId: documentId,
        source: "organizer_editor",
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось отправить статью");
    } finally {
      setSubmitting(false);
    }
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
          {workflow ? (
            <p className="mt-2 inline-flex rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-charcoal">
              {AUTHOR_ARTICLE_STATUS_LABELS[workflow.status]}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void persist()} loading={saving} loadingLabel="Сохраняем…">
            Сохранить
          </Button>
          <Button type="button" variant="outline" onClick={openLivePreview}>
            Предпросмотр
          </Button>
          {workflow?.status !== "in_review" && workflow?.status !== "published" && workflow?.status !== "scheduled" ? (
            <Button type="button" variant="outline" onClick={() => void submitForReview()} loading={submitting} loadingLabel="Отправляем…">
              Отправить на проверку
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <InlineFeedback variant="error" title="Не удалось выполнить действие" description={error} />
      ) : null}
      {workflow?.status === "in_review" ? (
        <InlineFeedback variant="info" title="Статья на проверке" description="Редактор увидит текущую сохранённую версию. После решения статус обновится в списке статей." />
      ) : null}
      {workflow?.status === "changes_requested" ? (
        <InlineFeedback variant="info" title="Редактор просит внести изменения" description={workflow.note || "Откройте комментарии редактора и уточните материал."} />
      ) : null}

      <section className={`${cabinetCardClass} space-y-4 p-5`}>
        <label className="block text-sm font-medium text-charcoal">
          Тип материала
          <select
            value={articleType}
            onChange={(event) => setArticleType(event.target.value as CmsAuthorArticleType)}
            className="mt-1 min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm"
          >
            {CMS_AUTHOR_ARTICLE_TYPES.map((type) => (
              <option key={type} value={type}>{AUTHOR_ARTICLE_TYPE_LABELS[type]}</option>
            ))}
          </select>
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Заголовок статьи"
          className="font-heading text-lg font-semibold"
        />
        <Textarea
          className="min-h-[88px]"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Краткое описание (лид)"
        />
      </section>

      <section className={`${cabinetCardClass} p-5`}>
        <h2 className="font-heading text-lg font-bold text-charcoal">Связи с сайтом</h2>
        <p className="mt-1 text-sm text-slate">Укажите адресную часть или идентификатор. Редактор проверит связи перед публикацией.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input value={relations.place ?? ""} onChange={(event) => setRelations({ ...relations, place: event.target.value })} placeholder="Место, например el-calafate" />
          <Input value={relations.destination ?? ""} onChange={(event) => setRelations({ ...relations, destination: event.target.value })} placeholder="Направление, например patagonia" />
          <Input value={relations.tour ?? ""} onChange={(event) => setRelations({ ...relations, tour: event.target.value })} placeholder="Тур" />
          <Input value={relations.mapObject ?? ""} onChange={(event) => setRelations({ ...relations, mapObject: event.target.value })} placeholder="Объект карты" />
        </div>
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
