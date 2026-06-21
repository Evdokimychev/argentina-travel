"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { CmsCutoverReadiness } from "@/lib/cms/cms-cutover";

type Response = {
  readiness?: CmsCutoverReadiness;
  error?: string;
};

function StatusBadge({ ready, cutover }: { ready: boolean; cutover: boolean }) {
  if (cutover && !ready) {
    return (
      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
        Cutover без CMS-контента
      </span>
    );
  }
  if (cutover) {
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

export default function CmsCutoverPanel() {
  const [data, setData] = useState<CmsCutoverReadiness | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/cms/cutover-status")
      .then((res) => res.json())
      .then((json: Response) => {
        if (!cancelled) setData(json.readiness ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className={`${cabinetCardClass} space-y-4 p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-charcoal">CMS cutover (D4)</h2>
          <p className="mt-1 text-sm text-slate">
            Флаги «CMS-only» в блоке «Функции» ниже. Перед включением импортируйте контент из TS.
          </p>
        </div>
        <Link
          href="/admin/content/documents"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Документы контента
        </Link>
      </div>

      {loading ? <p className="text-sm text-slate">Загрузка статуса…</p> : null}

      {data ? (
        <dl className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["blog", "Блог", data.blog],
              ["guide", "Путеводитель (/guide/*)", data.guide],
            ] as const
          ).map(([key, label, stats]) => (
            <div key={key} className="rounded-xl border border-gray-100 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="font-medium text-charcoal">{label}</dt>
                <StatusBadge ready={stats.ready} cutover={stats.cutover} />
              </div>
              <dd className="mt-2 space-y-1 text-sm text-slate">
                <p>TS seed: {stats.tsCount}</p>
                <p>CMS published (ru): {stats.cmsPublished}</p>
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
