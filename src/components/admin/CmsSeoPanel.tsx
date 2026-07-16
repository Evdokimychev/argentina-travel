"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import CmsMediaPathField from "@/components/admin/CmsMediaPathField";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import {
  SEO_DESCRIPTION_IDEAL_MAX,
  SEO_TITLE_IDEAL_MAX,
  buildDefaultSeoDescription,
  buildDefaultSeoTitle,
  isCmsDocumentNoIndex,
  seoCanonicalError,
  seoDescriptionStatus,
  seoImageError,
  seoStatusClassName,
  seoStatusLabel,
  seoTitleStatus,
} from "@/lib/cms/seo-utils";
import { useSiteBrandName } from "@/hooks/useSiteBrandName";
import type { CmsDocumentSeo, CmsDocumentStatus } from "@/types/cms-content";

type Props = {
  pageTitle: string;
  excerpt?: string;
  seo: CmsDocumentSeo;
  onChange: (seo: CmsDocumentSeo) => void;
  /** Override brand from globals (e.g. in tests). */
  siteBrandName?: string;
  publicPath?: string;
  documentStatus?: CmsDocumentStatus;
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
  documentStatus = "draft",
}: Props) {
  const siteBrandNameFromGlobals = useSiteBrandName();
  const siteBrandName = siteBrandNameProp ?? siteBrandNameFromGlobals;

  const title = seo.title ?? "";
  const description = seo.description ?? "";
  const image = seo.image ?? "";
  const canonical = seo.canonical ?? "";

  const titleStatus = useMemo(() => seoTitleStatus(title), [title]);
  const descriptionStatus = useMemo(() => seoDescriptionStatus(description), [description]);
  const canonicalError = useMemo(() => seoCanonicalError(canonical), [canonical]);
  const imageError = useMemo(() => seoImageError(image), [image]);

  const defaultTitle = useMemo(
    () => buildDefaultSeoTitle(pageTitle, siteBrandName),
    [pageTitle, siteBrandName]
  );

  const previewTitle = title.trim() || defaultTitle || "Заголовок страницы";
  const previewDescription =
    description.trim() ||
    buildDefaultSeoDescription(excerpt, pageTitle) ||
    "Добавьте описание для сниппета в поиске — 70–160 символов.";

  const previewUrl = canonical.trim() && !canonicalError
    ? canonical.trim()
    : publicPath ?? "https://www.goargentina.ru";
  const effectiveNoIndex = isCmsDocumentNoIndex(documentStatus, seo.noIndex);

  function autoGenerate() {
    onChange({
      title: buildDefaultSeoTitle(pageTitle, siteBrandName),
      description: buildDefaultSeoDescription(excerpt, pageTitle),
      image: seo.image,
      canonical: seo.canonical,
      noIndex: seo.noIndex,
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
            Заголовок для поиска (title)
            <StatusBadge label="Заголовок" status={titleStatus} />
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
            Описание для поиска
            <StatusBadge label="Описание" status={descriptionStatus} />
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
          label="Изображение для соцсетей"
          hint="Рекомендуемый размер — 1200 × 630 пикселей"
          value={image}
          onChange={(next) => onChange({ ...seo, image: next })}
        />
        {imageError ? <p className="text-xs text-red-600">{imageError}</p> : null}

        <label className="block space-y-1 text-sm">
          <span className="text-slate">Канонический адрес (canonical)</span>
          <Input
            value={canonical}
            onChange={(event) => onChange({ ...seo, canonical: event.target.value })}
            placeholder={publicPath || "/путь-страницы"}
            className="font-mono text-xs"
            aria-invalid={Boolean(canonicalError)}
            aria-describedby={canonicalError ? "cms-seo-canonical-error" : "cms-seo-canonical-hint"}
          />
          {canonicalError ? (
            <span id="cms-seo-canonical-error" className="block text-xs text-red-600">
              {canonicalError}
            </span>
          ) : (
            <span id="cms-seo-canonical-hint" className="block text-xs text-slate">
              Оставьте пустым, чтобы использовать адрес этой страницы. Внешние домены запрещены.
            </span>
          )}
        </label>

        <label className="flex items-start gap-3 rounded-xl border border-gray-100 bg-surface-muted/30 p-3">
          <Checkbox
            checked={seo.noIndex === true}
            onCheckedChange={(checked) =>
              onChange({ ...seo, noIndex: checked === true ? true : undefined })
            }
            aria-describedby="cms-seo-noindex-hint"
          />
          <span>
            <span className="block text-sm font-medium text-charcoal">Запретить индексацию</span>
            <span id="cms-seo-noindex-hint" className="mt-0.5 block text-xs leading-relaxed text-slate">
              Используйте для служебных, временных или дублирующих страниц. Черновики и
              запланированные материалы закрыты до публикации автоматически.
            </span>
          </span>
        </label>
      </div>

      <div className="rounded-xl border border-gray-100 bg-surface-muted/40 p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate">
            Предпросмотр в поиске
          </p>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
              effectiveNoIndex
                ? "bg-amber-50 text-amber-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {effectiveNoIndex ? "Индексация закрыта" : "Индексация разрешена"}
          </span>
        </div>
        <p className="truncate text-xs text-emerald-700">{previewUrl}</p>
        <p className="mt-1 line-clamp-1 text-base text-[#1a0dab]">{previewTitle}</p>
        <p className="mt-1 line-clamp-2 text-sm leading-snug text-[#4d5156]">{previewDescription}</p>
      </div>
    </section>
  );
}
