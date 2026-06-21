"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Pin } from "lucide-react";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { NativeSelect } from "@/components/ui/native-select";
import { SafeImage } from "@/components/ui/safe-image";
import manifestData from "@/data/media-library/manifest.json";
import { mediaUrl } from "@/lib/media-resolver";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { MediaAsset, MediaCategory, MediaSource } from "@/types/media-asset";

const MANIFEST_PATH = "src/data/media-library/manifest.json";

type ManifestData = { version: number; assets: MediaAsset[] };

function linkedPageId(asset: MediaAsset): string | null {
  if (asset.articleId) return `rich:${asset.articleId}`;
  if (asset.blogPostSlug) return `blog:${asset.blogPostSlug}`;
  if (asset.immigrationTopicId) return `immigration:${asset.immigrationTopicId}`;
  if (asset.servicePageId) return `service:${asset.servicePageId}`;
  if (asset.podborRegionId) return `podbor:region:${asset.podborRegionId}`;
  if (asset.podborThemeId) return `podbor:theme:${asset.podborThemeId}`;
  if (asset.shopProductId) return `shop:${asset.shopProductId}`;
  if (asset.guideTopicId) return `guide:${asset.guideTopicId}`;
  if (asset.destinationId) return `destination:${asset.destinationId}`;
  if (asset.placeId) return `place:${asset.placeId}`;
  if (asset.tourSlug) return `tour:${asset.tourSlug}`;
  return null;
}

function sourceLabel(source: MediaSource): string {
  const labels: Record<MediaSource, string> = {
    unsplash: "Unsplash",
    pexels: "Pexels",
    wikimedia: "Wikimedia",
    wikipedia: "Wikipedia",
    openstreetmap: "OSM",
    local: "Локально",
  };
  return labels[source] ?? source;
}

export default function MediaLibraryView() {
  const assets = (manifestData as ManifestData).assets;
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<MediaSource | "all">("all");
  const [category, setCategory] = useState<MediaCategory | "all">("all");

  const categories = useMemo(() => {
    return [...new Set(assets.map((a) => a.category))].sort();
  }, [assets]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((asset) => {
      if (source !== "all" && asset.source !== source) return false;
      if (category !== "all" && asset.category !== category) return false;
      if (!q) return true;
      const haystack = [
        asset.id,
        asset.title,
        asset.alt,
        asset.author,
        asset.localPath,
        linkedPageId(asset),
        ...(asset.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [assets, query, source, category]);

  const stats = useMemo(() => {
    const bySource = new Map<string, number>();
    for (const a of assets) {
      bySource.set(a.source, (bySource.get(a.source) ?? 0) + 1);
    }
    return {
      total: assets.length,
      pinned: assets.filter((a) => a.pinned).length,
      stock: assets.filter((a) => a.source === "unsplash" || a.source === "pexels").length,
      bySource,
    };
  }, [assets]);

  return (
    <CapabilityGate capability="content.edit">
      <AdminPageShell>
        <AdminPageHeader
          title="Медиатека"
          subtitle={`${stats.total} assets в manifest — read-only браузер`}
        />

        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          <div className={cabinetCardClass}>
            <p className="text-xs text-slate">Всего</p>
            <p className="text-2xl font-bold text-charcoal">{stats.total}</p>
          </div>
          <div className={cabinetCardClass}>
            <p className="text-xs text-slate">Stock (Unsplash/Pexels)</p>
            <p className="text-2xl font-bold text-charcoal">{stats.stock}</p>
          </div>
          <div className={cabinetCardClass}>
            <p className="text-xs text-slate">Wikimedia</p>
            <p className="text-2xl font-bold text-charcoal">
              {stats.bySource.get("wikimedia") ?? 0}
            </p>
          </div>
          <div className={cabinetCardClass}>
            <p className="text-xs text-slate">Закреплено (pinned)</p>
            <p className="text-2xl font-bold text-charcoal">{stats.pinned}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по id, alt, автору, pageId…"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
          <NativeSelect
            value={source}
            onChange={(e) => setSource(e.target.value as MediaSource | "all")}
            className="sm:w-44"
          >
            <option value="all">Все источники</option>
            <option value="unsplash">Unsplash</option>
            <option value="pexels">Pexels</option>
            <option value="wikimedia">Wikimedia</option>
            <option value="local">Локально</option>
          </NativeSelect>
          <NativeSelect
            value={category}
            onChange={(e) => setCategory(e.target.value as MediaCategory | "all")}
            className="sm:w-44"
          >
            <option value="all">Все категории</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </NativeSelect>
        </div>

        <p className="mb-4 text-sm text-slate">
          Manifest: <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">{MANIFEST_PATH}</code>
          {" · "}
          Замена изображений — TODO (upload / stock search)
        </p>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-surface-muted/60">
                <th className="px-3 py-3 font-medium text-charcoal">Превью</th>
                <th className="px-3 py-3 font-medium text-charcoal">ID / роль</th>
                <th className="px-3 py-3 font-medium text-charcoal">Источник</th>
                <th className="px-3 py-3 font-medium text-charcoal">Автор</th>
                <th className="px-3 py-3 font-medium text-charcoal">Страница</th>
                <th className="px-3 py-3 font-medium text-charcoal">Путь</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((asset) => {
                const pageId = linkedPageId(asset);
                return (
                  <tr key={asset.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-3 py-2">
                      <div className="relative h-14 w-20 overflow-hidden rounded-lg bg-gray-100">
                        <SafeImage
                          src={mediaUrl(asset.localPath)}
                          alt={asset.alt}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-mono text-xs text-charcoal">{asset.id}</p>
                      <p className="text-xs text-slate">
                        {asset.role}
                        {asset.pinned ? (
                          <Pin className="ml-1 inline h-3 w-3 text-amber-600" aria-label="pinned" />
                        ) : null}
                      </p>
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                        {sourceLabel(asset.source)}
                      </span>
                      {asset.sourceUrl ? (
                        <a
                          href={asset.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 inline-flex text-sky hover:underline"
                          aria-label="Источник"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate">{asset.author ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate">{pageId ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-slate">{asset.localPath}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length > 200 ? (
          <p className="mt-3 text-sm text-slate">
            Показаны первые 200 из {filtered.length}. Уточните поиск.
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate">Найдено: {filtered.length}</p>
        )}

        <p className="mt-6 text-xs text-slate">
          Обновление manifest:{" "}
          <code className="rounded bg-gray-100 px-1">npm run warm-image-cache</code>
          {" · "}
          Аудит: <code className="rounded bg-gray-100 px-1">npm run page-image-audit</code>
        </p>
      </AdminPageShell>
    </CapabilityGate>
  );
}
