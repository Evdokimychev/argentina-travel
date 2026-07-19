import { DEFAULT_SITE_BLOG, DEFAULT_SITE_COMMERCE } from "@/lib/cms/site-globals/normalize";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { SiteBlogGlobal, SiteCommerceGlobal } from "@/types/site-globals";

function asBlogSettings(values: Record<string, unknown>): SiteBlogGlobal {
  return { ...DEFAULT_SITE_BLOG, ...values } as SiteBlogGlobal;
}

function asCommerceSettings(values: Record<string, unknown>): SiteCommerceGlobal {
  return { ...DEFAULT_SITE_COMMERCE, ...values } as SiteCommerceGlobal;
}

function PreviewStatus({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        enabled ? "bg-emerald-50 text-emerald-700" : "bg-surface-muted text-slate line-through"
      }`}
    >
      {children}
    </span>
  );
}

export default function SiteCompositionPreview({
  blogValues,
  commerceValues,
}: {
  blogValues: Record<string, unknown>;
  commerceValues: Record<string, unknown>;
}) {
  const blog = asBlogSettings(blogValues);
  const commerce = asCommerceSettings(commerceValues);
  const catalogColumns = Number(commerce.catalogColumns);

  return (
    <section className={`${cabinetCardClass} space-y-5 p-5`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-ink">
          Предпросмотр состава страниц
        </p>
        <h2 className="mt-1 font-heading text-lg font-bold text-foreground">
          Что увидит посетитель
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate">
          Это схематичный предпросмотр. Он показывает структуру и видимость блоков; точный контент
          берётся из опубликованных статей и товаров.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-border-subtle bg-surface-muted/50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Страница статьи</p>
              <p className="mt-1 text-xs text-slate">
                Похожие материалы: до {blog.relatedPostsCount}
              </p>
            </div>
            <span className="rounded-full bg-sky/10 px-2.5 py-1 text-xs font-medium text-sky-ink">
              Журнал
            </span>
          </div>
          <div className="mt-4 space-y-2 rounded-xl border border-border-subtle bg-white p-3 dark:bg-surface-elevated">
            <div className="h-2.5 w-2/3 rounded-full bg-charcoal/15" />
            <div className="h-2 w-full rounded-full bg-charcoal/8" />
            <div className="h-2 w-5/6 rounded-full bg-charcoal/8" />
            <div className="mt-3 h-20 rounded-lg bg-sky/10" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <PreviewStatus enabled={blog.showShare}>Поделиться</PreviewStatus>
            <PreviewStatus enabled={blog.showComments}>Комментарии</PreviewStatus>
            <PreviewStatus enabled={blog.showAuthor}>Автор</PreviewStatus>
            <PreviewStatus enabled={blog.showPrevNext}>Навигация</PreviewStatus>
            <PreviewStatus enabled={blog.showRelatedPosts}>Похожие статьи</PreviewStatus>
            <PreviewStatus enabled={blog.showNewsletter}>Подписка</PreviewStatus>
          </div>
        </article>

        <article className="rounded-2xl border border-border-subtle bg-surface-muted/50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Каталог и товар</p>
              <p className="mt-1 text-xs text-slate">
                {commerce.catalogPageSize} товаров на странице, {catalogColumns} колонки
              </p>
            </div>
            <span className="rounded-full bg-sun/15 px-2.5 py-1 text-xs font-medium text-charcoal">
              Магазин
            </span>
          </div>
          <div
            className="mt-4 grid gap-2"
            style={{ gridTemplateColumns: `repeat(${catalogColumns}, minmax(0, 1fr))` }}
            aria-label={`Предпросмотр каталога: ${catalogColumns} колонки`}
          >
            {Array.from({ length: catalogColumns }).map((_, index) => (
              <div key={index} className="rounded-lg border border-border-subtle bg-white p-2 dark:bg-surface-elevated">
                <div className="aspect-[4/3] rounded-md bg-sky/10" />
                <div className="mt-2 h-2 w-4/5 rounded-full bg-charcoal/15" />
                <div className="mt-1 h-1.5 w-1/2 rounded-full bg-charcoal/8" />
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <PreviewStatus enabled={commerce.showCatalogIntro}>Введение</PreviewStatus>
            <PreviewStatus enabled={commerce.showProductFormat}>Формат</PreviewStatus>
            <PreviewStatus enabled={commerce.showProductPrice}>Цена</PreviewStatus>
            <PreviewStatus enabled={commerce.showProductQuestions}>Вопрос</PreviewStatus>
            <PreviewStatus enabled={commerce.showRelatedProducts}>
              Сопутствующие: {commerce.relatedProductsCount}
            </PreviewStatus>
          </div>
        </article>
      </div>
    </section>
  );
}
