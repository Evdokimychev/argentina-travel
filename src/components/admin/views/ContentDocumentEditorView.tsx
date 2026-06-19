"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminContext } from "@/context/AdminContext";
import { formatAdminWhen } from "@/lib/admin/format";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import { buildCmsRevisionDiff } from "@/lib/cms/revision-diff";
import type { LegalSection } from "@/data/legal-content";
import type { BlogPostSection } from "@/types";
import type {
  CmsDestinationBody,
  CmsDocument,
  CmsDocumentBody,
  CmsGuideBody,
  CmsLegalBody,
  CmsPlaceBody,
  CmsRevision,
} from "@/types/cms-content";

type Props = {
  documentId: string;
};

type DocumentResponse = { document?: CmsDocument; error?: string };
type CmsRevisionListItem = CmsRevision & { authorName?: string | null };
type RevisionsResponse = { revisions?: CmsRevisionListItem[]; error?: string };
type RevisionResponse = { revision?: CmsRevision; error?: string };
type RestoreResponse = { document?: CmsDocument; error?: string };

function linesToList(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function listToLines(items?: string[]): string {
  return items?.join("\n") ?? "";
}

export default function ContentDocumentEditorView({ documentId }: Props) {
  const router = useRouter();
  const { hasCapability } = useAdminContext();
  const canPublish = hasCapability("content.publish");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doc, setDoc] = useState<CmsDocument | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [guideCategory, setGuideCategory] = useState("");
  const [sections, setSections] = useState<LegalSection[]>([]);
  const [excerpt, setExcerpt] = useState("");
  const [blogSections, setBlogSections] = useState<BlogPostSection[]>([]);
  const [blogFeatured, setBlogFeatured] = useState(false);
  const [destinationIntro, setDestinationIntro] = useState("");
  const [destinationRegionGroup, setDestinationRegionGroup] = useState("");
  const [destinationBestSeason, setDestinationBestSeason] = useState("");
  const [destinationIdealDuration, setDestinationIdealDuration] = useState("");
  const [destinationHowToGetThere, setDestinationHowToGetThere] = useState("");
  const [destinationHighlights, setDestinationHighlights] = useState<string[]>([]);
  const [destinationTravelTips, setDestinationTravelTips] = useState<string[]>([]);
  const [placeShortDescription, setPlaceShortDescription] = useState("");
  const [placeFullDescription, setPlaceFullDescription] = useState("");
  const [placeHowToGetThere, setPlaceHowToGetThere] = useState("");
  const [placeInterestingFacts, setPlaceInterestingFacts] = useState<string[]>([]);
  const [status, setStatus] = useState<CmsDocument["status"]>("draft");
  const [revisions, setRevisions] = useState<CmsRevisionListItem[]>([]);
  const [selectedRevision, setSelectedRevision] = useState<CmsRevision | null>(null);
  const [selectedRevisionMeta, setSelectedRevisionMeta] = useState<CmsRevisionListItem | null>(null);
  const [revisionLoadingId, setRevisionLoadingId] = useState<string | null>(null);
  const [restoringRevisionId, setRestoringRevisionId] = useState<string | null>(null);

  const encodedId = encodeURIComponent(documentId);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [docRes, revRes] = await Promise.all([
        fetch(`/api/admin/content/documents/${encodedId}`),
        fetch(`/api/admin/content/documents/${encodedId}/revisions`),
      ]);
      const docJson = (await docRes.json()) as DocumentResponse;
      const revJson = (await revRes.json()) as RevisionsResponse;

      if (!docRes.ok || !docJson.document) {
        throw new Error(docJson.error ?? "Документ не найден");
      }

      const document = docJson.document;
      setDoc(document);
      setTitle(document.title);
      setStatus(document.status);

      if (document.body.kind === "legal") {
        setDescription(document.body.description);
        setSections(document.body.sections);
      } else if (document.body.kind === "guide") {
        setDescription(document.body.description);
        setGuideCategory(document.body.category ?? "");
        setSections(document.body.sections);
      } else if (document.body.kind === "blog") {
        setExcerpt(document.body.excerpt ?? "");
        setBlogFeatured(document.body.featured ?? false);
        setBlogSections(document.body.sections ?? [{ title: "Основной текст", body: document.body.content ?? "" }]);
      } else if (document.body.kind === "destination") {
        setDescription(document.body.description);
        setDestinationIntro(document.body.intro ?? "");
        setDestinationRegionGroup(document.body.regionGroup ?? "");
        setDestinationBestSeason(document.body.bestSeason ?? "");
        setDestinationIdealDuration(document.body.idealDuration ?? "");
        setDestinationHowToGetThere(document.body.howToGetThere ?? "");
        setDestinationHighlights(document.body.highlights ?? []);
        setDestinationTravelTips(document.body.travelTips ?? []);
      } else if (document.body.kind === "place") {
        setPlaceShortDescription(document.body.shortDescription ?? "");
        setPlaceFullDescription(document.body.fullDescription ?? "");
        setPlaceHowToGetThere(document.body.howToGetThere ?? "");
        setPlaceInterestingFacts(document.body.interestingFacts ?? []);
      }

      setRevisions(revJson.revisions ?? []);
      setSelectedRevision(null);
      setSelectedRevisionMeta(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [encodedId]);

  useEffect(() => {
    void load();
  }, [load]);

  function buildBody(): CmsDocumentBody {
    if (doc?.body.kind === "blog") {
      return {
        kind: "blog",
        excerpt: excerpt.trim(),
        sections: blogSections,
        featured: blogFeatured,
      };
    }
    if (doc?.body.kind === "guide") {
      return {
        kind: "guide",
        description: description.trim(),
        category: guideCategory.trim() || undefined,
        sections,
        relatedLinks: doc.body.relatedLinks,
        relatedTourQuery: doc.body.relatedTourQuery,
      } satisfies CmsGuideBody;
    }
    if (doc?.body.kind === "destination") {
      return {
        kind: "destination",
        description: description.trim(),
        intro: destinationIntro.trim() || undefined,
        regionGroup: destinationRegionGroup.trim() || undefined,
        bestSeason: destinationBestSeason.trim() || undefined,
        idealDuration: destinationIdealDuration.trim() || undefined,
        howToGetThere: destinationHowToGetThere.trim() || undefined,
        highlights: destinationHighlights,
        travelTips: destinationTravelTips,
      } satisfies CmsDestinationBody;
    }
    if (doc?.body.kind === "place") {
      return {
        kind: "place",
        shortDescription: placeShortDescription.trim(),
        fullDescription: placeFullDescription.trim(),
        howToGetThere: placeHowToGetThere.trim() || undefined,
        interestingFacts: placeInterestingFacts,
        faq: doc.body.faq,
      } satisfies CmsPlaceBody;
    }
    return {
      kind: "legal",
      description: description.trim(),
      sections,
    } satisfies CmsLegalBody;
  }

  const revisionDiff = useMemo(() => {
    if (!selectedRevision || !doc) return null;
    return buildCmsRevisionDiff(
      {
        title: title.trim(),
        body: buildBody(),
      },
      {
        title: selectedRevision.title,
        body: selectedRevision.body,
      }
    );
  }, [
    blogSections,
    description,
    destinationBestSeason,
    destinationHighlights,
    destinationHowToGetThere,
    destinationIdealDuration,
    destinationIntro,
    destinationRegionGroup,
    destinationTravelTips,
    doc,
    excerpt,
    guideCategory,
    placeFullDescription,
    placeHowToGetThere,
    placeInterestingFacts,
    placeShortDescription,
    sections,
    selectedRevision,
    title,
  ]);

  async function openRevision(revision: CmsRevisionListItem) {
    if (selectedRevisionMeta?.id === revision.id) {
      setSelectedRevision(null);
      setSelectedRevisionMeta(null);
      return;
    }

    setSelectedRevisionMeta(revision);
    setRevisionLoadingId(revision.id);
    try {
      const revisionId = encodeURIComponent(revision.id);
      const res = await fetch(`/api/admin/content/documents/${encodedId}/revisions/${revisionId}`);
      const json = (await res.json()) as RevisionResponse;
      if (!res.ok || !json.revision) {
        throw new Error(json.error ?? "Не удалось загрузить ревизию");
      }
      setSelectedRevision(json.revision);
    } catch (revisionError) {
      setSelectedRevision(null);
      setSelectedRevisionMeta(null);
      alert(revisionError instanceof Error ? revisionError.message : "Ошибка");
    } finally {
      setRevisionLoadingId(null);
    }
  }

  async function restoreRevision(revision: CmsRevisionListItem, publish = false) {
    const message = publish
      ? "Восстановить эту ревизию и сразу опубликовать?"
      : "Восстановить эту ревизию как черновик?";
    if (!window.confirm(message)) return;

    setSaving(true);
    setRestoringRevisionId(revision.id);
    try {
      const revisionId = encodeURIComponent(revision.id);
      const res = await fetch(
        `/api/admin/content/documents/${encodedId}/revisions/${revisionId}/restore`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publish }),
        }
      );
      const json = (await res.json()) as RestoreResponse;
      if (!res.ok) throw new Error(json.error ?? "Не удалось восстановить ревизию");
      await load();
    } catch (restoreError) {
      alert(restoreError instanceof Error ? restoreError.message : "Ошибка");
    } finally {
      setRestoringRevisionId(null);
      setSaving(false);
    }
  }

  async function saveDraft() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/content/documents/${encodedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: buildBody(), status: "draft" }),
      });
      const json = (await res.json()) as DocumentResponse;
      if (!res.ok) throw new Error(json.error ?? "Ошибка сохранения");
      await load();
    } catch (saveError) {
      alert(saveError instanceof Error ? saveError.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!canPublish) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/content/documents/${encodedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: buildBody() }),
      });
      const res = await fetch(`/api/admin/content/documents/${encodedId}/publish`, {
        method: "POST",
      });
      const json = (await res.json()) as DocumentResponse;
      if (!res.ok) throw new Error(json.error ?? "Ошибка публикации");
      await load();
    } catch (publishError) {
      alert(publishError instanceof Error ? publishError.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  async function removeOverride() {
    if (!canPublish) return;
    if (!window.confirm("Удалить CMS-версию? На сайте снова будет файл из репозитория.")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/content/documents/${encodedId}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Ошибка удаления");
      router.push("/admin/content/documents");
    } catch (deleteError) {
      alert(deleteError instanceof Error ? deleteError.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  function updateSection(index: number, patch: Partial<LegalSection>) {
    setSections((prev) => prev.map((section, i) => (i === index ? { ...section, ...patch } : section)));
  }

  function addSection() {
    setSections((prev) => [...prev, { heading: "", paragraphs: [""] }]);
  }

  function removeSection(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }

  function removeBlogSection(index: number) {
    setBlogSections((prev) => prev.filter((_, i) => i !== index));
  }

  function updateBlogSection(index: number, patch: Partial<BlogPostSection>) {
    setBlogSections((prev) => prev.map((section, i) => (i === index ? { ...section, ...patch } : section)));
  }

  function addBlogSection() {
    setBlogSections((prev) => [...prev, { title: "", body: "" }]);
  }

  if (loading) {
    return (
      <CapabilityGate capability="content.edit">
        <AdminPageShell>
          <p className="text-sm text-slate">Загрузка редактора…</p>
        </AdminPageShell>
      </CapabilityGate>
    );
  }

  if (error || !doc) {
    return (
      <CapabilityGate capability="content.edit">
        <AdminPageShell>
          <p className="text-sm text-red-600">{error ?? "Документ не найден"}</p>
          <Link href="/admin/content/documents" className="mt-4 inline-block text-sm text-sky hover:underline">
            ← К списку
          </Link>
        </AdminPageShell>
      </CapabilityGate>
    );
  }

  const isLegal = doc.body.kind === "legal";
  const isGuide = doc.body.kind === "guide";
  const isBlog = doc.body.kind === "blog";
  const isDestination = doc.body.kind === "destination";
  const isPlace = doc.body.kind === "place";
  const publicHref = isLegal
    ? `/legal/${doc.slug}`
    : isGuide
      ? `/guide/${doc.slug}`
      : isBlog
        ? `/blog/${doc.slug}`
        : isDestination
          ? `/destinations/${doc.slug}`
          : `/places/${doc.slug}`;

  return (
    <CapabilityGate capability="content.edit">
      <AdminPageShell>
        <AdminPageHeader
          title={title || doc.title}
          subtitle={`CMS · ${doc.docType} · ${doc.slug} · ${status}`}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={saving} onClick={() => void saveDraft()}>
                Сохранить черновик
              </Button>
              {canPublish ? (
                <Button disabled={saving} onClick={() => void publish()}>
                  Опубликовать
                </Button>
              ) : null}
              <Link
                href={`/admin/content/documents/${encodedId}/preview`}
                className="inline-flex h-10 items-center rounded-xl border border-gray-200 px-4 text-sm font-medium text-charcoal hover:border-sky/40 hover:text-sky"
              >
                Предпросмотр
              </Link>
              <Link
                href={publicHref}
                target="_blank"
                className="inline-flex h-10 items-center rounded-xl border border-gray-200 px-4 text-sm font-medium text-charcoal hover:border-sky/40 hover:text-sky"
              >
                На сайте
              </Link>
            </div>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <section className={`${cabinetCardClass} space-y-4 p-5`}>
            <label className="block space-y-1 text-sm">
              <span className="text-slate">Заголовок</span>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>

            {isLegal || isGuide || isDestination ? (
              <label className="block space-y-1 text-sm">
                <span className="text-slate">
                  {isDestination ? "Краткое описание (в шапке страницы)" : "Описание страницы"}
                </span>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              </label>
            ) : null}

            {isGuide ? (
              <label className="block space-y-1 text-sm">
                <span className="text-slate">Категория</span>
                <Input value={guideCategory} onChange={(e) => setGuideCategory(e.target.value)} />
              </label>
            ) : null}

            {isDestination ? (
              <>
                <label className="block space-y-1 text-sm">
                  <span className="text-slate">Подробное введение</span>
                  <textarea
                    className="min-h-[120px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-charcoal"
                    value={destinationIntro}
                    onChange={(e) => setDestinationIntro(e.target.value)}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1 text-sm">
                    <span className="text-slate">Региональная группа</span>
                    <Input
                      value={destinationRegionGroup}
                      onChange={(e) => setDestinationRegionGroup(e.target.value)}
                    />
                  </label>
                  <label className="block space-y-1 text-sm">
                    <span className="text-slate">Рекомендуемый срок</span>
                    <Input
                      value={destinationIdealDuration}
                      onChange={(e) => setDestinationIdealDuration(e.target.value)}
                    />
                  </label>
                </div>
                <label className="block space-y-1 text-sm">
                  <span className="text-slate">Лучший сезон</span>
                  <Input
                    value={destinationBestSeason}
                    onChange={(e) => setDestinationBestSeason(e.target.value)}
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-slate">Как добраться</span>
                  <textarea
                    className="min-h-[100px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-charcoal"
                    value={destinationHowToGetThere}
                    onChange={(e) => setDestinationHowToGetThere(e.target.value)}
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-slate">Главные точки (по одной на строку)</span>
                  <textarea
                    className="min-h-[100px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-charcoal"
                    value={listToLines(destinationHighlights)}
                    onChange={(e) => setDestinationHighlights(linesToList(e.target.value))}
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-slate">Советы путешественникам (по одному на строку)</span>
                  <textarea
                    className="min-h-[100px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-charcoal"
                    value={listToLines(destinationTravelTips)}
                    onChange={(e) => setDestinationTravelTips(linesToList(e.target.value))}
                  />
                </label>
              </>
            ) : null}

            {isPlace ? (
              <>
                <label className="block space-y-1 text-sm">
                  <span className="text-slate">Краткое описание</span>
                  <Input
                    value={placeShortDescription}
                    onChange={(e) => setPlaceShortDescription(e.target.value)}
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-slate">Подробное описание</span>
                  <textarea
                    className="min-h-[140px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-charcoal"
                    value={placeFullDescription}
                    onChange={(e) => setPlaceFullDescription(e.target.value)}
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-slate">Как добраться</span>
                  <textarea
                    className="min-h-[100px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-charcoal"
                    value={placeHowToGetThere}
                    onChange={(e) => setPlaceHowToGetThere(e.target.value)}
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-slate">Интересные факты (по одному на строку)</span>
                  <textarea
                    className="min-h-[100px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-charcoal"
                    value={listToLines(placeInterestingFacts)}
                    onChange={(e) => setPlaceInterestingFacts(linesToList(e.target.value))}
                  />
                </label>
              </>
            ) : null}

            {isBlog ? (
              <label className="block space-y-1 text-sm">
                <span className="text-slate">Анонс</span>
                <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
              </label>
            ) : null}

            {isBlog ? (
              <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-charcoal">
                <input
                  type="checkbox"
                  checked={blogFeatured}
                  onChange={(e) => setBlogFeatured(e.target.checked)}
                />
                Показывать как избранную статью в каталоге
              </label>
            ) : null}

            <label className="block space-y-1 text-sm">
              <span className="text-slate">Статус</span>
              <NativeSelect
                value={status}
                onChange={(e) => setStatus(e.target.value as CmsDocument["status"])}
                disabled={!canPublish}
              >
                <option value="draft">Черновик</option>
                <option value="published">Опубликовано</option>
                <option value="archived">В архиве</option>
              </NativeSelect>
            </label>

            {isLegal || isGuide ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-bold text-charcoal">
                  {isGuide ? "Разделы путеводителя" : "Разделы"}
                </h2>
                <Button size="sm" variant="outline" onClick={addSection}>
                  Добавить раздел
                </Button>
              </div>

              {sections.map((section, index) => (
                <div key={index} className="space-y-2 rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      value={section.heading ?? ""}
                      onChange={(e) => updateSection(index, { heading: e.target.value })}
                      placeholder="Заголовок раздела (необязательно)"
                    />
                    <Button size="sm" variant="ghost" onClick={() => removeSection(index)}>
                      Удалить
                    </Button>
                  </div>
                  <label className="block space-y-1 text-xs text-slate">
                    Абзацы (по одному на строку)
                    <textarea
                      className="min-h-[80px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-charcoal"
                      value={listToLines(section.paragraphs)}
                      onChange={(e) =>
                        updateSection(index, { paragraphs: linesToList(e.target.value) })
                      }
                    />
                  </label>
                  <label className="block space-y-1 text-xs text-slate">
                    Список (по одному пункту на строку)
                    <textarea
                      className="min-h-[60px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-charcoal"
                      value={listToLines(section.list)}
                      onChange={(e) => updateSection(index, { list: linesToList(e.target.value) })}
                    />
                  </label>
                </div>
              ))}
            </div>
            ) : null}

            {isBlog ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-bold text-charcoal">Разделы статьи</h2>
                <Button size="sm" variant="outline" onClick={addBlogSection}>
                  Добавить раздел
                </Button>
              </div>
              {blogSections.map((section, index) => (
                <div key={index} className="space-y-2 rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      value={section.title}
                      onChange={(e) => updateBlogSection(index, { title: e.target.value })}
                      placeholder="Заголовок раздела"
                    />
                    <Button size="sm" variant="ghost" onClick={() => removeBlogSection(index)}>
                      Удалить
                    </Button>
                  </div>
                  <label className="block space-y-1 text-xs text-slate">
                    Текст
                    <textarea
                      className="min-h-[120px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-charcoal"
                      value={section.body}
                      onChange={(e) => updateBlogSection(index, { body: e.target.value })}
                    />
                  </label>
                </div>
              ))}
            </div>
            ) : null}
          </section>

          <aside className="space-y-4">
            <section className={`${cabinetCardClass} p-4 text-sm`}>
              <Link href="/admin/content/documents" className="text-sky hover:underline">
                ← К списку документов
              </Link>
              <p className="mt-3 text-xs text-slate">
                Обновлено: {formatAdminWhen(doc.updatedAt)}
              </p>
              {doc.publishedAt ? (
                <p className="mt-1 text-xs text-slate">
                  Опубликовано: {formatAdminWhen(doc.publishedAt)}
                </p>
              ) : null}
              {canPublish ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 w-full"
                  disabled={saving}
                  onClick={() => void removeOverride()}
                >
                  Удалить CMS-версию
                </Button>
              ) : null}
            </section>

            <section className={`${cabinetCardClass} p-4`}>
              <h2 className="font-heading text-sm font-bold text-charcoal">Ревизии</h2>
              <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-xs text-slate">
                {revisions.length === 0 ? (
                  <li>Нет ревизий</li>
                ) : (
                  revisions.map((rev) => (
                    <li key={rev.id}>
                      <button
                        type="button"
                        className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                          selectedRevisionMeta?.id === rev.id
                            ? "border-sky/40 bg-sky/5 text-charcoal"
                            : "border-gray-100 hover:border-sky/30 hover:bg-gray-50"
                        }`}
                        onClick={() => void openRevision(rev)}
                        disabled={revisionLoadingId === rev.id || saving}
                      >
                        <p className="font-medium text-charcoal">
                          #{rev.revisionNumber} · {formatAdminWhen(rev.createdAt)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate">
                          Автор: {rev.authorName || rev.createdBy?.slice(0, 8) || "не указан"}
                        </p>
                      </button>
                    </li>
                  ))
                )}
              </ul>

              {selectedRevisionMeta ? (
                <div className="mt-4 space-y-3 rounded-2xl border border-gray-100 p-3 text-xs">
                  <p className="font-medium text-charcoal">
                    Сравнение с текущей версией · #{selectedRevisionMeta.revisionNumber}
                  </p>

                  {revisionLoadingId === selectedRevisionMeta.id && !selectedRevision ? (
                    <p className="text-slate">Загрузка ревизии…</p>
                  ) : null}

                  {selectedRevision && revisionDiff ? (
                    revisionDiff.hasChanges ? (
                      <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
                        {revisionDiff.items.map((item, index) => (
                          <li key={`${item.label}-${index}`} className="rounded-xl border border-gray-100 p-2">
                            <p className="font-medium text-charcoal">{item.label}</p>
                            <p className="mt-1 text-[11px] text-slate">
                              Текущее:{" "}
                              <span className="whitespace-pre-wrap text-charcoal">
                                {item.currentValue || "—"}
                              </span>
                            </p>
                            <p className="mt-1 text-[11px] text-slate">
                              В ревизии:{" "}
                              <span className="whitespace-pre-wrap text-charcoal">
                                {item.revisionValue || "—"}
                              </span>
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate">Отличий от текущей версии нет.</p>
                    )
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!selectedRevision || saving}
                      onClick={() => void restoreRevision(selectedRevisionMeta)}
                    >
                      {restoringRevisionId === selectedRevisionMeta.id ? "Восстановление…" : "Восстановить"}
                    </Button>
                    {canPublish ? (
                      <Button
                        size="sm"
                        disabled={!selectedRevision || saving}
                        onClick={() => void restoreRevision(selectedRevisionMeta, true)}
                      >
                        {restoringRevisionId === selectedRevisionMeta.id
                          ? "Публикация…"
                          : "Восстановить и опубликовать"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </section>
          </aside>
        </div>
      </AdminPageShell>
    </CapabilityGate>
  );
}
