"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CmsMediaPathField from "@/components/admin/CmsMediaPathField";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import {
  SEO_DESCRIPTION_IDEAL_MAX,
  SEO_TITLE_IDEAL_MAX,
  buildDefaultSeoDescription,
  buildDefaultSeoTitle,
  seoDescriptionStatus,
  seoStatusClassName,
  seoStatusLabel,
  seoTitleStatus,
} from "@/lib/cms/seo-utils";
import { useSiteBrandName } from "@/hooks/useSiteBrandName";
import type { CmsDocumentSeo } from "@/types/cms-content";

type Props = {
  pageTitle: string;
  excerpt?: string;
  seo: CmsDocumentSeo;
  onChange: (seo: CmsDocumentSeo) => void;
  /** Override brand from globals (e.g. in tests). */
  siteBrandName?: string;
  publicPath?: string;
};

function StatusBadge({ label, status }: { label: string; status: ReturnType<typeof seoTitleStatus> }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${seoStatusClassName(status)}`}>
      {label}: {seoStatusLabel(status)}
    </span>
  );
}

export default function CmsSeoPanel({
  pageTitle,
  excerpt = "",
  seo,
  onChange,
  siteBrandName: siteBrandNameProp,
  publicPath,
}: Props) {
  const siteBrandNameFromGlobals = useSiteBrandName();
  const siteBrandName = siteBrandNameProp ?? siteBrandNameFromGlobals;

  const title = seo.title ?? "";
  const description = seo.description ?? "";
  const image = seo.image ?? "";

  const titleStatus = useMemo(() => seoTitleStatus(title), [title]);
  const descriptionStatus = useMemo(() => seoDescriptionStatus(description), [description]);

  const defaultTitle = useMemo(
    () => buildDefaultSeoTitle(pageTitle, siteBrandName),
    [pageTitle, siteBrandName]
  );

  const previewTitle = title.trim() || pageTitle.trim() || "Заголовок страницы";
  const previewDescription =
    description.trim() ||
    excerpt.trim() ||
    "Добавьте описание для сниппета в поиске — 70–160 символов.";

  const previewUrl =
    publicPath ??
    (typeof window !== "undefined" ? window.location.origin : "https://www.goargentina.ru");

  function autoGenerate() {
    onChange({
      title: buildDefaultSeoTitle(pageTitle, siteBrandName),
      description: buildDefaultSeoDescription(excerpt, pageTitle),
      image: seo.image,
    });
  }

  return (
    <section className={`${cabinetCardClass} space-y-4 p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-heading text-sm font-bold text-charcoal">SEO</h2>
          <p className="mt-1 text-xs text-slate">
            Бренд в title: <span className="font-medium text-charcoal">{siteBrandName}</span>
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={autoGenerate}>
          <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Автозаполнение
        </Button>
      </div>

      <div className="space-y-3">
        <label className="block space-y-1 text-sm">
          <span className="flex flex-wrap items-center gap-2 text-slate">
            Meta title
            <StatusBadge label="Title" status={titleStatus} />
            <span className="text-[11px] text-slate">
              {title.length}/{SEO_TITLE_IDEAL_MAX}
            </span>
          </span>
          <Input
            value={title}
            onChange={(e) => onChange({ ...seo, title: e.target.value })}
            placeholder={defaultTitle}
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="flex flex-wrap items-center gap-2 text-slate">
            Meta description
            <StatusBadge label="Description" status={descriptionStatus} />
            <span className="text-[11px] text-slate">
              {description.length}/{SEO_DESCRIPTION_IDEAL_MAX}
            </span>
          </span>
          <textarea
            className="min-h-[88px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-charcoal"
            value={description}
            onChange={(e) => onChange({ ...seo, description: e.target.value })}
            placeholder="Краткое описание для поисковых систем"
          />
        </label>

        <CmsMediaPathField
          label="OG image"
          value={image}
          onChange={(next) => onChange({ ...seo, image: next })}
        />
      </div>

      <div className="rounded-xl border border-gray-100 bg-surface-muted/40 p-3">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate">Предпросмотр</p>
        <p className="truncate text-xs text-emerald-700">{previewUrl}</p>
        <p className="mt-1 line-clamp-1 text-base text-[#1a0dab]">{previewTitle}</p>
        <p className="mt-1 line-clamp-2 text-sm leading-snug text-[#4d5156]">{previewDescription}</p>
      </div>
    </section>
  );
}
