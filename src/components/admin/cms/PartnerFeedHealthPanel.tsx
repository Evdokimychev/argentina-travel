"use client";

import { useEffect, useState } from "react";
import { cabinetCardClass } from "@/lib/cabinet-ui";

type PartnerFreshness = "fresh" | "warning" | "stale" | "critical" | "unknown";

type PartnerProbe = {
  status: "ok" | "degraded" | "down";
  count: number | null;
  lastSyncStatus: string | null;
  lastSyncAt: string | null;
  freshness: PartnerFreshness;
};

type PartnersHealthResponse = {
  status: "ok" | "degraded" | "down";
  generatedAt: string;
  partners: {
    tripster: PartnerProbe;
    youtravel: PartnerProbe;
    sputnik8: PartnerProbe;
  };
};

const FRESHNESS_LABEL: Record<PartnerFreshness, string> = {
  fresh: "актуально",
  warning: "скоро устареет",
  stale: "устарело",
  critical: "критически устарело",
  unknown: "нет данных",
};

const STATUS_CLASS: Record<PartnerProbe["status"], string> = {
  ok: "bg-emerald-50 text-emerald-700",
  degraded: "bg-amber-50 text-amber-800",
  down: "bg-rose-50 text-rose-700",
};

function formatSyncAt(value: string | null): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Argentina/Buenos_Aires",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function PartnerFeedHealthPanel() {
  const [data, setData] = useState<PartnersHealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/health/partners", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as PartnersHealthResponse | null;
        if (!payload?.partners) {
          throw new Error("Не удалось прочитать статус партнёрских лент");
        }
        setData(payload);
        setError(null);
      })
      .catch((cause) => {
        if (!(cause instanceof DOMException && cause.name === "AbortError")) {
          setError(cause instanceof Error ? cause.message : "Ошибка загрузки");
        }
      });
    return () => controller.abort();
  }, []);

  const rows = data
    ? ([
        ["Tripster", data.partners.tripster],
        ["YouTravel", data.partners.youtravel],
        ["Sputnik8", data.partners.sputnik8],
      ] as const)
    : [];

  return (
    <section className={`${cabinetCardClass} space-y-4 p-5`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-ink">
          Marketplace Sprint 2
        </p>
        <h2 className="mt-1 font-heading text-lg font-bold text-foreground">
          Здоровье партнёрских лент
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate">
          Последняя успешная синхронизация, свежесть данных и объём зеркала в базе. Публичный каталог
          не обязан показывать всё, что пришло из API.
        </p>
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      {!data && !error ? (
        <p className="text-sm text-slate">Загрузка…</p>
      ) : null}

      {data ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate">
              <tr>
                <th className="py-2 pr-4 font-semibold">Партнёр</th>
                <th className="py-2 pr-4 font-semibold">Статус</th>
                <th className="py-2 pr-4 font-semibold">Записей</th>
                <th className="py-2 pr-4 font-semibold">Синхронизация</th>
                <th className="py-2 pr-4 font-semibold">Свежесть</th>
                <th className="py-2 font-semibold">Последний sync</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([name, probe]) => (
                <tr key={name} className="border-t border-border/60">
                  <td className="py-3 pr-4 font-medium text-foreground">{name}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[probe.status]}`}
                    >
                      {probe.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-slate">{probe.count ?? "—"}</td>
                  <td className="py-3 pr-4 text-slate">{probe.lastSyncStatus ?? "—"}</td>
                  <td className="py-3 pr-4 text-slate">{FRESHNESS_LABEL[probe.freshness]}</td>
                  <td className="py-3 text-slate">{formatSyncAt(probe.lastSyncAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate">
            Обновлено: {formatSyncAt(data.generatedAt)}. Повторный аудит публикации каталога —
            команда marketplace:quality в репозитории.
          </p>
        </div>
      ) : null}
    </section>
  );
}
