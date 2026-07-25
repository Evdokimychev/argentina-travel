"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { parseContentSlugList } from "@/lib/cms-content-cross-links";
import type { CmsLocaleCoverage } from "@/lib/cms/cms-locale";
import { isI18nLocale, type I18nLocale } from "@/lib/i18n/config";
import { addLocalePrefix } from "@/lib/i18n/locale-path";
import type { BlogPostSection } from "@/types";
import type { ContentSection } from "@/types/content-page";
import type {
  CmsDestinationBody,
  CmsDocument,
  CmsDocumentBody,
  CmsDocumentSeo,
  CmsGuideBody,
  CmsLandingBody,
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
import { usePageBuilderAutosave } from "@/hooks/usePageBuilderAutosave";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import {
  buildSessionDraftKey,
  readSessionDraft,
  writeSessionDraft,
  type SessionDraftEnvelope,
} from "@/lib/admin/local-draft-recovery";

type Props = {
  documentId: string;
};

type DocumentResponse = { document?: CmsDocument; error?: string };
type CmsRevisionListItem = CmsRevision & { authorName?: string | null };
type RevisionsResponse = { revisions?: CmsRevisionListItem[]; error?: string };
type RevisionResponse = { revision?: CmsRevision; error?: string };
type RestoreResponse = { document?: CmsDocument; error?: string };
type CmsEditorDraft = {
  title: string;
  status: CmsDocument["status"];
  seo: CmsDocumentSeo;
  scheduleAtLocal: string;
  body: CmsDocumentBody;
};
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
  const [knowledgeAuthorName, setKnowledgeAuthorName] = useState<string | undefined>();
  const [knowledgeAuthorSlug, setKnowledgeAuthorSlug] = useState<string | undefined>();
  const [knowledgeAuthorBio, setKnowledgeAuthorBio] = useState<string | undefined>();
  const [knowledgeAuthorAvatar, setKnowledgeAuthorAvatar] = useState<string | undefined>();
  const [knowledgePersonalExperience, setKnowledgePersonalExperience] = useState<boolean | undefined>();
  const [knowledgeVerifiedByAuthor, setKnowledgeVerifiedByAuthor] = useState<boolean | undefined>();
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
  const [placeRelatedTourSlugs, setPlaceRelatedTourSlugs] = useState("");
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
  const [baselineFingerprint, setBaselineFingerprint] = useState<string | null>(null);
  const [recoveryDraft, setRecoveryDraft] = useState<SessionDraftEnvelope<CmsEditorDraft> | null>(null);
  const [recoverySafetyNotice, setRecoverySafetyNotice] = useState<string | null>(null);
  const recoveryCheckedRef = useRef(false);
  const recoveryDraftRef = useRef<SessionDraftEnvelope<CmsEditorDraft> | null>(null);

  const parsedId = useMemo(() => parseCmsDocumentId(documentId), [documentId]);
  const currentLocale: I18nLocale =
    parsedId?.locale && isI18nLocale(parsedId.locale) ? parsedId.locale : "ru";

  const encodedId = encodeURIComponent(documentId);
  const recoveryStorageKey = useMemo(() => buildSessionDraftKey(documentId), [documentId]);

  const applyDraftState = useCallback((draft: CmsEditorDraft) => {
    setTitle(draft.title);
    setStatus(draft.status);
    setSeo(draft.seo);
    setScheduleAtLocal(draft.scheduleAtLocal);
    setDescription("");
    setGuideCategory("");
    setSections([]);
    setExcerpt("");
    setBlogSections([]);
    setBlogFeatured(false);
    setBlogRelatedDestinations("");
    setKnowledgeAuthorName(undefined);
    setKnowledgeAuthorSlug(undefined);
    setKnowledgeAuthorBio(undefined);
    setKnowledgeAuthorAvatar(undefined);
    setKnowledgePersonalExperience(undefined);
    setKnowledgeVerifiedByAuthor(undefined);
    setDestinationIntro("");
    setDestinationRegionGroup("");
    setDestinationBestSeason("");
    setDestinationIdealDuration("");
    setDestinationHowToGetThere("");
    setDestinationHighlights([]);
    setDestinationTravelTips([]);
    setPlaceShortDescription("");
    setPlaceFullDescription("");
    setPlaceHowToGetThere("");
    setPlaceInterestingFacts([]);
    setPlaceRelatedTourSlugs("");

    if (draft.body.kind === "legal") {
      setDescription(draft.body.description);
      setSections(draft.body.sections);
    } else if (draft.body.kind === "guide" || draft.body.kind === "landing") {
      setDescription(draft.body.description);
      setGuideCategory(draft.body.category ?? "");
      setSections(draft.body.sections);
    } else if (draft.body.kind === "blog") {
      setExcerpt(draft.body.excerpt ?? "");
      setBlogFeatured(draft.body.featured ?? false);
      setBlogRelatedDestinations((draft.body.relatedDestinations ?? []).join(", "));
      setKnowledgeAuthorName(draft.body.authorName);
      setKnowledgeAuthorSlug(draft.body.authorSlug);
      setKnowledgeAuthorBio(draft.body.authorBio);
      setKnowledgeAuthorAvatar(draft.body.authorAvatar);
      setKnowledgePersonalExperience(draft.body.personalExperience);
      setKnowledgeVerifiedByAuthor(draft.body.verifiedByAuthor);
      setBlogSections(
        draft.body.sections ?? [
          { title: "Основной текст", body: draft.body.content ?? "", blocks: [] },
        ],
      );
    } else if (draft.body.kind === "author_article") {
      setExcerpt(draft.body.excerpt ?? "");
      setBlogSections(
        draft.body.sections ?? [{ title: "Основной текст", body: "", blocks: [] }],
      );
    } else if (draft.body.kind === "destination") {
      setDescription(draft.body.description);
      setDestinationIntro(draft.body.intro ?? "");
      setDestinationRegionGroup(draft.body.regionGroup ?? "");
      setDestinationBestSeason(draft.body.bestSeason ?? "");
      setDestinationIdealDuration(draft.body.idealDuration ?? "");
      setDestinationHowToGetThere(draft.body.howToGetThere ?? "");
      setDestinationHighlights(draft.body.highlights ?? []);
      setDestinationTravelTips(draft.body.travelTips ?? []);
      setSections(draft.body.sections ?? []);
    } else if (draft.body.kind === "place") {
      setPlaceShortDescription(draft.body.shortDescription ?? "");
      setPlaceFullDescription(draft.body.fullDescription ?? "");
      setPlaceHowToGetThere(draft.body.howToGetThere ?? "");
      setPlaceInterestingFacts(draft.body.interestingFacts ?? []);
      setPlaceRelatedTourSlugs((draft.body.relatedTourSlugs ?? []).join(", "));
      setSections(draft.body.sections ?? []);
    }
  }, []);

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
      applyDraftState({
        title: document.title,
        status: document.status,
        seo: document.seo ?? {},
        scheduleAtLocal: scheduledPublishAtToDatetimeLocalValue(document.scheduledPublishAt),
        body: document.body,
      });
      setBaselineFingerprint(null);
      recoveryCheckedRef.current = false;
      recoveryDraftRef.current = null;
      setRecoveryDraft(null);
      setRecoverySafetyNotice(null);

      setRevisions(revJson.revisions ?? []);
      setSelectedRevision(null);
      setSelectedRevisionMeta(null);
      await loadLocaleCoverage(document.docType, document.slug);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [applyDraftState, encodedId, loadLocaleCoverage]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createLocaleVariant(locale: I18nLocale) {
    if (!doc) return;
    if (!confirmNavigation()) return;
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
        collector: doc.body.collector,
        ...(doc.docType === "knowledge"
          ? {
              authorName:
                knowledgeAuthorName === undefined ? undefined : knowledgeAuthorName.trim(),
              authorSlug:
                knowledgeAuthorSlug === undefined ? undefined : knowledgeAuthorSlug.trim(),
              authorBio:
                knowledgeAuthorBio === undefined ? undefined : knowledgeAuthorBio.trim(),
              authorAvatar:
                knowledgeAuthorAvatar === undefined ? undefined : knowledgeAuthorAvatar.trim(),
              personalExperience: knowledgePersonalExperience,
              verifiedByAuthor: knowledgeVerifiedByAuthor,
            }
          : {}),
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
    if (doc?.body.kind === "landing") {
      return {
        kind: "landing",
        description: description.trim(),
        category: guideCategory.trim() || undefined,
        sections: sections.map((section) => normalizeGuideSectionForCms(section)),
        relatedLinks: doc.body.relatedLinks,
        relatedTourQuery: doc.body.relatedTourQuery,
      } satisfies CmsLandingBody;
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
        sections: sections.map((section) => normalizeGuideSectionForCms(section)),
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
        relatedTourSlugs: parseContentSlugList(placeRelatedTourSlugs),
        sections: sections.map((section) => normalizeGuideSectionForCms(section)),
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
      canonical: seo.canonical?.trim() || undefined,
      noIndex: seo.noIndex === true ? true : undefined,
    };
  }

  const editorDraft: CmsEditorDraft = {
    title: title.trim(),
    status,
    seo: buildSeo(),
    scheduleAtLocal,
    body: buildBody(),
  };
  const editorDraftRef = useRef(editorDraft);
  editorDraftRef.current = editorDraft;
  const draftFingerprint = JSON.stringify(editorDraft);
  const isDirty = baselineFingerprint !== null && draftFingerprint !== baselineFingerprint;
  const { confirmNavigation } = useUnsavedChangesGuard(isDirty);

  useEffect(() => {
    if (!doc || baselineFingerprint !== null) return;
    setBaselineFingerprint(draftFingerprint);
  }, [baselineFingerprint, doc, draftFingerprint]);

  useEffect(() => {
    if (!doc || baselineFingerprint === null || recoveryCheckedRef.current) return;
    recoveryCheckedRef.current = true;
    try {
      const stored = readSessionDraft<CmsEditorDraft>(sessionStorage, recoveryStorageKey);
      if (
        stored &&
        stored.serverUpdatedAt === doc.updatedAt &&
        JSON.stringify(stored.draft) !== baselineFingerprint
      ) {
        recoveryDraftRef.current = stored;
        setRecoveryDraft(stored);
      } else {
        sessionStorage.removeItem(recoveryStorageKey);
      }
    } catch {
      setRecoverySafetyNotice(
        "Браузер запретил локальное восстановление. Используйте «Сохранить черновик» чаще.",
      );
    }
  }, [baselineFingerprint, doc, recoveryStorageKey]);

  useEffect(() => {
    if (!doc || baselineFingerprint === null || !recoveryCheckedRef.current) return;
    if (!isDirty) {
      if (!recoveryDraftRef.current) {
        try {
          sessionStorage.removeItem(recoveryStorageKey);
        } catch {
          // Session storage can be unavailable in hardened browser modes.
        }
      }
      return;
    }

    const timeout = window.setTimeout(() => {
      try {
        const written = writeSessionDraft(sessionStorage, recoveryStorageKey, {
          version: 1,
          savedAt: new Date().toISOString(),
          serverUpdatedAt: doc.updatedAt,
          draft: editorDraftRef.current,
        });
        if (written) {
          setRecoverySafetyNotice(null);
        } else {
          sessionStorage.removeItem(recoveryStorageKey);
          setRecoverySafetyNotice(
            "Локальная копия не создаётся: в тексте обнаружены контактные или секретные данные либо черновик слишком большой. Сохраните его на сервере.",
          );
        }
      } catch {
        setRecoverySafetyNotice(
          "Браузер запретил локальное восстановление. Используйте «Сохранить черновик» чаще.",
        );
      }
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [baselineFingerprint, doc, draftFingerprint, isDirty, recoveryStorageKey]);

  function restoreLocalDraft() {
    if (!recoveryDraft) return;
    applyDraftState(recoveryDraft.draft);
    recoveryDraftRef.current = null;
    setRecoveryDraft(null);
    setRecoverySafetyNotice(null);
  }

  function dismissLocalDraft() {
    try {
      sessionStorage.removeItem(recoveryStorageKey);
    } catch {
      // The in-memory dismissal still works when storage is unavailable.
    }
    recoveryDraftRef.current = null;
    setRecoveryDraft(null);
  }

  const revisionDiff =
    selectedRevision && doc
      ? buildCmsRevisionDiff(
          {
            title: editorDraft.title,
            body: editorDraft.body,
            seo: editorDraft.seo,
          },
          {
            title: selectedRevision.title,
            body: selectedRevision.body,
            seo: selectedRevision.seo ?? {},
          },
        )
      : null;

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
    if (!confirmNavigation()) return;
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
          body: JSON.stringify({ publish, expectedVersion: doc?.rowVersion }),
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

  /** Status-preserving PATCH — used by publish prep and autosave (never forces draft). */
  const persistContent = useCallback(async (): Promise<CmsDocument | null> => {
    if (!doc) return null;
    const nextBody = buildBody();
    const nextSeo = buildSeo();
    const nextTitle = title.trim();
    const res = await fetch(`/api/admin/content/documents/${encodedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: nextTitle,
        body: nextBody,
        seo: nextSeo,
        expectedVersion: doc.rowVersion,
      }),
    });
    const json = (await res.json()) as DocumentResponse;
    if (!res.ok || !json.document) {
      throw new Error(json.error ?? "Ошибка сохранения");
    }
    setDoc(json.document);
    setStatus(json.document.status);
    setBaselineFingerprint(
      JSON.stringify({
        title: nextTitle,
        status: json.document.status,
        seo: nextSeo,
        scheduleAtLocal,
        body: nextBody,
      } satisfies CmsEditorDraft),
    );
    return json.document;
  }, [
    doc,
    encodedId,
    title,
    description,
    guideCategory,
    sections,
    excerpt,
    blogSections,
    blogFeatured,
    blogRelatedDestinations,
    knowledgeAuthorName,
    knowledgeAuthorSlug,
    knowledgeAuthorBio,
    knowledgeAuthorAvatar,
    knowledgePersonalExperience,
    knowledgeVerifiedByAuthor,
    destinationIntro,
    destinationRegionGroup,
    destinationBestSeason,
    destinationIdealDuration,
    destinationHowToGetThere,
    destinationHighlights,
    destinationTravelTips,
    placeShortDescription,
    placeFullDescription,
    placeHowToGetThere,
    placeInterestingFacts,
    placeRelatedTourSlugs,
    seo,
    scheduleAtLocal,
  ]);

  const autosavePayload = useMemo(
    () => ({ fingerprint: draftFingerprint }),
    [draftFingerprint],
  );

  const runAutosave = useCallback(async () => {
    await persistContent();
  }, [persistContent]);

  usePageBuilderAutosave(autosavePayload, runAutosave, {
    enabled: Boolean(doc) && !loading && isDirty && !saving,
  });

  async function saveDraft() {
    if (!doc) return;
    if (
      (doc.status === "published" || doc.status === "scheduled") &&
      !window.confirm(
        doc.status === "published"
          ? "Снять материал с публикации и сохранить как черновик?"
          : "Отменить запланированную публикацию и сохранить материал как черновик?",
      )
    ) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/content/documents/${encodedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: buildBody(),
          seo: buildSeo(),
          status: "draft",
          expectedVersion: doc.rowVersion,
        }),
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
    if (!canPublish || !doc) return;
    if (!window.confirm("Опубликовать текущую редакцию на сайте?")) return;
    setSaving(true);
    try {
      const saved = await persistContent();
      if (!saved) throw new Error("Не удалось сохранить изменения перед публикацией");
      const res = await fetch(`/api/admin/content/documents/${encodedId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedVersion: saved.rowVersion }),
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
    if (!canPublish || !doc) return;
    const scheduledPublishAt = datetimeLocalValueToScheduledPublishAt(scheduleAtLocal);
    if (!scheduledPublishAt) {
      alert("Укажите дату и время публикации");
      return;
    }
    if (!window.confirm(`Запланировать публикацию на ${formatScheduledPublishLabel(scheduledPublishAt)}?`)) return;

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
          expectedVersion: doc.rowVersion,
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
    if (!canPublish || !doc) return;
    if (!confirmNavigation()) return;
    if (!window.confirm("Отменить запланированную публикацию?")) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/content/documents/${encodedId}/schedule`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedVersion: doc.rowVersion }),
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
    if (!confirmNavigation()) return;
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
  const isLanding = doc.body.kind === "landing";
  const isKnowledge = doc.docType === "knowledge";
  const isBlog = doc.body.kind === "blog" && !isKnowledge;
  const isAuthorArticle = doc.body.kind === "author_article";
  const isBlogLike = doc.body.kind === "blog" || isAuthorArticle;
  const isDestination = doc.body.kind === "destination";
  const isPlace = doc.body.kind === "place";
  const publicPathWithoutLocale = isLegal
    ? `/legal/${doc.slug}`
    : isGuide
      ? `/guide/${doc.slug}`
      : isLanding
        ? `/landing/${doc.slug}`
        : isKnowledge
          ? `/baza-znaniy/${doc.slug}`
          : isBlog
            ? `/blog/${doc.slug}`
            : isAuthorArticle
              ? `/blog/author/${doc.slug}`
              : isDestination
                ? `/destinations/${doc.slug}`
                : `/places/${doc.slug}`;
  const publicHref = addLocalePrefix(publicPathWithoutLocale, currentLocale);

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
          }${isDirty ? " · есть несохранённые правки (автосохранение ~3 с)" : ""}`}
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

        <section
          aria-live="polite"
          className={`rounded-2xl border px-4 py-3 text-sm ${
            isDirty
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          <p className="font-semibold">
            {isDirty ? "Есть несохранённые изменения" : "Все изменения сохранены"}
          </p>
          <p className="mt-1 text-xs leading-5">
            {isDirty
              ? "Перед уходом со страницы браузер попросит подтверждение. Локальная копия помогает восстановиться после случайной перезагрузки."
              : "Редактор синхронизирован с последней серверной версией."}
          </p>
        </section>

        {recoveryDraft ? (
          <section className="rounded-2xl border border-sky/30 bg-sky/5 p-4 text-sm text-charcoal">
            <p className="font-semibold">Найдена локальная копия черновика</p>
            <p className="mt-1 text-xs leading-5 text-slate">
              Сохранена {formatAdminWhen(recoveryDraft.savedAt)} до закрытия вкладки. Восстановление
              вернёт текст в форму, но не опубликует его.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={restoreLocalDraft}>
                Восстановить в редактор
              </Button>
              <Button size="sm" variant="outline" onClick={dismissLocalDraft}>
                Удалить локальную копию
              </Button>
            </div>
          </section>
        ) : null}

        {recoverySafetyNotice ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
            {recoverySafetyNotice}
          </p>
        ) : null}

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

            {isLegal || isGuide || isLanding || isDestination ? (
              <label className="block space-y-1 text-sm">
                <span className="text-slate">
                  {isDestination ? "Краткое описание (в шапке страницы)" : "Описание страницы"}
                </span>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              </label>
            ) : null}

            {isGuide || isLanding ? (
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
                <label className="block space-y-1 text-sm">
                  <span className="text-slate">Связанные туры (slug через запятую)</span>
                  <Input
                    value={placeRelatedTourSlugs}
                    onChange={(e) => setPlaceRelatedTourSlugs(e.target.value)}
                    placeholder="patagonia-glaciers, el-calafate-trek"
                  />
                  <span className="text-xs text-slate">
                    Slug из каталога туров — блок «Туры рядом» на странице места
                  </span>
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

            {isKnowledge ? (
              <fieldset className="space-y-3 rounded-xl border border-gray-200 p-4">
                <legend className="px-1 text-sm font-semibold text-charcoal">
                  Авторство базы знаний
                </legend>
                <p className="text-xs leading-5 text-slate">
                  Оставьте поля пустыми для редакционного справочника. Личного автора указывайте
                  только после его явного подтверждения материала.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1 text-sm">
                    <span className="text-slate">Имя автора</span>
                    <Input
                      value={knowledgeAuthorName ?? ""}
                      onChange={(event) => setKnowledgeAuthorName(event.target.value)}
                    />
                  </label>
                  <label className="block space-y-1 text-sm">
                    <span className="text-slate">Slug профиля</span>
                    <Input
                      value={knowledgeAuthorSlug ?? ""}
                      onChange={(event) => setKnowledgeAuthorSlug(event.target.value)}
                      placeholder="ivan"
                    />
                  </label>
                </div>
                <label className="block space-y-1 text-sm">
                  <span className="text-slate">Краткая биография</span>
                  <textarea
                    className="min-h-[88px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-charcoal"
                    value={knowledgeAuthorBio ?? ""}
                    onChange={(event) => setKnowledgeAuthorBio(event.target.value)}
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-slate">Фото автора (URL или /media/...)</span>
                  <Input
                    value={knowledgeAuthorAvatar ?? ""}
                    onChange={(event) => setKnowledgeAuthorAvatar(event.target.value)}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-charcoal">
                  <input
                    type="checkbox"
                    checked={knowledgePersonalExperience ?? false}
                    onChange={(event) => {
                      setKnowledgePersonalExperience(event.target.checked);
                      if (!event.target.checked) setKnowledgeVerifiedByAuthor(false);
                    }}
                  />
                  Это личный опыт автора
                </label>
                <label className="flex items-center gap-2 text-sm text-charcoal">
                  <input
                    type="checkbox"
                    checked={knowledgeVerifiedByAuthor ?? false}
                    disabled={knowledgePersonalExperience !== true}
                    onChange={(event) => setKnowledgeVerifiedByAuthor(event.target.checked)}
                  />
                  Автор подтвердил текст и публикацию
                </label>
              </fieldset>
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
              <GuideSectionPageBuilder
                sections={sections}
                onChange={setSections}
                title="Конструктор путеводителя"
                starterPatterns={["practical-guide", "destination-page-body", "day-by-day-route"]}
              />
            ) : null}

            {isLanding ? (
              <GuideSectionPageBuilder
                sections={sections}
                onChange={setSections}
                title="Конструктор лендинга"
                starterPatterns={["hub-intro", "destination-page-body", "practical-guide"]}
                helpText="Маркетинговая страница: баннеры, блоки с призывом к действию, связанные ссылки и практические секции."
              />
            ) : null}

            {isDestination ? (
              <GuideSectionPageBuilder
                sections={sections}
                onChange={setSections}
                title="Конструктор страницы направления"
                starterPatterns={["destination-page-body", "hub-intro", "destination-story"]}
                helpText="Шапка направления (сезон, как добраться, советы) редактируется выше. Здесь — дополнительные редакционные блоки страницы."
              />
            ) : null}

            {isPlace ? (
              <GuideSectionPageBuilder
                sections={sections}
                onChange={setSections}
                title="Конструктор страницы места"
                starterPatterns={["place-practical", "practical-guide", "destination-story"]}
                helpText="Базовое описание места редактируется выше. Здесь — дополнительные блоки: шаги, FAQ, источники, галереи."
              />
            ) : null}

            {isBlogLike ? (
              <BlogSectionPageBuilder
                sections={blogSections}
                onChange={setBlogSections}
                title={isKnowledge ? "Конструктор статьи базы знаний" : "Визуальный конструктор статьи"}
                starterPatterns={
                  isKnowledge
                    ? ["immigration-practical", "practical-guide", "expert-story"]
                    : ["practical-guide", "expert-story", "destination-story"]
                }
              />
            ) : null}
          </section>

          <aside className="space-y-4">
            {doc.body.kind === "blog" && doc.body.collector ? (
              <section className={`${cabinetCardClass} p-4 text-sm`}>
                <h2 className="font-heading text-sm font-bold text-charcoal">Источник материала</h2>
                <dl className="mt-3 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate">Оценка</dt>
                    <dd className="font-semibold text-charcoal">{doc.body.collector.qualityScore}/100</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate">Источник</dt>
                    <dd className="text-right text-charcoal">
                      {doc.body.collector.source}:{doc.body.collector.sourceId}
                    </dd>
                  </div>
                  {doc.body.collector.city || doc.body.collector.province ? (
                    <div className="flex items-start justify-between gap-3">
                      <dt className="text-slate">География</dt>
                      <dd className="text-right text-charcoal">
                        {[doc.body.collector.city, doc.body.collector.province].filter(Boolean).join(", ")}
                      </dd>
                    </div>
                  ) : null}
                </dl>
                {doc.body.collector.sourceUrl ? (
                  <a
                    href={doc.body.collector.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-xs text-sky hover:underline"
                  >
                    Открыть первоисточник
                  </a>
                ) : null}
                {doc.body.collector.flags.length ? (
                  <p className="mt-3 text-xs text-amber-700">
                    Проверить: {doc.body.collector.flags.join(", ")}
                  </p>
                ) : null}
              </section>
            ) : null}

            {isBlogLike ? (
              <BlogInternalLinksPreview
                excerpt={excerpt}
                sections={blogSections}
                slug={doc?.slug}
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
              documentStatus={status}
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
