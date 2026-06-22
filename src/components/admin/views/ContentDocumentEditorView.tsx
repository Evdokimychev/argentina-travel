"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import CmsLocaleTabs, { buildEmptyLocaleCoverage } from "@/components/admin/CmsLocaleTabs";
import { useAdminContext } from "@/context/AdminContext";
import { formatAdminWhen } from "@/lib/admin/format";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import { buildCmsRevisionDiff } from "@/lib/cms/revision-diff";
import type { CmsLocaleCoverage } from "@/lib/cms/cms-locale";
import { isI18nLocale, type I18nLocale } from "@/lib/i18n/config";
import type { BlogPostSection } from "@/types";
import type { ContentSection } from "@/types/content-page";
import type {
  CmsDestinationBody,
  CmsDocument,
  CmsDocumentBody,
  CmsDocumentSeo,
  CmsGuideBody,
  CmsLegalBody,
  CmsPlaceBody,
  CmsRevision,
} from "@/types/cms-content";
import { parseCmsDocumentId } from "@/types/cms-content";
import CmsSeoPanel from "@/components/admin/CmsSeoPanel";
import CmsSectionEditor from "@/components/admin/cms/CmsSectionEditor";
import BlogSectionPageBuilder from "@/components/admin/page-builder/BlogSectionPageBuilder";
import BlogInternalLinksPreview from "@/components/admin/cms/BlogInternalLinksPreview";
import GuideSectionPageBuilder from "@/components/admin/page-builder/GuideSectionPageBuilder";
import { stageCmsDocumentPreviewDraft } from "@/lib/cms/cms-preview";
import {
  datetimeLocalValueToScheduledPublishAt,
  formatScheduledPublishLabel,
  scheduledPublishAtToDatetimeLocalValue,
} from "@/lib/cms/cms-scheduled-publish";
import { normalizeGuideSectionForCms } from "@/lib/content-section-body";

type Props = {
  documentId: string;
};

type DocumentResponse = { document?: CmsDocument; error?: string };
type CmsRevisionListItem = CmsRevision & { authorName?: string | null };
type RevisionsResponse = { revisions?: CmsRevisionListItem[]; error?: string };
type RevisionResponse = { revision?: CmsRevision; error?: string };
type RestoreResponse = { document?: CmsDocument; error?: string };
type GroupedDocumentsResponse = {
  grouped?: Array<{
    docType: CmsDocument["docType"];
    slug: string;
    locales: CmsLocaleCoverage;
  }>;
};

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
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [excerpt, setExcerpt] = useState("");
  const [blogSections, setBlogSections] = useState<BlogPostSection[]>([]);
  const [blogFeatured, setBlogFeatured] = useState(false);
  const [blogRelatedDestinations, setBlogRelatedDestinations] = useState("");
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
  const [localeCoverage, setLocaleCoverage] = useState<CmsLocaleCoverage>(buildEmptyLocaleCoverage());
  const [creatingLocale, setCreatingLocale] = useState<I18nLocale | null>(null);
  const [seo, setSeo] = useState<CmsDocumentSeo>({});
  const [scheduleAtLocal, setScheduleAtLocal] = useState("");

  const parsedId = useMemo(() => parseCmsDocumentId(documentId), [documentId]);
  const currentLocale: I18nLocale =
    parsedId?.locale && isI18nLocale(parsedId.locale) ? parsedId.locale : "ru";

  const encodedId = encodeURIComponent(documentId);

  const loadLocaleCoverage = useCallback(async (docType: CmsDocument["docType"], slug: string) => {
    try {
      const res = await fetch(
        `/api/admin/content/documents?grouped=true&docType=${encodeURIComponent(docType)}`
      );
      const json = (await res.json()) as GroupedDocumentsResponse;
      const group = json.grouped?.find((item) => item.slug === slug);
      setLocaleCoverage(group?.locales ?? buildEmptyLocaleCoverage());
    } catch {
      setLocaleCoverage(buildEmptyLocaleCoverage());
    }
  }, []);

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
      setSeo(document.seo ?? {});
      setScheduleAtLocal(scheduledPublishAtToDatetimeLocalValue(document.scheduledPublishAt));

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
        setBlogRelatedDestinations((document.body.relatedDestinations ?? []).join(", "));
        setBlogSections(
          document.body.sections ?? [
            { title: "Основной текст", body: document.body.content ?? "", blocks: [] },
          ]
        );
      } else if (document.body.kind === "author_article") {
        setExcerpt(document.body.excerpt ?? "");
        setBlogSections(
          document.body.sections ?? [{ title: "Основной текст", body: "", blocks: [] }]
        );
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
      await loadLocaleCoverage(document.docType, document.slug);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [encodedId, loadLocaleCoverage]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createLocaleVariant(locale: I18nLocale) {
    if (!doc) return;
    setCreatingLocale(locale);
    try {
      const res = await fetch("/api/admin/content/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType: doc.docType,
          slug: doc.slug,
          locale,
          importFromSource: true,
        }),
      });
      const json = (await res.json()) as { document?: { id: string }; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Не удалось создать перевод");
      if (json.document?.id) {
        router.push(`/admin/content/documents/${encodeURIComponent(json.document.id)}`);
      }
    } catch (createError) {
      alert(createError instanceof Error ? createError.message : "Ошибка");
    } finally {
      setCreatingLocale(null);
    }
  }

  function buildBody(): CmsDocumentBody {
    if (doc?.body.kind === "blog") {
      return {
        kind: "blog",
        excerpt: excerpt.trim(),
        sections: blogSections,
        featured: blogFeatured,
        relatedDestinations: blogRelatedDestinations
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };
    }
    if (doc?.body.kind === "author_article") {
      return {
        kind: "author_article",
        excerpt: excerpt.trim(),
        authorName: doc.body.authorName,
        sections: blogSections,
      };
    }
    if (doc?.body.kind === "guide") {
      return {
        kind: "guide",
        description: description.trim(),
        category: guideCategory.trim() || undefined,
        sections: sections.map((section) => normalizeGuideSectionForCms(section)),
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

  function buildSeo(): CmsDocumentSeo {
    return {
      title: seo.title?.trim() || undefined,
      description: seo.description?.trim() || undefined,
      image: seo.image?.trim() || undefined,
    };
  }

  const revisionDiff = useMemo(() => {
    if (!selectedRevision || !doc) return null;
    return buildCmsRevisionDiff(
      {
        title: title.trim(),
        body: buildBody(),
        seo: buildSeo(),
      },
      {
        title: selectedRevision.title,
        body: selectedRevision.body,
        seo: selectedRevision.seo ?? {},
      }
    );
  }, [
    blogSections,
    blogFeatured,
    blogRelatedDestinations,
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
    seo,
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
        body: JSON.stringify({ title: title.trim(), body: buildBody(), seo: buildSeo(), status: "draft" }),
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
        body: JSON.stringify({ title: title.trim(), body: buildBody(), seo: buildSeo() }),
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

  function openLivePreview() {
    stageCmsDocumentPreviewDraft(documentId, {
      title: title.trim(),
      body: buildBody(),
      seo: buildSeo(),
    });
    window.open(
      `/admin/content/documents/${encodedId}/preview?live=1`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function schedulePublication() {
    if (!canPublish) return;
    const scheduledPublishAt = datetimeLocalValueToScheduledPublishAt(scheduleAtLocal);
    if (!scheduledPublishAt) {
      alert("Укажите дату и время публикации");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/content/documents/${encodedId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledPublishAt,
          title: title.trim(),
          body: buildBody(),
          seo: buildSeo(),
        }),
      });
      const json = (await res.json()) as DocumentResponse;
      if (!res.ok) throw new Error(json.error ?? "Не удалось запланировать публикацию");
      await load();
    } catch (scheduleError) {
      alert(scheduleError instanceof Error ? scheduleError.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  async function cancelSchedule() {
    if (!canPublish) return;
    if (!window.confirm("Отменить запланированную публикацию?")) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/content/documents/${encodedId}/schedule`, {
        method: "DELETE",
      });
      const json = (await res.json()) as DocumentResponse;
      if (!res.ok) throw new Error(json.error ?? "Не удалось отменить публикацию");
      await load();
    } catch (cancelError) {
      alert(cancelError instanceof Error ? cancelError.message : "Ошибка");
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

  function updateSection(index: number, patch: Partial<ContentSection>) {
    setSections((prev) => prev.map((section, i) => (i === index ? { ...section, ...patch } : section)));
  }

  function addSection() {
    setSections((prev) => [...prev, { heading: "" }]);
  }

  function removeSection(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index));
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
  const isAuthorArticle = doc.body.kind === "author_article";
  const isBlogLike = isBlog || isAuthorArticle;
  const isDestination = doc.body.kind === "destination";
  const isPlace = doc.body.kind === "place";
  const publicHref = isLegal
    ? `/legal/${doc.slug}`
    : isGuide
      ? `/guide/${doc.slug}`
      : isBlog
        ? `/blog/${doc.slug}`
        : isAuthorArticle
          ? `/blog/author/${doc.slug}`
          : isDestination
            ? `/destinations/${doc.slug}`
            : `/places/${doc.slug}`;

  const isScheduled = status === "scheduled";
  const scheduledLabel =
    doc.scheduledPublishAt && isScheduled
      ? formatScheduledPublishLabel(doc.scheduledPublishAt)
      : null;

  return (
    <CapabilityGate capability="content.edit">
      <AdminPageShell>
        <AdminPageHeader
          title={title || doc.title}
          subtitle={`CMS · ${doc.docType} · ${doc.slug} · ${currentLocale} · ${status}${
            scheduledLabel ? ` · ${scheduledLabel}` : ""
          }`}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={saving} onClick={() => void saveDraft()}>
                Сохранить черновик
              </Button>
              {canPublish ? (
                <Button disabled={saving || isScheduled} onClick={() => void publish()}>
                  Опубликовать
                </Button>
              ) : null}
              <Button type="button" variant="outline" disabled={saving} onClick={openLivePreview}>
                Предпросмотр
              </Button>
              <Link
                href={`/admin/content/documents/${encodedId}/preview`}
                className="inline-flex h-10 items-center rounded-xl border border-gray-200 px-4 text-sm font-medium text-charcoal hover:border-sky/40 hover:text-sky"
              >
                Сохранённая версия
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

        <CmsLocaleTabs
          docType={doc.docType}
          slug={doc.slug}
          currentLocale={currentLocale}
          locales={localeCoverage}
          onCreateLocale={(locale) => void createLocaleVariant(locale)}
          creatingLocale={creatingLocale}
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

            {isBlogLike ? (
              <label className="block space-y-1 text-sm">
                <span className="text-slate">Анонс</span>
                <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
              </label>
            ) : null}

            {isBlog ? (
              <label className="block space-y-1 text-sm">
                <span className="text-slate">Связанные направления (id через запятую)</span>
                <Input
                  value={blogRelatedDestinations}
                  onChange={(e) => setBlogRelatedDestinations(e.target.value)}
                  placeholder="patagonia, ba, iguazu"
                />
                <span className="text-xs text-slate">
                  Идентификаторы из каталога направлений — для галереи в статье
                </span>
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

            {isLegal ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-bold text-charcoal">Разделы</h2>
                <Button size="sm" variant="outline" onClick={addSection}>
                  Добавить раздел
                </Button>
              </div>

              {sections.map((section, index) => (
                <CmsSectionEditor
                  key={index}
                  index={index}
                  section={section}
                  onChange={(next) => updateSection(index, next)}
                  onRemove={() => removeSection(index)}
                />
              ))}
            </div>
            ) : null}

            {isGuide ? (
              <GuideSectionPageBuilder sections={sections} onChange={setSections} />
            ) : null}

            {isBlogLike ? (
              <BlogSectionPageBuilder sections={blogSections} onChange={setBlogSections} />
            ) : null}
          </section>

          <aside className="space-y-4">
            {isBlogLike ? (
              <BlogInternalLinksPreview
                excerpt={excerpt}
                sections={blogSections}
              />
            ) : null}

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
              {doc.scheduledPublishAt && isScheduled ? (
                <p className="mt-1 text-xs text-amber-700">
                  Запланировано: {formatScheduledPublishLabel(doc.scheduledPublishAt)}
                </p>
              ) : null}
              {canPublish && status !== "published" ? (
                <div className="mt-4 space-y-2 rounded-xl border border-gray-100 p-3">
                  <p className="text-xs font-medium text-charcoal">Отложенная публикация</p>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-charcoal"
                    value={scheduleAtLocal}
                    onChange={(e) => setScheduleAtLocal(e.target.value)}
                    disabled={saving}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={saving || !scheduleAtLocal.trim()}
                    onClick={() => void schedulePublication()}
                  >
                    Запланировать
                  </Button>
                  {isScheduled ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full"
                      disabled={saving}
                      onClick={() => void cancelSchedule()}
                    >
                      Отменить публикацию
                    </Button>
                  ) : null}
                </div>
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

            <CmsSeoPanel
              pageTitle={title}
              excerpt={isBlog ? excerpt : description}
              seo={seo}
              onChange={setSeo}
              publicPath={publicHref}
            />

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
