import { MapPinned, Moon, Plane, Route, ShieldCheck } from "lucide-react";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import { cn } from "@/lib/cn";
import type { SiteDesignGlobal } from "@/types/site-globals";

type SiteDesignPreviewProps = {
  values: Partial<SiteDesignGlobal> | Record<string, unknown>;
};

type PalettePreset = "argentina" | "patagonia" | "wine";
type HeadingFont = "unbounded" | "serif" | "system";
type HeaderVariant = "floating" | "compact";
type FooterVariant = "light" | "mist";

const PALETTES: Record<PalettePreset, {
  label: string;
  accentClass: string;
  softClass: string;
  swatches: ReadonlyArray<{ label: string; className: string }>;
}> = {
  argentina: {
    label: "Argentina",
    accentClass: "bg-sky-ink",
    softClass: "bg-sky/10",
    swatches: [
      { label: "Серый фон", className: "bg-page-band" },
      { label: "Небесно-голубой", className: "bg-sky" },
      { label: "Графитовый", className: "bg-charcoal" },
      { label: "Белый", className: "bg-white" },
    ],
  },
  patagonia: {
    label: "Patagonia",
    accentClass: "bg-patagonia",
    softClass: "bg-patagonia/10",
    swatches: [
      { label: "Серый фон", className: "bg-page-band" },
      { label: "Приглушённый зелёный", className: "bg-patagonia" },
      { label: "Светлый зелёный", className: "bg-patagonia/20" },
      { label: "Белый", className: "bg-white" },
    ],
  },
  wine: {
    label: "Wine",
    accentClass: "bg-wine",
    softClass: "bg-wine/10",
    swatches: [
      { label: "Серый фон", className: "bg-page-band" },
      { label: "Приглушённый бордовый", className: "bg-wine" },
      { label: "Светлый бордовый", className: "bg-wine/20" },
      { label: "Белый", className: "bg-white" },
    ],
  },
};

const FONT_LABELS: Record<HeadingFont, string> = {
  unbounded: "Фирменный",
  serif: "Книжный",
  system: "Системный",
};

const HEADER_LABELS: Record<HeaderVariant, string> = {
  floating: "Воздушная",
  compact: "Компактная",
};

const FOOTER_LABELS: Record<FooterVariant, string> = {
  light: "Светлый",
  mist: "Голубой туман",
};

function readPreset<T extends string>(
  values: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = values[key];
  return typeof value === "string" && allowed.includes(value as T) ? value as T : fallback;
}

function readBoolean(values: Record<string, unknown>, key: string, fallback: boolean): boolean {
  return typeof values[key] === "boolean" ? values[key] as boolean : fallback;
}

export default function SiteDesignPreview({ values }: SiteDesignPreviewProps) {
  const designValues = values as Record<string, unknown>;
  const palettePreset = readPreset(designValues, "palettePreset", ["argentina", "patagonia", "wine"], "argentina");
  const headingFont = readPreset(designValues, "headingFont", ["unbounded", "serif", "system"], "unbounded");
  const headerVariant = readPreset(designValues, "headerVariant", ["floating", "compact"], "floating");
  const footerVariant = readPreset(designValues, "footerVariant", ["light", "mist"], "light");
  const showUtilityBar = readBoolean(designValues, "showUtilityBar", false);
  const showHeaderMapButton = readBoolean(designValues, "showHeaderMapButton", true);
  const showThemeToggle = readBoolean(designValues, "showThemeToggle", true);
  const showFooterNewsletter = readBoolean(designValues, "showFooterNewsletter", true);
  const showFooterRouteCta = readBoolean(designValues, "showFooterRouteCta", true);
  const palette = PALETTES[palettePreset];
  const headingClass = headingFont === "unbounded"
    ? "font-display"
    : headingFont === "serif"
      ? "font-editorial"
      : "font-heading";

  const previewDescription = `${palette.label}, ${FONT_LABELS[headingFont]}, шапка «${HEADER_LABELS[headerVariant]}», футер «${FOOTER_LABELS[footerVariant]}»`;

  return (
    <section className={cn(cabinetCardClass, "space-y-5 p-5")} aria-labelledby="site-design-preview-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-ink">Живой просмотр</p>
          <h2 id="site-design-preview-title" className="mt-1 font-heading text-lg font-bold text-foreground">
            Как будет выглядеть сайт
          </h2>
          <p className="mt-1 text-sm text-muted">{previewDescription}</p>
        </div>
        <div className="inline-flex max-w-md items-start gap-2 rounded-xl border border-sky/20 bg-sky/[0.06] px-3 py-2 text-xs leading-relaxed text-slate">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-ink" aria-hidden />
          Доступны только проверенные пресеты: они сохраняют читаемость, контраст и привычную структуру сайта.
        </div>
      </div>

      <div aria-live="polite" aria-atomic="true">
        <p className="sr-only">Предпросмотр обновлён: {previewDescription}</p>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-muted">Палитра</span>
          <ul className="flex items-center gap-2" aria-label={`Палитра ${palette.label}`}>
            {palette.swatches.map((swatch) => (
              <li key={swatch.label}>
                <span
                  className={cn("block h-7 w-7 rounded-full border border-charcoal/10 shadow-sm", swatch.className)}
                  title={swatch.label}
                  aria-label={swatch.label}
                  role="img"
                />
              </li>
            ))}
          </ul>
        </div>

        <div className={cn("overflow-hidden border border-border-subtle bg-white shadow-card", headerVariant === "floating" ? "rounded-panel p-3" : "rounded-xl")}>
          {showUtilityBar ? (
            <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2 text-[10px] text-muted">
              <span>Откройте Аргентину вместе с нами</span>
              <span>Связаться с нами ↗</span>
            </div>
          ) : null}

          <header className={cn("flex min-h-14 items-center gap-3 px-3", headerVariant === "floating" && "rounded-xl bg-surface-elevated shadow-sm")}>
            <div className="flex min-w-0 items-center gap-2">
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white", palette.accentClass)}>
                <Plane className="h-4 w-4" aria-hidden />
              </span>
              <span className="truncate text-sm font-semibold text-foreground">Пора в Аргентину</span>
            </div>
            <nav className="ml-auto hidden items-center gap-4 text-xs text-muted sm:flex" aria-label="Пример навигации">
              <span>Регионы</span>
              <span>Туры</span>
              <span>Путеводитель</span>
            </nav>
            {showHeaderMapButton ? (
              <span className={cn("ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-white sm:ml-0", palette.accentClass)}>
                <MapPinned className="h-3.5 w-3.5" aria-hidden />
                Карта
              </span>
            ) : null}
            {showThemeToggle ? (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-charcoal/[0.06] text-charcoal ring-1 ring-charcoal/10">
                <Moon className="h-3.5 w-3.5" aria-hidden />
              </span>
            ) : null}
          </header>

          <main className={cn("border-y border-border-subtle px-5 py-8", palette.softClass)}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Пример страницы</p>
            <p className={cn("mt-2 max-w-xl text-2xl font-bold leading-tight text-charcoal sm:text-3xl", headingClass)}>
              Аргентина ближе, чем кажется
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate">
              Спокойная основа, тематические фотографии и понятные действия для планирования путешествия.
            </p>
          </main>

          <footer className={cn("space-y-3 px-5 py-5", footerVariant === "mist" ? "bg-sky/10" : "bg-page-band")}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold text-charcoal">Пора в Аргентину</span>
              <span className="text-[11px] text-muted">Туры · Путеводитель · Контакты</span>
            </div>
            {showFooterNewsletter ? (
              <div className="flex min-h-10 items-center justify-between gap-3 rounded-xl border border-border-subtle bg-white px-3 text-xs text-muted">
                <span>Новости и советы без спама</span>
                <span className={cn("rounded-lg px-2.5 py-1.5 font-semibold text-white", palette.accentClass)}>Подписаться</span>
              </div>
            ) : null}
            {showFooterRouteCta ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-white/80 px-3 py-2.5">
                <span className="text-xs font-medium text-charcoal">Не знаете, с чего начать?</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-ink">
                  <Route className="h-3.5 w-3.5" aria-hidden />
                  Подобрать маршрут
                </span>
              </div>
            ) : null}
          </footer>
        </div>
      </div>
    </section>
  );
}
