"use client";

import { useState, useMemo, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { motionClass } from "@/lib/motion";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import {
  LANGUAGES,
  CURRENCIES,
  POPULAR_CURRENCIES,
} from "@/data/locale-config";
import { addLocalePrefix } from "@/lib/i18n/locale-path";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useSiteHeaderOverlayLock } from "@/hooks/useSiteHeaderOverlayLock";
import { trackLocaleSwitch } from "@/lib/analytics/gtm-events";
import { CurrencyCode, LocaleCode } from "@/types/locale";

type Tab = "language" | "currency";

function SwitcherPanel({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, currency, setLocale, setCurrency, t } = useLocaleCurrency();
  const [tab, setTab] = useState<Tab>("language");
  const [search, setSearch] = useState("");

  const filteredLanguages = useMemo(() => {
    if (!search.trim()) return LANGUAGES;
    const q = search.toLowerCase();
    return LANGUAGES.filter(
      (l) =>
        l.label.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q)
    );
  }, [search]);

  const filteredCurrencies = useMemo(() => {
    if (!search.trim()) return CURRENCIES;
    const q = search.toLowerCase();
    return CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        Object.values(c.name).some((n) => n.toLowerCase().includes(q))
    );
  }, [search]);

  const popular = CURRENCIES.filter((c) =>
    POPULAR_CURRENCIES.includes(c.code as (typeof POPULAR_CURRENCIES)[number])
  );

  const otherCurrencies = CURRENCIES.filter(
    (c) => !POPULAR_CURRENCIES.includes(c.code as (typeof POPULAR_CURRENCIES)[number])
  );

  function selectLanguage(code: LocaleCode) {
    if (code !== locale) {
      trackLocaleSwitch({ from: locale, to: code, path: pathname });
    }
    setLocale(code);
    router.push(addLocalePrefix(pathname, code));
    onClose?.();
  }

  function selectCurrency(code: CurrencyCode) {
    setCurrency(code);
    onClose?.();
  }

  return (
    <div className="flex flex-col">
      <div className="m-4 mb-3 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => {
            setTab("language");
            setSearch("");
          }}
          className={cn(
            "rounded-lg px-3 py-2.5 text-left transition-all duration-200",
            tab === "language" ? "bg-white shadow-sm" : "hover:bg-white/50"
          )}
        >
          <p className="text-xs text-slate">{t("locale.language")}</p>
          <p className="text-sm font-semibold uppercase text-charcoal">{locale}</p>
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("currency");
            setSearch("");
          }}
          className={cn(
            "rounded-lg px-3 py-2.5 text-left transition-all duration-200",
            tab === "currency" ? "bg-white shadow-sm" : "hover:bg-white/50"
          )}
        >
          <p className="text-xs text-slate">{t("locale.currency")}</p>
          <p className="text-sm font-semibold text-charcoal">{currency}</p>
        </button>
      </div>

      <p className="px-4 pb-3 text-xs leading-relaxed text-slate">
        {tab === "language" ? t("locale.languageHint") : t("locale.currencyHint")}
      </p>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
          <Input
            placeholder={t("locale.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-transparent bg-gray-50 pl-10 focus:bg-white"
          />
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto px-2 pb-2">
        {tab === "language" &&
          filteredLanguages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => selectLanguage(lang.code)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-gray-50"
            >
              <span className="text-xl">{lang.flag}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-charcoal">
                  {lang.nativeName}{" "}
                  <span className="font-normal text-slate">({lang.code.toUpperCase()})</span>
                </p>
              </div>
              {locale === lang.code && (
                <Check className="h-5 w-5 shrink-0 text-brand" />
              )}
            </button>
          ))}

        {tab === "currency" && !search && (
          <>
            {popular.map((cur) => (
              <CurrencyRow
                key={cur.code}
                cur={cur}
                locale={locale}
                selected={currency === cur.code}
                onSelect={() => selectCurrency(cur.code)}
              />
            ))}
            <div className="my-2 border-t border-gray-100" />
            {otherCurrencies.map((cur) => (
              <CurrencyRow
                key={cur.code}
                cur={cur}
                locale={locale}
                selected={currency === cur.code}
                onSelect={() => selectCurrency(cur.code)}
              />
            ))}
          </>
        )}

        {tab === "currency" &&
          search &&
          filteredCurrencies.map((cur) => (
            <CurrencyRow
              key={cur.code}
              cur={cur}
              locale={locale}
              selected={currency === cur.code}
              onSelect={() => selectCurrency(cur.code)}
            />
          ))}
      </div>
    </div>
  );
}

function CurrencyRow({
  cur,
  locale,
  selected,
  onSelect,
}: {
  cur: (typeof CURRENCIES)[0];
  locale: LocaleCode;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-gray-50"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm text-charcoal">
          <span className="font-semibold">{cur.code}</span>
          <span className="text-slate"> — {cur.name[locale]} — {cur.symbol}</span>
        </p>
      </div>
      {selected && <Check className="h-5 w-5 shrink-0 text-brand" />}
    </button>
  );
}

export default function LocaleCurrencySwitcher({
  variant = "default",
}: {
  variant?: "default" | "compact" | "header";
}) {
  const { locale, language, currencyInfo, ready, t } = useLocaleCurrency();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);

  useSiteHeaderOverlayLock(mobileOpen);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const triggerLabel =
    variant === "header" ? (
      <>
        <span className="text-sm leading-none" aria-hidden>
          {language.flag}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-charcoal">
          {locale}
        </span>
        <span className="text-[10px] font-medium text-slate" aria-hidden>
          ·
        </span>
        <span className="text-[10px] font-semibold text-charcoal">{currencyInfo.code}</span>
        <ChevronDown className="h-3 w-3 shrink-0 text-slate" aria-hidden />
      </>
    ) : variant === "compact" ? (
      <>
        <span className="text-base leading-none">{language.flag}</span>
        <span className="hidden text-[11px] font-semibold uppercase tracking-wide text-charcoal min-[420px]:inline">
          {locale}
        </span>
        <span className="hidden h-3 w-px bg-charcoal/10 min-[420px]:inline" />
        <span className="hidden text-[11px] font-semibold text-charcoal min-[420px]:inline">
          {currencyInfo.code}
        </span>
      </>
    ) : (
      <>
        <span className="text-base leading-none">{language.flag}</span>
        <span className="hidden sm:inline">{language.nativeName}</span>
        <span className="text-gray-300">|</span>
        <span className="font-semibold">{currencyInfo.code}</span>
      </>
    );

  const triggerClassName =
    variant === "header"
      ? "flex h-8 items-center gap-1 rounded-full bg-charcoal/[0.04] px-2 text-charcoal ring-1 ring-charcoal/10 transition-colors hover:bg-sky/5 hover:ring-sky/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 sm:px-2.5"
      : variant === "compact"
        ? "flex h-9 items-center gap-1.5 rounded-full bg-charcoal/[0.04] px-2.5 text-charcoal ring-1 ring-charcoal/10 transition-colors hover:bg-sky/5 hover:ring-sky/25 sm:gap-2 sm:px-3"
        : "flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-charcoal transition-all duration-200 hover:border-brand/40 hover:bg-brand-light/30";

  const triggerAriaLabel = `${t("locale.language")}: ${language.nativeName}. ${t("locale.currency")}: ${currencyInfo.code}`;

  if (!ready) {
    return (
      <div
        className={cn(
          "animate-pulse rounded-full bg-gray-100",
          // header/compact видимы только с sm — скелетон повторяет финальную видимость, иначе шапка меняет высоту (CLS)
          variant === "header"
            ? "hidden h-8 w-[5.5rem] sm:block"
            : variant === "compact"
              ? "hidden h-9 w-[7.5rem] sm:block"
              : "h-10 w-28 rounded-xl"
        )}
      />
    );
  }

  return (
    <>
      <div className={variant === "compact" ? "hidden sm:block" : variant === "header" ? "hidden sm:block" : "hidden md:block"}>
        <Popover open={desktopOpen} onOpenChange={(open) => setDesktopOpen(open)}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={triggerClassName}
              aria-label={triggerAriaLabel}
            >
              {triggerLabel}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[380px] overflow-hidden p-0"
            align="end"
            sideOffset={8}
          >
            <SwitcherPanel onClose={() => setDesktopOpen(false)} />
          </PopoverContent>
        </Popover>
      </div>

      <div className={variant === "compact" || variant === "header" ? "hidden" : "md:hidden"}>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 items-center gap-2 rounded-full bg-charcoal/[0.04] px-3 text-charcoal ring-1 ring-charcoal/10"
          aria-label={triggerAriaLabel}
        >
          {triggerLabel}
        </button>

        {mobileOpen && (
          <>
            <div
              className={cn(
                "fixed inset-0 z-[60] bg-charcoal/40 backdrop-blur-sm",
                motionClass.enterOverlay
              )}
              onClick={() => setMobileOpen(false)}
            />
            <div
              className={cn(
                "fixed inset-x-0 bottom-0 z-[70] max-h-[min(85dvh,calc(100dvh-env(keyboard-inset-height,0px)-1rem))] overflow-hidden rounded-t-3xl bg-white shadow-2xl",
                motionClass.enterSheet
              )}
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <p className="font-semibold text-charcoal">{t("locale.title")}</p>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <SwitcherPanel onClose={() => setMobileOpen(false)} />
            </div>
          </>
        )}
      </div>
    </>
  );
}
