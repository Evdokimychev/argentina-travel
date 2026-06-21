"use client";

import { useMemo } from "react";
import { SafeImage } from "@/components/ui/safe-image";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import {
  SEO_DESCRIPTION_IDEAL_MAX,
  SEO_TITLE_IDEAL_MAX,
  seoDescriptionStatus,
  seoStatusClassName,
  seoStatusLabel,
  seoTitleStatus,
} from "@/lib/cms/seo-utils";
import { mediaUrl } from "@/lib/media-resolver";

type BrandingValues = {
  siteName?: string;
  defaultTitle?: string;
  defaultOgImage?: string;
};

type SeoValues = {
  defaultDescription?: string;
  allowIndexing?: boolean;
};

type Props = {
  branding: BrandingValues;
  seo: SeoValues;
  siteUrl?: string;
};

function StatusPill({
  label,
  status,
}: {
  label: string;
  status: ReturnType<typeof seoTitleStatus>;
}) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${seoStatusClassName(status)}`}>
      {label}: {seoStatusLabel(status)}
    </span>
  );
}

export default function SiteGlobalsSeoPreview({ branding, seo, siteUrl }: Props) {
  const title = branding.defaultTitle?.trim() || branding.siteName?.trim() || "Пора в Аргентину";
  const description =
    seo.defaultDescription?.trim() ||
    "Добавьте meta description в блоке «SEO по умолчанию».";

  const titleStatus = useMemo(() => seoTitleStatus(title), [title]);
  const descriptionStatus = useMemo(() => seoDescriptionStatus(description), [description]);

  const previewUrl = siteUrl ?? "https://www.goargentina.ru";
  const ogImage = branding.defaultOgImage?.trim();

  return (
    <section className={`${cabinetCardClass} space-y-4 p-5`}>
      <div>
        <h2 className="font-heading text-lg font-bold text-charcoal">Предпросмотр SEO сайта</h2>
        <p className="mt-1 text-sm text-slate">
          Как главная и fallback-страницы выглядят в поиске и соцсетях (паттерн Payload SEO plugin).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusPill label="Title" status={titleStatus} />
        <StatusPill label="Description" status={descriptionStatus} />
        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-slate">
          {title.length}/{SEO_TITLE_IDEAL_MAX} · {description.length}/{SEO_DESCRIPTION_IDEAL_MAX}
        </span>
        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-slate">
          Индексация: {seo.allowIndexing === false ? "выключена" : "разрешена"}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-surface-muted/40 p-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate">
            Сниппет Google
          </p>
          <p className="truncate text-xs text-emerald-700">{previewUrl}</p>
          <p className="mt-1 line-clamp-1 text-base text-[#1a0dab]">{title}</p>
          <p className="mt-1 line-clamp-3 text-sm leading-snug text-[#4d5156]">{description}</p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-surface-muted/40 p-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate">
            Open Graph
          </p>
          {ogImage ? (
            <div className="relative mb-2 aspect-[1200/630] w-full overflow-hidden rounded-lg bg-charcoal/5">
              <SafeImage
                src={mediaUrl(ogImage)}
                alt={branding.siteName ?? "OG preview"}
                fill
                className="object-cover"
                sizes="400px"
              />
            </div>
          ) : (
            <p className="mb-2 text-xs text-slate">OG image не задан — будет fallback.</p>
          )}
          <p className="line-clamp-1 text-sm font-medium text-charcoal">{title}</p>
          <p className="mt-1 line-clamp-2 text-xs text-slate">{description}</p>
        </div>
      </div>
    </section>
  );
}
