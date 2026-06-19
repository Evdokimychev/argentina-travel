"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminApi } from "@/hooks/useAdminApi";
import type { ContentDocumentItem, ContentInventorySummary } from "@/lib/admin/content-inventory";
import type { CmsLocaleCoverage } from "@/lib/cms/cms-locale";
import { cabinetCardClass, cabinetStatCardClass } from "@/lib/cabinet-ui";
import CmsLocaleBadges from "@/components/admin/CmsLocaleBadges";

type LegalEditableRow = {
  slug: string;
  title: string;
  href: string;
  cmsId: string;
  cmsStatus: string | null;
  hasOverride: boolean;
  publicSource: "cms" | "file";
  featuredFromCms?: boolean;
  localeCoverage: CmsLocaleCoverage;
};

type ContentResponse = ContentInventorySummary & {
  legalEditable?: LegalEditableRow[];
  blogEditable?: LegalEditableRow[];
  guideEditable?: LegalEditableRow[];
  destinationEditable?: LegalEditableRow[];
  placeEditable?: LegalEditableRow[];
  cmsCount?: number;
};

const TYPE_LABELS: Record<ContentDocumentItem["type"], string> = {
  blog: "Статья",
  guide: "Путеводитель",
  destination: "Направление",
  place: "Место",
  plan: "План статьи",
};

const STATUS_LABELS: Record<ContentDocumentItem["status"], string> = {
  published: "Опубликовано",
  draft: "Черновик",
  planned: "В плане",
};

const CMS_STATUS_LABELS: Record<string, string> = {
  draft: "Черновик CMS",
  published: "Опубликовано CMS",
  archived: "Архив CMS",
};

export default function ContentDocumentsView() {
  const router = useRouter();
  const { data, loading, error, refresh } = useAdminApi<ContentResponse>("/api/admin/content");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ContentDocumentItem["type"] | "all">("all");
  const [bulkImporting, setBulkImporting] = useState(false);
  const [creatingSlug, setCreatingSlug] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const docs = data?.documents ?? [];
    const query = search.trim().toLowerCase();
    return docs.filter((doc) => {
      if (typeFilter !== "all" && doc.type !== typeFilter) return false;
      if (!query) return true;
      return doc.title.toLowerCase().includes(query) || doc.id.toLowerCase().includes(query);
    });
  }, [data?.documents, search, typeFilter]);

  async function bulkImportFromTs(publish = true) {
    const confirmed = window.confirm(
      publish
        ? "Импортировать все TS-документы в CMS и опубликовать? Существующие записи будут пропущены."
        : "Импортировать все TS-документы как черновики CMS? Существующие записи будут пропущены."
    );
    if (!confirmed) return;

    setBulkImporting(true);
    try {
      const res = await fetch("/api/admin/content/documents/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish, skipExisting: true }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        created?: number;
        skipped?: number;
        message?: string;
        error?: string;
      };
      if (!res.ok && res.status !== 207) {
        throw new Error(json.error ?? json.message ?? "Не удалось выполнить импорт");
      }
      alert(json.message ?? `Создано: ${json.created ?? 0}, пропущено: ${json.skipped ?? 0}`);
      await refresh();
    } catch (importError) {
      alert(importError instanceof Error ? importError.message : "Ошибка импорта");
    } finally {
      setBulkImporting(false);
    }
  }

  async function createLegalOverride(slug: string) {
    setCreatingSlug(slug);
    try {
      const res = await fetch("/api/admin/content/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType: "legal", slug, importFromSource: true }),
      });
      const json = (await res.json()) as { document?: { id: string }; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Не удалось создать документ");
      if (json.document?.id) {
        router.push(`/admin/content/documents/${encodeURIComponent(json.document.id)}`);
      } else {
        await refresh();
      }
    } catch (createError) {
      alert(createError instanceof Error ? createError.message : "Ошибка");
    } finally {
      setCreatingSlug(null);
    }
  }

  async function createBlogOverride(slug: string) {
    setCreatingSlug(slug);
    try {
      const res = await fetch("/api/admin/content/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType: "blog", slug, importFromSource: true }),
      });
      const json = (await res.json()) as { document?: { id: string }; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Не удалось создать документ");
      if (json.document?.id) {
        router.push(`/admin/content/documents/${encodeURIComponent(json.document.id)}`);
      } else {
        await refresh();
      }
    } catch (createError) {
      alert(createError instanceof Error ? createError.message : "Ошибка");
    } finally {
      setCreatingSlug(null);
    }
  }

  async function createGuideOverride(slug: string) {
    setCreatingSlug(slug);
    try {
      const res = await fetch("/api/admin/content/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType: "guide", slug, importFromSource: true }),
      });
      const json = (await res.json()) as { document?: { id: string }; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Не удалось создать документ");
      if (json.document?.id) {
        router.push(`/admin/content/documents/${encodeURIComponent(json.document.id)}`);
      } else {
        await refresh();
      }
    } catch (createError) {
      alert(createError instanceof Error ? createError.message : "Ошибка");
    } finally {
      setCreatingSlug(null);
    }
  }

  async function createDestinationOverride(slug: string) {
    setCreatingSlug(slug);
    try {
      const res = await fetch("/api/admin/content/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType: "destination", slug, importFromSource: true }),
      });
      const json = (await res.json()) as { document?: { id: string }; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Не удалось создать документ");
      if (json.document?.id) {
        router.push(`/admin/content/documents/${encodeURIComponent(json.document.id)}`);
      } else {
        await refresh();
      }
    } catch (createError) {
      alert(createError instanceof Error ? createError.message : "Ошибка");
    } finally {
      setCreatingSlug(null);
    }
  }

  async function createPlaceOverride(slug: string) {
    setCreatingSlug(slug);
    try {
      const res = await fetch("/api/admin/content/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType: "place", slug, importFromSource: true }),
      });
      const json = (await res.json()) as { document?: { id: string }; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Не удалось создать документ");
      if (json.document?.id) {
        router.push(`/admin/content/documents/${encodeURIComponent(json.document.id)}`);
      } else {
        await refresh();
      }
    } catch (createError) {
      alert(createError instanceof Error ? createError.message : "Ошибка");
    } finally {
      setCreatingSlug(null);
    }
  }

  function renderCmsRow(row: LegalEditableRow, createOverride: (slug: string) => void) {
    return (
      <li key={row.slug} className="flex flex-wrap items-center gap-3 px-5 py-4 text-sm">
        <span className="font-medium text-charcoal">{row.title}</span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-slate">
          {row.publicSource === "cms" ? "На сайте: CMS" : "На сайте: файл"}
        </span>
        {row.cmsStatus ? (
          <span className="text-xs text-sky">{CMS_STATUS_LABELS[row.cmsStatus] ?? row.cmsStatus}</span>
        ) : null}
        {row.featuredFromCms ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
            Избранное: CMS
          </span>
        ) : null}
        <CmsLocaleBadges locales={row.localeCoverage} compact />
        <div className="ml-auto flex gap-2">
          <Link href={row.href} target="_blank" className="text-xs text-sky hover:underline">
            Просмотр
          </Link>
          {row.hasOverride ? (
            <Link
              href={`/admin/content/documents/${encodeURIComponent(row.cmsId)}`}
              className="text-xs font-medium text-charcoal hover:text-sky"
            >
              Редактировать
            </Link>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={creatingSlug === row.slug}
              onClick={() => void createOverride(row.slug)}
            >
              Создать CMS-версию
            </Button>
          )}
        </div>
      </li>
    );
  }

  return (
    <CapabilityGate capability="content.edit">
      <AdminPageShell>
        <AdminPageHeader
          title="Документы контента"
          subtitle="Файловый контент и CMS-версии документов, статей, путеводителей, направлений и мест"
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="default"
                disabled={bulkImporting || loading}
                onClick={() => void bulkImportFromTs(true)}
              >
                {bulkImporting ? "Импорт…" : "Импорт из TS"}
              </Button>
              <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
                Обновить
              </Button>
            </div>
          }
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {data?.counts ? (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {[
              { label: "Статьи", value: data.counts.blogPublished },
              { label: "В плане", value: data.counts.blogPlanned },
              { label: "Путеводитель", value: data.counts.guideTopics },
              { label: "Направления", value: data.counts.destinations },
              { label: "Места", value: data.counts.places },
              { label: "CMS", value: data.cmsCount ?? 0 },
            ].map((item) => (
              <div key={item.label} className={cabinetStatCardClass}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate">{item.label}</p>
                <p className="mt-2 font-heading text-2xl font-bold text-charcoal">{item.value}</p>
              </div>
            ))}
          </section>
        ) : null}

        {data?.legalEditable?.length ? (
          <section className={`${cabinetCardClass} overflow-hidden`}>
            <h2 className="border-b border-gray-100 px-5 py-4 font-heading text-lg font-bold text-charcoal">
              Юридические документы (CMS)
            </h2>
            <ul className="divide-y divide-gray-100">
              {data.legalEditable.map((row) => renderCmsRow(row, createLegalOverride))}
            </ul>
          </section>
        ) : null}

        {data?.blogEditable?.length ? (
          <section className={`${cabinetCardClass} overflow-hidden`}>
            <h2 className="border-b border-gray-100 px-5 py-4 font-heading text-lg font-bold text-charcoal">
              Статьи (CMS)
            </h2>
            <ul className="divide-y divide-gray-100">
              {data.blogEditable.map((row) => renderCmsRow(row, createBlogOverride))}
            </ul>
          </section>
        ) : null}

        {data?.guideEditable?.length ? (
          <section className={`${cabinetCardClass} overflow-hidden`}>
            <h2 className="border-b border-gray-100 px-5 py-4 font-heading text-lg font-bold text-charcoal">
              Путеводитель (CMS)
            </h2>
            <ul className="divide-y divide-gray-100">
              {data.guideEditable.map((row) => renderCmsRow(row, createGuideOverride))}
            </ul>
          </section>
        ) : null}

        {data?.destinationEditable?.length ? (
          <section className={`${cabinetCardClass} overflow-hidden`}>
            <h2 className="border-b border-gray-100 px-5 py-4 font-heading text-lg font-bold text-charcoal">
              Направления (CMS)
            </h2>
            <ul className="divide-y divide-gray-100">
              {data.destinationEditable.map((row) => renderCmsRow(row, createDestinationOverride))}
            </ul>
          </section>
        ) : null}

        {data?.placeEditable?.length ? (
          <section className={`${cabinetCardClass} overflow-hidden`}>
            <h2 className="border-b border-gray-100 px-5 py-4 font-heading text-lg font-bold text-charcoal">
              Места (CMS)
            </h2>
            <ul className="divide-y divide-gray-100">
              {data.placeEditable.map((row) => renderCmsRow(row, createPlaceOverride))}
            </ul>
          </section>
        ) : null}

        <section className={`${cabinetCardClass} space-y-4 p-4 sm:p-6`}>
          <h2 className="font-heading text-lg font-bold text-charcoal">Файловый каталог</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию…"
              className="sm:max-w-md"
            />
            <NativeSelect
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ContentDocumentItem["type"] | "all")}
              className="sm:w-48"
            >
              <option value="all">Все типы</option>
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </div>

          <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100">
            {filtered.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-slate">
                {loading ? "Загрузка…" : "Ничего не найдено"}
              </li>
            ) : (
              filtered.slice(0, 100).map((doc) => (
                <li key={`${doc.type}-${doc.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-slate">
                    {TYPE_LABELS[doc.type]}
                  </span>
                  <Link href={doc.href} className="font-medium text-sky hover:underline" target="_blank">
                    {doc.title}
                  </Link>
                  <span className="text-xs text-slate">{STATUS_LABELS[doc.status]}</span>
                  {doc.category ? <span className="text-xs text-slate">{doc.category}</span> : null}
                </li>
              ))
            )}
          </ul>
          {filtered.length > 100 ? (
            <p className="text-xs text-slate">Показаны первые 100 из {filtered.length}</p>
          ) : null}
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
