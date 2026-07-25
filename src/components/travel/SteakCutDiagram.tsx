"use client";

import { useLayoutEffect, useRef, useState, type ReactNode, type SVGProps } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/ui/safe-image";
import {
  STEAK_CUT_DIAGRAM_UI,
  STEAK_CUT_DIAGRAM_ZONES,
  type SteakCutDiagramIcon,
  type SteakCutDiagramZone,
} from "@/data/steak-cut-diagram";
import { STEAK_GUIDE_MEDIA } from "@/data/media/argentinian-steak-guide-media";
import { mediaUrl } from "@/lib/media/media-cdn";

const cowIllustration = STEAK_GUIDE_MEDIA.cutsDiagram;

type Props = {
  className?: string;
};

type CutIconProps = SVGProps<SVGSVGElement>;

/** Small, deliberately distinct silhouettes so each cut reads differently at a glance. */
const CUT_ICONS: Record<SteakCutDiagramIcon, (props: CutIconProps) => ReactNode> = {
  ribs: (props) => (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      <path d="M6 8c4 0 4 16 0 16M13 6c4 0 4 20 0 20M20 8c4 0 4 16 0 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  ribeye: (props) => (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      <ellipse cx="16" cy="16" rx="12" ry="9" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="12" cy="13" r="1.4" fill="currentColor" />
      <circle cx="18" cy="12" r="1.1" fill="currentColor" />
      <circle cx="15" cy="18" r="1.3" fill="currentColor" />
      <circle cx="20" cy="19" r="1" fill="currentColor" />
    </svg>
  ),
  strip: (props) => (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      <path
        d="M5 20c0-7 3-11 8-12 6-1.5 12 1 14 5-3 2-6 2-9 1-3 8-9 10-13 6-1-2 0-6 0-6Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  ),
  tenderloin: (props) => (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      <path
        d="M5 16c0-3 2-5 5-5h12c3 0 5 2 5 5s-2 5-5 5H10c-3 0-5-2-5-5Z"
        stroke="currentColor"
        strokeWidth="2.5"
      />
    </svg>
  ),
  skirt: (props) => (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      <path
        d="M4 12c3 2 2 5 5 6s3-3 6-2 2 5 5 5 4-4 8-3"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M4 18c3 2 2 5 5 6s3-3 6-2 2 5 5 5 4-4 8-3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.6"
        fill="none"
      />
    </svg>
  ),
  flank: (props) => (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      <path d="M4 10h20l4 12H8Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M9 12l3 8M14 12l2 8M19 12l1 8" stroke="currentColor" strokeWidth="1.4" opacity="0.6" />
    </svg>
  ),
  triangle: (props) => (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      <path d="M16 5l12 22H4Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  ),
};

type Line = { id: string; x1: number; y1: number; x2: number; y2: number };

function ZoneCard({
  zone,
  registerRef,
}: {
  zone: SteakCutDiagramZone;
  registerRef?: (el: HTMLDivElement | null) => void;
}) {
  const Icon = CUT_ICONS[zone.icon];
  return (
    // This card is the primary interactive surface beside the cow image —
    // hairline border only, no shadow, so it doesn't read as a nested card.
    <div
      ref={registerRef}
      className="flex items-start gap-3 rounded-xl border border-gray-100 bg-surface-muted/20 p-3"
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky text-xs font-bold text-white"
        aria-hidden
      >
        {zone.number}
      </span>
      <Icon className="h-7 w-7 shrink-0 text-sky" aria-hidden />
      <p className="text-sm leading-relaxed text-slate">
        <span className="font-medium text-charcoal" lang="es">
          {zone.name}
        </span>{" "}
        — {zone.description}
      </p>
    </div>
  );
}

/**
 * Beef-cut diagram: a realistic project-generated cow illustration with
 * numbered HTML pins, leader lines (measured live, desktop only) and cards
 * carrying real HTML text — no labels are baked into the raster.
 */
export default function SteakCutDiagram({ className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [lines, setLines] = useState<Line[]>([]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const recompute = () => {
      const containerRect = container.getBoundingClientRect();
      const next: Line[] = [];
      for (const zone of STEAK_CUT_DIAGRAM_ZONES) {
        const marker = markerRefs.current.get(zone.id);
        const card = cardRefs.current.get(zone.id);
        if (!marker || !card) continue;
        const m = marker.getBoundingClientRect();
        const c = card.getBoundingClientRect();
        if (m.width === 0 || c.width === 0) continue;
        const x1 = m.left + m.width / 2 - containerRect.left;
        const y1 = m.top + m.height / 2 - containerRect.top;
        const edgeX = c.left + c.width / 2 < m.left + m.width / 2 ? c.right : c.left;
        const x2 = edgeX - containerRect.left;
        const y2 = c.top + c.height / 2 - containerRect.top;
        next.push({ id: zone.id, x1, y1, x2, y2 });
      }
      setLines(next);
    };

    recompute();
    const raf = requestAnimationFrame(recompute);
    const ro = new ResizeObserver(recompute);
    ro.observe(container);
    window.addEventListener("resize", recompute);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, []);

  const leftZones = STEAK_CUT_DIAGRAM_ZONES.filter((z) => z.x < 53).sort((a, b) => a.y - b.y);
  const rightZones = STEAK_CUT_DIAGRAM_ZONES.filter((z) => z.x >= 53).sort((a, b) => a.y - b.y);

  const cowImage = (
    <div className="relative w-full overflow-hidden rounded-2xl border border-gray-100">
      <div className="relative w-full" style={{ aspectRatio: `${cowIllustration.width} / ${cowIllustration.height}` }}>
        <SafeImage
          src={mediaUrl(cowIllustration.src)}
          alt={cowIllustration.alt}
          fill
          sizes="(min-width: 640px) 45vw, 100vw"
          className="object-contain"
          placeholderVariant="generic"
        />
        {STEAK_CUT_DIAGRAM_ZONES.map((zone) => (
          <div
            key={zone.id}
            ref={(el) => {
              if (el) markerRefs.current.set(zone.id, el);
              else markerRefs.current.delete(zone.id);
            }}
            className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-sky text-[11px] font-bold text-white shadow"
            style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
            aria-hidden
          >
            {zone.number}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    // No outer boxed wrapper — the numbered cards flanking the illustration
    // are already the widget's visible surface; wrapping them in another
    // bordered/shadowed panel would stack a card inside a card.
    <section className={className} aria-label={STEAK_CUT_DIAGRAM_UI.ariaLabel}>
      <h3 className="font-heading text-base font-semibold text-charcoal">
        {STEAK_CUT_DIAGRAM_UI.title}
      </h3>
      <p className="mt-1 text-sm text-slate">{STEAK_CUT_DIAGRAM_UI.hint}</p>

      {/* Mobile: image on top, all 7 cards stacked below in order — no lines. */}
      <div className="mt-4 space-y-3 sm:hidden">
        {cowImage}
        {STEAK_CUT_DIAGRAM_ZONES.map((zone) => (
          <ZoneCard key={zone.id} zone={zone} />
        ))}
      </div>

      {/* Desktop: cards flank the illustration with measured leader lines. */}
      <div ref={containerRef} className="relative mt-4 hidden sm:grid sm:grid-cols-[1fr_1.3fr_1fr] sm:gap-4">
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          {lines.map((line) => (
            <g key={line.id}>
              <line
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="var(--color-sky)"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity="0.55"
              />
              <circle cx={line.x1} cy={line.y1} r="2.5" fill="var(--color-sky)" opacity="0.8" />
            </g>
          ))}
        </svg>
        <div className="relative z-10 flex flex-col justify-around gap-3">
          {leftZones.map((zone) => (
            <ZoneCard
              key={zone.id}
              zone={zone}
              registerRef={(el) => {
                if (el) cardRefs.current.set(zone.id, el);
                else cardRefs.current.delete(zone.id);
              }}
            />
          ))}
        </div>
        <div className="relative z-10">{cowImage}</div>
        <div className="relative z-10 flex flex-col justify-around gap-3">
          {rightZones.map((zone) => (
            <ZoneCard
              key={zone.id}
              zone={zone}
              registerRef={(el) => {
                if (el) cardRefs.current.set(zone.id, el);
                else cardRefs.current.delete(zone.id);
              }}
            />
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate">
        {STEAK_CUT_DIAGRAM_UI.disclaimer}{" "}
        <Link
          href={STEAK_CUT_DIAGRAM_UI.disclaimerHref}
          className="underline hover:text-sky"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          {STEAK_CUT_DIAGRAM_UI.disclaimerLinkLabel}
        </Link>
      </p>
    </section>
  );
}
