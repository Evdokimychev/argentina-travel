"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { CmsCutoverLane, CmsCutoverLaneStats, CmsCutoverReadiness } from "@/lib/cms/cms-cutover";

const LANE_LABELS: Record<CmsCutoverLane, string> = {
  blog: "Блог",
  guide: "Путеводитель (/guide/*)",
  destination: "Направления (/destinations/*)",
  place: "Места (/places/*)",
};

type Response = {
  readiness?: CmsCutoverReadiness;
  error?: string;
};

type EnableResponse = {
  ok?: boolean;
  readiness?: CmsCutoverReadiness;
  error?: string;
  missingSlugs?: string[];
  message?: string;
};

function StatusBadge({ stats }: { stats: CmsCutoverLaneStats }) {
  if (stats.cutover && !stats.ready) {
    return (
      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
        CMS-only без покрытия
      </span>
    );
  }
  if (stats.cutover) {
    return (
      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
        CMS-only
      </span>
    );
  }
  return (
    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-slate">
      Hybrid (TS + CMS)
    </span>
  );
}

function LaneActions({
  lane,
  stats,
  busy,
  onToggle,
}: {
  lane: CmsCutoverLane;
  stats: CmsCutoverLaneStats;
  busy: boolean;
  onToggle: (lane: CmsCutoverLane, enable: boolean) => void;
}) {
  if (stats.cutover) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => onToggle(lane, false)}
      >
        Вернуть hybrid
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      disabled={busy || !stats.canEnable}
      onClick={() => onToggle(lane, true)}
    >
      Включить CMS-only
    </Button>
  );
}

export default function CmsCutoverPanel() {
  const [data, setData] = useState<CmsCutoverReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyLane, setBusyLane] = useState<CmsCutoverLane | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cms/cutover-status");
      const json = (await res.json()) as Response;
      setData(json.readiness ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function toggleCutover(lane: CmsCutoverLane, enable: boolean) {
    const label = LANE_LABELS[lane];
    const confirmed = window.confirm(
      enable
        ? `Включить CMS-only для «${label}»? TS fallback отключится на публичных страницах.`
        : `Вернуть hybrid для «${label}»?`
    );
    if (!confirmed) return;

    setBusyLane(lane);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/cms/cutover-enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [lane]: enable }),
      });
      const json = (await res.json()) as EnableResponse;
      if (!res.ok) {
        const missing =
          json.missingSlugs?.length ? `\nНе хватает: ${json.missingSlugs.slice(0, 8).join(", ")}` : "";
        throw new Error((json.error ?? "Ошибка cutover") + missing);
      }
      setData(json.readiness ?? null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Ошибка cutover");
    } finally {
      setBusyLane(null);
    }
  }

  return (
    <section className={`${cabinetCardClass} space-y-4 p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-charcoal">CMS cutover</h2>
          <p className="mt-1 text-sm text-slate">
            Переключение контента на единственный источник — CMS. Требуется 100% покрытие TS-slug
            complete-документами (ru).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/content/documents"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Импорт из TS
          </Link>
          <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => void loadStatus()}>
            Обновить
          </Button>
        </div>
      </div>

      {loading ? <p className="text-sm text-slate">Загрузка статуса…</p> : null}

      {actionError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{actionError}</p>
      ) : null}

      {data ? (
        <dl className="grid gap-4 sm:grid-cols-2">
          {(Object.keys(LANE_LABELS) as CmsCutoverLane[]).map((lane) => {
            const stats = data[lane];
            return (
              <div key={lane} className="space-y-3 rounded-xl border border-gray-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <dt className="font-medium text-charcoal">{LANE_LABELS[lane]}</dt>
                  <StatusBadge stats={stats} />
                </div>
                <dd className="space-y-1 text-sm text-slate">
                  <p>TS seed: {stats.tsCount}</p>
                  <p>CMS complete (ru): {stats.cmsCompletePublished}</p>
                  <p>Покрытие: {stats.coveragePercent}%</p>
                  {stats.missingSlugs.length ? (
                    <p className="text-xs text-amber-800">
                      Нет в CMS ({stats.missingSlugs.length}):{" "}
                      {stats.missingSlugs.slice(0, 5).join(", ")}
                      {stats.missingSlugs.length > 5 ? "…" : ""}
                    </p>
                  ) : stats.canEnable ? (
                    <p className="text-xs text-emerald-700">Готово к cutover</p>
                  ) : null}
                </dd>
                <LaneActions
                  lane={lane}
                  stats={stats}
                  busy={busyLane === lane}
                  onToggle={(l, enable) => void toggleCutover(l, enable)}
                />
              </div>
            );
          })}
        </dl>
      ) : null}
    </section>
  );
}
