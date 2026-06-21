"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ChevronRight, Info, Sparkles } from "lucide-react";
import {
  ARGENTINA_TOURISM_TIMELINE,
  TIMELINE_RIBBON_PATHS,
  TIMELINE_VIEWBOX,
  eraYPosition,
  type TourismTimelineEra,
  type TourismTimelineStream,
} from "@/data/argentina-tourism-timeline";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
};

function TimelineRibbons({
  streams,
  activeStreamId,
  onStreamHover,
  onStreamLeave,
}: {
  streams: TourismTimelineStream[];
  activeStreamId: string | null;
  onStreamHover: (id: string) => void;
  onStreamLeave: () => void;
}) {
  return (
    <svg
      viewBox={`0 0 ${TIMELINE_VIEWBOX.width} ${TIMELINE_VIEWBOX.height}`}
      className="h-full w-full"
      aria-hidden
    >
      <defs>
        <radialGradient id="hub-glow" cx="50%" cy="12%" r="45%">
          <stop offset="0%" stopColor="#c0392b" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#c0392b" stopOpacity="0" />
        </radialGradient>
        <filter id="ribbon-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
        </filter>
      </defs>

      {/* Фон «пергамент» */}
      <rect
        x="24"
        y="24"
        width="352"
        height="372"
        rx="20"
        fill="#faf6ef"
        stroke="#e8dfd0"
        strokeWidth="1"
      />

      {/* Размытые ленты под основными */}
      {streams.map((stream) => (
        <path
          key={`${stream.id}-blur`}
          d={TIMELINE_RIBBON_PATHS[stream.id]}
          fill="none"
          stroke={stream.color}
          strokeWidth={activeStreamId && activeStreamId !== stream.id ? 8 : 14}
          strokeLinecap="round"
          opacity={activeStreamId && activeStreamId !== stream.id ? 0.08 : 0.18}
          filter="url(#ribbon-blur)"
        />
      ))}

      {/* Основные ленты */}
      {streams.map((stream) => {
        const dimmed = activeStreamId != null && activeStreamId !== stream.id;
        return (
          <path
            key={stream.id}
            d={TIMELINE_RIBBON_PATHS[stream.id]}
            fill="none"
            stroke={stream.color}
            strokeWidth={dimmed ? 6 : 10}
            strokeLinecap="round"
            opacity={dimmed ? 0.35 : 0.9}
            className="transition-all duration-300"
            onMouseEnter={() => onStreamHover(stream.id)}
            onMouseLeave={onStreamLeave}
          />
        );
      })}

      {/* Годовые метки */}
      {ARGENTINA_TOURISM_TIMELINE.eras.map((era) => {
        const y = eraYPosition(era.position);
        return (
          <g key={era.id}>
            <line
              x1="40"
              y1={y}
              x2="360"
              y2={y}
              stroke="#d6cbb8"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x="36"
              y={y + 4}
              textAnchor="end"
              className="fill-slate-500"
              style={{ fontSize: 10, fontWeight: 600 }}
            >
              {era.yearLabel}
            </text>
          </g>
        );
      })}

      {/* Хаб — BA */}
      <circle cx="200" cy="52" r="44" fill="url(#hub-glow)" />
      <circle cx="200" cy="52" r="36" fill="#c0392b" stroke="#fff" strokeWidth="3" />
      <text
        x="200"
        y="48"
        textAnchor="middle"
        fill="#fff"
        style={{ fontSize: 9, fontWeight: 700 }}
      >
        BA
      </text>
      <text
        x="200"
        y="60"
        textAnchor="middle"
        fill="#fff"
        style={{ fontSize: 7, fontWeight: 500 }}
        opacity={0.9}
      >
        ХАБ
      </text>

      {/* Силуэт skyline */}
      <g transform="translate(168, 28)" fill="#fff" opacity={0.85}>
        <rect x="0" y="8" width="8" height="16" />
        <rect x="12" y="4" width="10" height="20" />
        <rect x="26" y="10" width="6" height="14" />
        <rect x="36" y="2" width="12" height="22" />
        <rect x="52" y="8" width="8" height="16" />
      </g>

      {/* Низ — «пампа» */}
      <text
        x="200"
        y="398"
        textAnchor="middle"
        className="fill-amber-900/60"
        style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em" }}
      >
        ПАМПА · НАЧАЛО МАРШРУТА
      </text>
    </svg>
  );
}

function DestinationBubble({
  dest,
  active,
  onHover,
  onLeave,
  style,
}: {
  dest: (typeof ARGENTINA_TOURISM_TIMELINE.hubDestinations)[number];
  active: boolean;
  onHover: () => void;
  onLeave: () => void;
  style: CSSProperties;
}) {
  const size = 36 + dest.share * 0.35;

  return (
    <Link
      href={dest.href}
      className="group absolute -translate-x-1/2 -translate-y-1/2"
      style={style}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full border-2 border-teal-500/80 bg-teal-500 text-white shadow-md transition-all duration-300",
          active && "scale-110 border-teal-400 ring-4 ring-teal-200/60"
        )}
        style={{ width: size, height: size }}
      >
        <span className="text-[10px] font-bold tabular-nums">{dest.share}%</span>
      </span>
      <span
        className={cn(
          "pointer-events-none absolute left-1/2 top-full z-10 mt-1.5 w-max max-w-[140px] -translate-x-1/2 rounded-lg border border-gray-100 bg-white px-2 py-1.5 text-center text-[10px] shadow-lg transition-opacity",
          active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        <span className="block font-semibold text-charcoal">{dest.name}</span>
        <span className="block text-slate">{dest.tag}</span>
      </span>
    </Link>
  );
}

/** Расположение «пузырей» направлений вокруг хаба. */
const BUBBLE_POSITIONS: Record<string, { top: string; left: string }> = {
  patagonia: { top: "18%", left: "22%" },
  iguazu: { top: "12%", left: "78%" },
  mendoza: { top: "28%", left: "88%" },
  bariloche: { top: "32%", left: "12%" },
  salta: { top: "8%", left: "50%" },
  ushuaia: { top: "22%", left: "62%" },
};

export default function ArgentinaTourismTimeline({ className }: Props) {
  const data = ARGENTINA_TOURISM_TIMELINE;
  const [activeEraId, setActiveEraId] = useState<string>(data.eras[data.eras.length - 1].id);
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [activeDestId, setActiveDestId] = useState<string | null>(null);

  const activeEra = useMemo(
    () => data.eras.find((e) => e.id === activeEraId) ?? data.eras[0],
    [activeEraId, data.eras]
  );

  const activeStream = useMemo(
    () => data.streams.find((s) => s.id === activeStreamId),
    [activeStreamId, data.streams]
  );

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-amber-100/80 bg-[#faf6ef] shadow-sm",
        className
      )}
      aria-label="Эволюция туризма в Аргентине"
    >
      {/* Шапка */}
      <div className="border-b border-amber-200/60 bg-gradient-to-r from-amber-50/80 via-white to-sky/5 px-4 py-5 sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-800/70">
          {data.editionLabel}
        </p>
        <h2 className="mt-1 font-heading text-2xl font-bold uppercase tracking-tight text-charcoal sm:text-3xl">
          {data.title}
        </h2>
        <p className="mt-1 text-sm font-medium text-amber-900/80">{data.subtitle}</p>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]">
        {/* Левая часть — воронка + пузыри */}
        <div className="relative border-b border-amber-200/40 p-4 sm:p-6 lg:border-b-0 lg:border-r">
          {/* Пузыри направлений */}
          <div className="relative mb-2 h-28 sm:h-32">
            <div className="absolute inset-x-0 top-1/2 mx-auto h-px max-w-xs bg-teal-300/40" aria-hidden />
            {data.hubDestinations.map((dest) => (
              <DestinationBubble
                key={dest.id}
                dest={dest}
                active={activeDestId === dest.id}
                onHover={() => setActiveDestId(dest.id)}
                onLeave={() => setActiveDestId(null)}
                style={BUBBLE_POSITIONS[dest.id]}
              />
            ))}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-700">
                {data.hubLabel}
              </p>
              <p className="font-heading text-lg font-bold text-charcoal">
                {data.hubStat}{" "}
                <span className="text-sm font-normal text-slate">{data.hubStatLabel}</span>
              </p>
            </div>
          </div>

          {/* SVG воронка */}
          <div className="mx-auto aspect-[400/420] max-h-[480px] w-full max-w-md">
            <TimelineRibbons
              streams={[...data.streams]}
              activeStreamId={activeStreamId}
              onStreamHover={setActiveStreamId}
              onStreamLeave={() => setActiveStreamId(null)}
            />
          </div>

          {/* Легенда лент */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {data.streams.map((stream) => (
              <button
                key={stream.id}
                type="button"
                onMouseEnter={() => setActiveStreamId(stream.id)}
                onMouseLeave={() => setActiveStreamId(null)}
                onClick={() =>
                  setActiveStreamId((prev) => (prev === stream.id ? null : stream.id))
                }
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  activeStreamId === stream.id
                    ? "border-charcoal/20 bg-white shadow-sm"
                    : "border-transparent bg-white/60 text-slate hover:bg-white"
                )}
              >
                <span className={cn("h-2.5 w-2.5 rounded-full", stream.swatchClass)} />
                {stream.label}
              </button>
            ))}
          </div>
          {activeStream ? (
            <p className="mx-auto mt-2 max-w-md text-center text-xs leading-relaxed text-slate">
              {activeStream.description}
            </p>
          ) : null}
        </div>

        {/* Правая колонка — эпохи */}
        <div className="flex flex-col bg-white/50">
          <div className="border-b border-amber-200/40 px-4 py-3 sm:px-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate">
              Хронология
            </p>
            <p className="mt-0.5 text-xs text-slate">Выберите эпоху — справа появится контекст</p>
          </div>

          <div className="flex flex-1 flex-col gap-1 p-2 sm:p-3">
            {data.eras.map((era) => (
              <EraButton
                key={era.id}
                era={era}
                active={activeEraId === era.id}
                onClick={() => setActiveEraId(era.id)}
              />
            ))}
          </div>

          <div className="border-t border-amber-200/40 p-4 sm:p-5">
            <EraDetail era={activeEra} />
          </div>
        </div>
      </div>

      <footer className="border-t border-amber-200/40 bg-amber-50/40 px-4 py-3 sm:px-6">
        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-slate">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700/70" aria-hidden />
          {data.disclaimer}
        </p>
      </footer>
    </section>
  );
}

function EraButton({
  era,
  active,
  onClick,
}: {
  era: TourismTimelineEra;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl px-3 py-2.5 text-left transition",
        active
          ? "bg-white shadow-sm ring-1 ring-amber-200/80"
          : "hover:bg-white/70"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800/80">
          {era.yearLabel}
        </span>
        {era.badge ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-900">
            {era.badge}
          </span>
        ) : null}
      </div>
      <p className="mt-0.5 text-xs font-semibold text-charcoal">{era.theme}</p>
      <p className="mt-0.5 line-clamp-1 text-[11px] text-slate">{era.title}</p>
    </button>
  );
}

function EraDetail({ era }: { era: TourismTimelineEra }) {
  return (
    <div className="transition-opacity duration-200">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-600" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
          {era.yearLabel} · {era.theme}
        </p>
      </div>
      <h3 className="mt-2 font-heading text-lg font-bold text-charcoal">{era.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate">{era.body}</p>
      <ul className="mt-3 space-y-1.5">
        {era.highlights.map((item) => (
          <li key={item} className="flex gap-2 text-xs leading-relaxed text-charcoal">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
      {era.href && era.linkLabel ? (
        <Link
          href={era.href}
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky hover:underline"
        >
          {era.linkLabel}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

export function ArgentinaTourismTimelineSkeleton() {
  return (
    <div
      className="h-[640px] animate-pulse rounded-2xl border border-amber-100 bg-amber-50/50"
      aria-hidden
    />
  );
}
