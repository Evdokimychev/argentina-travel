"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  CalendarRange,
  Clock3,
  Globe2,
  Landmark,
  Languages,
  MapPin,
  Plane,
  Ruler,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  ARGENTINA_TOURISM_INFOGRAPHIC,
  projectTourismMapPoint,
  type TourismInfographicFact,
  type TourismMapCity,
} from "@/data/argentina-tourism-infographic";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  /** Компактный режим — без правой колонки на планшетах */
  compact?: boolean;
};

const FACT_ICONS = {
  area: Ruler,
  currency: Banknote,
  capital: Landmark,
  population: Users,
  language: Languages,
  visa: ShieldCheck,
  timezone: Clock3,
  season: CalendarRange,
} as const;

function ArgentinaFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 40" className={className} aria-hidden>
      <rect width="64" height="40" fill="#74acdf" />
      <rect y="13.3" width="64" height="13.4" fill="#fff" />
      <circle cx="32" cy="20" r="6" fill="#fcbf49" stroke="#e8a317" strokeWidth="0.5" />
    </svg>
  );
}

function SouthAmericaMap({
  cities,
  activeCityId,
  onCityHover,
  onCityLeave,
  onCityClick,
}: {
  cities: TourismMapCity[];
  activeCityId: string | null;
  onCityHover: (id: string) => void;
  onCityLeave: () => void;
  onCityClick: (id: string) => void;
}) {
  const projected = useMemo(
    () =>
      cities.map((city) => ({
        ...city,
        ...projectTourismMapPoint(city.lat, city.lng),
      })),
    [cities],
  );

  const activeCity = projected.find((c) => c.id === activeCityId);

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <svg
        viewBox="0 0 320 400"
        className="h-auto w-full drop-shadow-sm"
        role="img"
        aria-label="Карта Южной Америки с выделенной Аргентиной"
      >
        <defs>
          <linearGradient id="argentina-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#74acdf" />
            <stop offset="100%" stopColor="#5a94c9" />
          </linearGradient>
          <filter id="city-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Упрощённый контур континента */}
        <path
          d="M 48 28 C 72 18, 108 22, 132 34 C 158 28, 188 36, 210 52 C 232 48, 258 58, 272 78 C 286 96, 292 120, 288 148 C 294 172, 286 198, 274 222 C 268 248, 256 272, 244 296 C 232 318, 214 334, 192 348 C 168 362, 142 372, 118 378 C 94 384, 72 378, 58 360 C 44 342, 36 318, 32 292 C 28 266, 26 238, 28 210 C 30 182, 34 154, 38 128 C 40 102, 42 76, 44 52 Z"
          fill="#e8eef4"
          stroke="#cbd5e1"
          strokeWidth="1.5"
        />

        {/* Аргентина */}
        <path
          d="M 118 72 C 128 68, 142 70, 152 78 C 162 74, 176 76, 186 84 C 194 92, 198 108, 200 124 C 202 142, 204 162, 202 182 C 200 202, 196 222, 190 242 C 184 262, 176 282, 166 300 C 156 318, 144 334, 130 348 C 122 356, 112 360, 104 352 C 98 342, 96 328, 94 312 C 92 296, 90 278, 88 260 C 86 242, 84 224, 84 206 C 84 188, 86 170, 90 152 C 94 134, 100 118, 106 102 C 110 90, 114 80, 118 72 Z"
          fill="url(#argentina-fill)"
          stroke="#c0392b"
          strokeWidth="2"
        />

        {/* Чили — узкая полоска */}
        <path
          d="M 96 78 L 104 76 L 108 120 L 112 180 L 116 240 L 118 300 L 120 340 L 112 342 L 108 280 L 104 220 L 100 160 L 96 100 Z"
          fill="#dce4ec"
          stroke="#cbd5e1"
          strokeWidth="0.8"
        />

        {/* Подписи соседей */}
        <text x="168" y="56" className="fill-slate-400 text-[9px] font-medium" style={{ fontSize: 9 }}>
          Бразилия
        </text>
        <text x="88" y="66" className="fill-slate-400 text-[9px]" style={{ fontSize: 8 }}>
          Чили
        </text>
        <text x="148" y="368" className="fill-slate-400 text-[9px]" style={{ fontSize: 8 }}>
          Уругвай
        </text>

        {/* Города */}
        {projected.map((city) => {
          const active = activeCityId === city.id;
          return (
            <g key={city.id}>
              <circle
                cx={city.x}
                cy={city.y}
                r={active ? 7 : 5}
                fill={active ? "#c0392b" : "#fff"}
                stroke={active ? "#fff" : "#c0392b"}
                strokeWidth={active ? 2 : 1.5}
                filter={active ? "url(#city-glow)" : undefined}
                className="cursor-pointer transition-all"
                onMouseEnter={() => onCityHover(city.id)}
                onMouseLeave={onCityLeave}
                onClick={() => onCityClick(city.id)}
              />
              {active ? (
                <circle cx={city.x} cy={city.y} r={12} fill="#c0392b" opacity={0.15} />
              ) : null}
            </g>
          );
        })}
      </svg>

      {activeCity ? (
        <div className="absolute bottom-2 left-2 right-2 rounded-xl border border-white/80 bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur-sm">
          <p className="text-xs font-semibold text-charcoal">{activeCity.name}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-slate">{activeCity.tag}</p>
          <Link
            href={activeCity.href}
            className="mt-1.5 inline-flex text-[11px] font-medium text-sky hover:underline"
          >
            Подробнее о направлении →
          </Link>
        </div>
      ) : (
        <p className="mt-2 text-center text-[11px] text-slate">
          Наведите на точку — ключевые туристические города
        </p>
      )}
    </div>
  );
}

function SidebarFactRow({
  fact,
  active,
  onHover,
  onLeave,
}: {
  fact: TourismInfographicFact;
  active: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const Icon = FACT_ICONS[fact.icon];
  const content = (
    <>
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition",
          active ? "bg-sky text-white" : "bg-sky/10 text-sky"
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate">
          {fact.label}
        </span>
        <span className="mt-0.5 block text-sm font-bold text-charcoal">{fact.value}</span>
        {fact.detail ? (
          <span className="mt-0.5 block text-[11px] leading-snug text-slate">{fact.detail}</span>
        ) : null}
      </span>
    </>
  );

  const className = cn(
    "flex gap-3 rounded-xl px-2 py-2.5 transition",
    active && "bg-sky/[0.06]",
    fact.href && "hover:bg-gray-50"
  );

  if (fact.href) {
    return (
      <Link
        href={fact.href}
        className={className}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={className} onMouseEnter={onHover} onMouseLeave={onLeave}>
      {content}
    </div>
  );
}

function BarChart({ items }: { items: typeof ARGENTINA_TOURISM_INFOGRAPHIC.destinationBars }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = items.find((item) => item.id === activeId);

  return (
    <div>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="group w-full text-left"
              onMouseEnter={() => setActiveId(item.id)}
              onMouseLeave={() => setActiveId(null)}
              onFocus={() => setActiveId(item.id)}
              onBlur={() => setActiveId(null)}
            >
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-charcoal">{item.label}</span>
                <span className="tabular-nums text-slate">{item.value}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    activeId === item.id
                      ? "bg-gradient-to-r from-sky to-sky-dark"
                      : "bg-sky/70"
                  )}
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </button>
          </li>
        ))}
      </ul>
      {active ? (
        <p className="mt-3 text-xs leading-relaxed text-slate">{active.detail}</p>
      ) : (
        <p className="mt-3 text-xs text-slate">Относительная популярность среди иностранных туристов</p>
      )}
    </div>
  );
}

export default function ArgentinaTourismInfographic({ className, compact = false }: Props) {
  const data = ARGENTINA_TOURISM_INFOGRAPHIC;
  const [activeFactId, setActiveFactId] = useState<string | null>(null);
  const [activeCityId, setActiveCityId] = useState<string | null>(null);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm",
        className
      )}
      aria-label="Туристическая инфографика об Аргентине"
    >
      {/* Шапка */}
      <div className="relative overflow-hidden border-b border-sky/15 bg-gradient-to-br from-sky/15 via-sky/[0.08] to-white px-4 py-5 sm:px-6 sm:py-6">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-sky/10 blur-2xl" />
        <div className="relative flex flex-wrap items-start gap-4">
          <ArgentinaFlag className="h-10 w-16 shrink-0 rounded shadow-sm sm:h-12 sm:w-20" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-dark">
              {data.editionLabel}
            </p>
            <h2 className="mt-1 font-heading text-2xl font-bold uppercase tracking-tight text-charcoal sm:text-3xl">
              {data.title}
            </h2>
            <p className="mt-0.5 text-sm font-medium text-sky-dark">{data.subtitle}</p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate">{data.tagline}</p>
          </div>
          <div className="hidden items-center gap-2 rounded-xl border border-sky/20 bg-white/80 px-3 py-2 text-xs text-slate sm:flex">
            <Globe2 className="h-4 w-4 text-sky" aria-hidden />
            Южное полушарие
          </div>
        </div>
      </div>

      {/* Основная сетка */}
      <div
        className={cn(
          "grid gap-0",
          compact ? "lg:grid-cols-[220px_1fr]" : "lg:grid-cols-[240px_1fr_1fr]"
        )}
      >
        {/* Левая колонка — факты */}
        <aside className="border-b border-gray-100 bg-gradient-to-b from-gray-50/80 to-white p-4 sm:p-5 lg:border-b-0 lg:border-r">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate">
            Быстрые факты
          </p>
          <div className="space-y-1">
            {data.sidebarFacts.map((fact) => (
              <SidebarFactRow
                key={fact.id}
                fact={fact}
                active={activeFactId === fact.id}
                onHover={() => setActiveFactId(fact.id)}
                onLeave={() => setActiveFactId(null)}
              />
            ))}
          </div>
        </aside>

        {/* Центр — карта */}
        <div className="border-b border-gray-100 p-4 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-sky" aria-hidden />
            <p className="text-sm font-semibold text-charcoal">Карта направлений</p>
          </div>
          <SouthAmericaMap
            cities={[...data.mapCities]}
            activeCityId={activeCityId}
            onCityHover={setActiveCityId}
            onCityLeave={() => setActiveCityId(null)}
            onCityClick={setActiveCityId}
          />
        </div>

        {/* Правая колонка — блоки */}
        {!compact ? (
          <div className="space-y-0 divide-y divide-gray-100">
            <div className="p-4 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate">
                Почему едут
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                {data.highlights.map((item) => {
                  const inner = (
                    <>
                      <span className="text-lg" aria-hidden>
                        {item.emoji}
                      </span>
                      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate">
                        {item.title}
                      </p>
                      <p className="font-heading text-xl font-bold text-charcoal">{item.stat}</p>
                      <p className="mt-0.5 text-[11px] leading-snug text-slate">{item.detail}</p>
                    </>
                  );

                  return item.href ? (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 transition hover:border-sky/25 hover:bg-sky/[0.04]"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div
                      key={item.id}
                      className="rounded-xl border border-gray-100 bg-gray-50/50 p-3"
                    >
                      {inner}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate">
                Популярность направлений
              </p>
              <div className="mt-3">
                <BarChart items={[...data.destinationBars]} />
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate">
                <Plane className="h-3.5 w-3.5" aria-hidden />
                Практика для туриста
              </p>
              <ul className="space-y-3">
                {data.practical.map((item) => (
                  <li
                    key={item.title}
                    className="rounded-xl border border-gray-100 bg-white px-3 py-2.5"
                  >
                    <p className="text-sm font-semibold text-charcoal">{item.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate">{item.body}</p>
                    {item.href && item.linkLabel ? (
                      <Link
                        href={item.href}
                        className="mt-1.5 inline-flex text-xs font-medium text-sky hover:underline"
                      >
                        {item.linkLabel} →
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>

      {/* Компакт: правая колонка под картой */}
      {compact ? (
        <div className="grid gap-0 divide-y divide-gray-100 border-t border-gray-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate">
              Почему едут
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {data.highlights.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-100 bg-gray-50/50 p-2.5"
                >
                  <span className="text-base" aria-hidden>
                    {item.emoji}
                  </span>
                  <p className="mt-1 font-heading text-lg font-bold text-charcoal">{item.stat}</p>
                  <p className="text-[10px] text-slate">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate">
              Популярность
            </p>
            <div className="mt-3">
              <BarChart items={[...data.destinationBars]} />
            </div>
          </div>
        </div>
      ) : null}

      <footer className="border-t border-gray-100 bg-gray-50/60 px-4 py-3 sm:px-6">
        <p className="text-[11px] leading-relaxed text-slate">{data.disclaimer}</p>
      </footer>
    </section>
  );
}

export function ArgentinaTourismInfographicSkeleton() {
  return (
    <div
      className="h-[520px] animate-pulse rounded-2xl border border-gray-100 bg-gray-50"
      aria-hidden
    />
  );
}
