"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminApi } from "@/hooks/useAdminApi";
import type { ContentDocumentItem, ContentInventorySummary } from "@/lib/admin/content-inventory";
import { cabinetCardClass, cabinetStatCardClass } from "@/lib/cabinet-ui";

type ContentResponse = ContentInventorySummary;

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

export default function ContentDocumentsView() {
  const { data, loading, error, refresh } = useAdminApi<ContentResponse>("/api/admin/content");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ContentDocumentItem["type"] | "all">("all");

  const filtered = useMemo(() => {
    const docs = data?.documents ?? [];
    const query = search.trim().toLowerCase();
    return docs.filter((doc) => {
      if (typeFilter !== "all" && doc.type !== typeFilter) return false;
      if (!query) return true;
      return doc.title.toLowerCase().includes(query) || doc.id.toLowerCase().includes(query);
    });
  }, [data?.documents, search, typeFilter]);

  return (
    <CapabilityGate capability="content.edit">
      <AdminPageShell>
        <AdminPageHeader
          title="Документы контента"
          subtitle="Обзор статей, путеводителя, направлений и мест (файловый контент до CMS v1.2)"
          actions={
            <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
              Обновить
            </Button>
          }
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {data?.counts ? (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Статьи", value: data.counts.blogPublished },
              { label: "В плане", value: data.counts.blogPlanned },
              { label: "Путеводитель", value: data.counts.guideTopics },
              { label: "Направления", value: data.counts.destinations },
              { label: "Места", value: data.counts.places },
            ].map((item) => (
              <div key={item.label} className={cabinetStatCardClass}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate">{item.label}</p>
                <p className="mt-2 font-heading text-2xl font-bold text-charcoal">{item.value}</p>
              </div>
            ))}
          </section>
        ) : null}

        <section className={`${cabinetCardClass} space-y-4 p-4 sm:p-6`}>
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
