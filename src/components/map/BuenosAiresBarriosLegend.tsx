import { cn } from "@/lib/cn";
import type { BuenosAiresBarriosMapMode } from "@/components/map/BuenosAiresBarriosMap";

type Props = {
  mode: BuenosAiresBarriosMapMode;
  recommendedCount: number;
  className?: string;
};

export default function BuenosAiresBarriosLegend({
  mode,
  recommendedCount,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-lg border border-white/80 bg-white/92 px-3 py-2 text-[11px] leading-snug text-slate-700 shadow-md backdrop-blur-sm",
        className
      )}
      aria-label="Легенда карты районов Буэнос-Айреса"
    >
      <div className="font-semibold text-slate-900">Районы CABA</div>
      {mode !== "recommended" ? (
        <div className="mt-1.5 flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-300" />
          <span>рекомендуем ({recommendedCount})</span>
        </div>
      ) : null}
      {mode !== "recommended" ? (
        <div className="mt-1 flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-violet-300" />
          <span>остальные barrios</span>
        </div>
      ) : null}
      {mode === "recommended" || mode === "both" ? (
        <div className="mt-1 flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500/70" />
          <span>рекомендуем для проживания</span>
        </div>
      ) : null}
      <div className="mt-1.5 text-[10px] text-slate-500">Границы — OpenStreetMap</div>
    </div>
  );
}
