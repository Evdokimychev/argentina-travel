"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, Globe2, Sparkles, TrendingUp } from "lucide-react";
import {
  ACCESS_TYPE_LABELS,
  buildComparisonLadder,
  getPassportProfile,
  GLOBAL_RANK_LADDER,
  LATAM_COMPARISON,
  PASSPORT_PICKER_ORDER,
  PASSPORT_POWER_DISCLAIMER,
  PASSPORT_POWER_EDITION,
  PASSPORT_PROFILES,
  PEERS_COMPARISON,
  PRIMARY_PASSPORT_CODE,
  VISA_FREE_REGION_LABELS,
  type PassportAccessType,
  type PassportBenchmark,
  type PassportPickerCode,
  type PassportProfile,
  type VisaFreeRegion,
} from "@/data/argentina-passport-power";
import { useAnimatedValue, useRevealAnimation } from "@/hooks/useRevealAnimation";
import { cn } from "@/lib/cn";

type ComparisonTab = "latam" | "peers" | "global";

const COMPARISON_TABS: { id: ComparisonTab; label: string }[] = [
  { id: "latam", label: "Латинская Америка" },
  { id: "peers", label: "Сравнение" },
  { id: "global", label: "Мировой рейтинг" },
];

function PassportCover({ profile, revealed }: { profile: PassportProfile; revealed: boolean }) {
  const { cover, flag } = profile;

  return (
    <div
      className={cn(
        "relative mx-auto aspect-[1.58/1] w-full max-w-[280px] overflow-hidden rounded-2xl border border-white/60 transition-all duration-700 ease-out sm:max-w-none",
        revealed ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-[0.98]"
      )}
      style={{
        boxShadow: `0 20px 60px -12px ${cover.accentGlow}`,
      }}
      aria-hidden
    >
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: `linear-gradient(to bottom right, ${cover.gradientFrom}, ${cover.gradientVia}, ${cover.gradientTo})`,
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_40%,rgba(255,255,255,0.12)_50%,transparent_60%)]" />

      <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.15em] text-white/80">
              {cover.republicLine}
            </p>
            <p className="mt-1 font-heading text-lg font-bold tracking-wide text-white sm:text-xl">PASAPORTE</p>
          </div>
          <span className="text-2xl sm:text-3xl" aria-hidden>
            {flag}
          </span>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="h-2 w-24 rounded-full bg-white/25" />
            <div className="h-2 w-32 rounded-full bg-white/20" />
            <div className="h-2 w-20 rounded-full bg-white/15" />
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-sun/40 bg-gradient-to-br from-sun/90 to-sun-dark/90 shadow-[0_0_24px_rgba(252,191,73,0.35)]">
            <Sparkles className="h-6 w-6 text-white/95" strokeWidth={1.5} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PassportPicker({
  selected,
  onSelect,
}: {
  selected: PassportPickerCode;
  onSelect: (code: PassportPickerCode) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Выбор паспорта для сравнения">
      {PASSPORT_PICKER_ORDER.map((code) => {
        const profile = PASSPORT_PROFILES[code];
        const active = code === selected;

        return (
          <button
            key={code}
            type="button"
            onClick={() => onSelect(code)}
            aria-pressed={active}
            title={profile.country}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              active
                ? "border-sky/40 bg-sky text-white shadow-sm"
                : "border-gray-200/80 bg-white/80 text-charcoal hover:border-sky/25 hover:bg-sky/5"
            )}
          >
            <span className="text-base leading-none" aria-hidden>
              {profile.flag}
            </span>
            <span className="hidden sm:inline">{profile.country}</span>
            <span className="tabular-nums text-[10px] opacity-80 sm:hidden">#{profile.globalRank}</span>
          </button>
        );
      })}
    </div>
  );
}

function FreedomRing({
  percent,
  revealed,
  ringKey,
}: {
  percent: number;
  revealed: boolean;
  ringKey: string;
}) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative mx-auto h-36 w-36 sm:h-40 sm:w-40">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(116,172,223,0.12)" strokeWidth="10" />
        <circle
          key={ringKey}
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="url(#passportRingGradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={revealed ? offset : circumference}
          className="transition-[stroke-dashoffset] duration-[1.6s] ease-out"
        />
        <defs>
          <linearGradient id="passportRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#74acdf" />
            <stop offset="100%" stopColor="#fcbf49" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <Globe2 className="mb-1 h-5 w-5 text-sky/70" strokeWidth={1.5} aria-hidden />
        <p className="font-heading text-2xl font-bold tabular-nums text-charcoal sm:text-3xl">{percent}%</p>
        <p className="mt-0.5 max-w-[88px] text-[10px] leading-tight text-slate">мир открыт без сложной визы</p>
      </div>
    </div>
  );
}

function AccessBreakdown({
  access,
  revealed,
  breakdownKey,
}: {
  access: PassportProfile["access"];
  revealed: boolean;
  breakdownKey: string;
}) {
  const total = Object.values(access).reduce((sum, n) => sum + n, 0);
  const order: PassportAccessType[] = ["visaFree", "visaOnArrival", "eVisa", "visaRequired"];

  return (
    <div key={breakdownKey} className="space-y-3">
      {order.map((type, index) => {
        const count = access[type];
        const meta = ACCESS_TYPE_LABELS[type];
        const width = total > 0 ? (count / total) * 100 : 0;

        return (
          <div key={type}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-charcoal">{meta.label}</span>
              <span className="tabular-nums text-slate">{count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-[width] duration-[1.2s] ease-out"
                style={{
                  width: revealed ? `${width}%` : "0%",
                  backgroundColor: meta.color,
                  transitionDelay: `${index * 120}ms`,
                }}
              />
            </div>
            <p className="mt-0.5 text-[10px] text-slate/80">{meta.description}</p>
          </div>
        );
      })}
    </div>
  );
}

function VisaFreeHighlights({
  highlights,
  selectedCode,
}: {
  highlights: PassportProfile["visaFreeHighlights"];
  selectedCode: string;
}) {
  const [region, setRegion] = useState<VisaFreeRegion>("all");

  const filtered = useMemo(() => {
    if (region === "all") return highlights;
    return highlights.filter((item) => item.region === region);
  }, [highlights, region]);

  const regions = useMemo(() => {
    const present = new Set(highlights.map((item) => item.region));
    return (Object.keys(VISA_FREE_REGION_LABELS) as VisaFreeRegion[]).filter(
      (key) => key === "all" || present.has(key as Exclude<VisaFreeRegion, "all">)
    );
  }, [highlights]);

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-charcoal">
          {selectedCode === PRIMARY_PASSPORT_CODE
            ? "Без визы с аргентинским паспортом"
            : "Без визы с выбранным паспортом"}
        </p>
        <span className="text-[11px] tabular-nums text-slate">{filtered.length} направлений</span>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {regions.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setRegion(key)}
            aria-pressed={region === key}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
              region === key
                ? "bg-charcoal text-white"
                : "bg-gray-100/90 text-slate hover:bg-gray-100 hover:text-charcoal"
            )}
          >
            {VISA_FREE_REGION_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto pr-1 scrollbar-hide sm:max-h-44">
        {filtered.map((item) => (
          <span
            key={`${item.region}-${item.label}`}
            className="rounded-full border border-sky/15 bg-gradient-to-r from-sky/[0.06] to-white px-2.5 py-1 text-[11px] font-medium text-charcoal transition-transform hover:scale-[1.02]"
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function RankBar({
  item,
  maxDestinations,
  revealed,
  delayMs,
  onSelect,
}: {
  item: PassportBenchmark;
  maxDestinations: number;
  revealed: boolean;
  delayMs: number;
  onSelect?: (code: string) => void;
}) {
  const width = maxDestinations > 0 ? (item.destinations / maxDestinations) * 100 : 0;
  const selectable = Boolean(onSelect && PASSPORT_PICKER_ORDER.includes(item.code as PassportPickerCode));

  const content = (
    <>
      <span className="w-6 shrink-0 text-center text-sm" aria-hidden>
        {item.flag}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={cn("truncate text-sm", item.highlight ? "font-semibold text-charcoal" : "text-charcoal")}>
            {item.country}
          </p>
          <div className="flex shrink-0 items-center gap-2 text-xs tabular-nums text-slate">
            <span>#{item.rank}</span>
            <span className="font-medium text-charcoal">{item.destinations}</span>
          </div>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-[1.1s] ease-out",
              item.highlight ? "bg-gradient-to-r from-sky to-sky-dark" : "bg-gray-300/80"
            )}
            style={{
              width: revealed ? `${width}%` : "0%",
              transitionDelay: `${delayMs + 80}ms`,
            }}
          />
        </div>
      </div>
    </>
  );

  if (selectable) {
    return (
      <button
        type="button"
        onClick={() => onSelect?.(item.code)}
        aria-pressed={item.highlight}
        className={cn(
          "w-full rounded-xl px-3 py-2.5 text-left transition-all duration-500",
          item.highlight
            ? "border border-sky/25 bg-gradient-to-r from-sky/[0.08] to-white shadow-[0_4px_20px_-8px_rgba(116,172,223,0.5)]"
            : "border border-transparent bg-white/40 hover:border-sky/15 hover:bg-white/70"
        )}
        style={{ transitionDelay: `${delayMs}ms` }}
      >
        <div className="flex items-center gap-2">{content}</div>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl px-3 py-2.5 transition-all duration-500",
        item.highlight
          ? "border border-sky/25 bg-gradient-to-r from-sky/[0.08] to-white shadow-[0_4px_20px_-8px_rgba(116,172,223,0.5)]"
          : "border border-transparent bg-white/40"
      )}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      <div className="flex items-center gap-2">{content}</div>
    </div>
  );
}

function ComparisonPanel({
  items,
  revealed,
  onSelectPassport,
}: {
  items: PassportBenchmark[];
  revealed: boolean;
  onSelectPassport: (code: PassportPickerCode) => void;
}) {
  const maxDestinations = useMemo(
    () => Math.max(...items.map((item) => item.destinations), 1),
    [items]
  );

  return (
    <div className="space-y-2">
      <p className="mb-1 text-[11px] text-slate">Нажмите на страну, чтобы обновить карточку паспорта</p>
      {items.map((item, index) => (
        <RankBar
          key={item.code}
          item={item}
          maxDestinations={maxDestinations}
          revealed={revealed}
          delayMs={index * 70}
          onSelect={(code) => onSelectPassport(code as PassportPickerCode)}
        />
      ))}
    </div>
  );
}

function DeltaBadge({
  selected,
  primary,
  onShowPrimary,
}: {
  selected: PassportProfile;
  primary: PassportProfile;
  onShowPrimary: () => void;
}) {
  if (selected.code === primary.code) return null;

  const delta = selected.destinations - primary.destinations;
  const rankDelta = primary.globalRank - selected.globalRank;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-sky/15 bg-sky/[0.04] px-3 py-2 text-xs text-slate">
      <ArrowLeftRight className="h-3.5 w-3.5 shrink-0 text-sky" aria-hidden />
      <span className="min-w-0 flex-1">
        {delta === 0 ? (
          <>Столько же направлений, что у {primary.country}</>
        ) : delta > 0 ? (
          <>
            На <strong className="text-charcoal">{delta}</strong> направлений больше, чем у {primary.country}
          </>
        ) : (
          <>
            На <strong className="text-charcoal">{Math.abs(delta)}</strong> направлений меньше, чем у{" "}
            {primary.country}
          </>
        )}
        {rankDelta !== 0 ? (
          <>
            {" "}
            · в рейтинге {rankDelta > 0 ? "выше" : "ниже"} на {Math.abs(rankDelta)} поз.
          </>
        ) : null}
      </span>
      <button
        type="button"
        onClick={onShowPrimary}
        className="shrink-0 font-medium text-sky transition-colors hover:text-sky-dark"
      >
        {primary.flag} Вернуться к {primary.country}
      </button>
    </div>
  );
}

export default function ArgentinaPassportPowerWidget() {
  const { ref, revealed } = useRevealAnimation<HTMLElement>();
  const [tab, setTab] = useState<ComparisonTab>("latam");
  const [selectedCode, setSelectedCode] = useState<PassportPickerCode>(PRIMARY_PASSPORT_CODE);

  const primary = PASSPORT_PROFILES[PRIMARY_PASSPORT_CODE];
  const selected = getPassportProfile(selectedCode);

  const animatedDestinations = useAnimatedValue(selected.destinations, revealed);
  const animatedRank = useAnimatedValue(selected.globalRank, revealed, 900);

  const comparisonBase =
    tab === "latam" ? LATAM_COMPARISON : tab === "peers" ? PEERS_COMPARISON : GLOBAL_RANK_LADDER;
  const comparisonItems = buildComparisonLadder(comparisonBase, selectedCode);

  const statsKey = `${selectedCode}-${revealed}`;

  return (
    <section
      id="passport-power"
      ref={ref}
      aria-labelledby="passport-power-title"
      className={cn(
        "relative overflow-hidden rounded-3xl border border-sky/20 bg-gradient-to-br from-white via-white to-sky/[0.06] p-5 shadow-[0_24px_64px_-24px_rgba(26,26,46,0.12)] sm:p-6 lg:p-8",
        "ring-1 ring-sky/10"
      )}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden>
        <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-sky/10 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-sun/10 blur-3xl" />
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-sky/20 bg-sky/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-sky">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden />
            Индекс мобильности
          </p>
          <h3 id="passport-power-title" className="mt-3 font-heading text-xl font-bold text-charcoal sm:text-2xl">
            {selected.code === PRIMARY_PASSPORT_CODE
              ? "Сила аргентинского паспорта"
              : `Паспорт ${selected.country}`}
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate">
            {selected.code === PRIMARY_PASSPORT_CODE
              ? "Аргентинское гражданство открывает доступ к большинству мировых направлений — без визы, по прилёте или через простое электронное разрешение."
              : "Сравните показатели с аргентинским паспортом — выберите другую страну в списке или в рейтинге ниже."}
          </p>
        </div>
        <p className="shrink-0 text-right text-[11px] leading-relaxed text-slate/80">
          <span className="block font-medium text-slate">{PASSPORT_POWER_EDITION.label}</span>
          <span className="block">Редакция {PASSPORT_POWER_EDITION.year}</span>
        </p>
      </header>

      <div className="mt-5">
        <PassportPicker selected={selectedCode} onSelect={setSelectedCode} />
      </div>

      {selected.code !== primary.code ? (
        <div className="mt-3">
          <DeltaBadge
            selected={selected}
            primary={primary}
            onShowPrimary={() => setSelectedCode(PRIMARY_PASSPORT_CODE)}
          />
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10">
        <div className="flex flex-col items-center gap-6 lg:items-stretch">
          <PassportCover key={selected.code} profile={selected} revealed={revealed} />

          <div key={statsKey} className="grid w-full grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/80 bg-white/70 p-4 backdrop-blur-sm">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate">Место в мире</p>
              <p className="mt-1 font-heading text-3xl font-bold tabular-nums text-charcoal">#{animatedRank}</p>
              <p className="mt-1 text-xs text-slate">из {selected.totalRanked} паспортов</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/70 p-4 backdrop-blur-sm">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate">Направления</p>
              <p className="mt-1 font-heading text-3xl font-bold tabular-nums text-charcoal">
                {animatedDestinations}
              </p>
              <p className="mt-1 text-xs text-slate">стран и территорий</p>
            </div>
          </div>

          <VisaFreeHighlights highlights={selected.visaFreeHighlights} selectedCode={selected.code} />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div className="rounded-2xl border border-gray-100/80 bg-white/60 p-5 backdrop-blur-sm">
            <p className="text-sm font-semibold text-charcoal">Свобода передвижения</p>
            <FreedomRing
              percent={selected.worldAccessPercent}
              revealed={revealed}
              ringKey={`${selected.code}-ring`}
            />
          </div>
          <div className="rounded-2xl border border-gray-100/80 bg-white/60 p-5 backdrop-blur-sm">
            <p className="mb-4 text-sm font-semibold text-charcoal">Условия въезда</p>
            <AccessBreakdown
              access={selected.access}
              revealed={revealed}
              breakdownKey={`${selected.code}-access`}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-gray-100/80 bg-white/50 p-4 backdrop-blur-sm sm:p-5">
        <div className="flex flex-wrap gap-2">
          {COMPARISON_TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              aria-pressed={tab === item.id}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                tab === item.id
                  ? "bg-sky text-white shadow-sm"
                  : "bg-gray-100/80 text-slate hover:bg-gray-100 hover:text-charcoal"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <ComparisonPanel
            items={comparisonItems}
            revealed={revealed}
            onSelectPassport={setSelectedCode}
          />
        </div>
      </div>

      <p className="mt-5 text-[11px] leading-relaxed text-slate/75">{PASSPORT_POWER_DISCLAIMER}</p>
    </section>
  );
}
