"use client";

import Link from "next/link";
import { ArrowRight, CircleAlert, CircleCheckBig, CircleHelp } from "lucide-react";
import { useAdminContext } from "@/context/AdminContext";
import { useAdminApi } from "@/hooks/useAdminApi";
import type {
  OwnerOnboardingItemStatus,
  OwnerOnboardingSnapshot,
} from "@/lib/admin/owner-onboarding-server";
import { cabinetCardClass } from "@/lib/cabinet-ui";

type Response = { snapshot?: OwnerOnboardingSnapshot };

const STATUS_META: Record<
  OwnerOnboardingItemStatus,
  { label: string; className: string; icon: typeof CircleCheckBig }
> = {
  complete: {
    label: "Готово",
    className: "bg-emerald-50 text-emerald-700",
    icon: CircleCheckBig,
  },
  attention: {
    label: "Нужно сделать",
    className: "bg-amber-50 text-amber-800",
    icon: CircleAlert,
  },
  unavailable: {
    label: "Нет данных",
    className: "bg-gray-100 text-slate",
    icon: CircleHelp,
  },
};

export default function AdminOwnerOnboardingChecklist() {
  const { data, loading, error } = useAdminApi<Response>("/api/admin/owner-onboarding");
  const { hasCapability, loading: permissionsLoading } = useAdminContext();
  const items = (data?.snapshot?.items ?? []).filter((item) =>
    hasCapability(item.requiredCapability),
  );

  if (loading || permissionsLoading) {
    return (
      <section className={`${cabinetCardClass} animate-pulse p-5`} aria-label="Загрузка первых шагов">
        <div className="h-5 w-52 rounded bg-gray-100" />
        <div className="mt-3 h-4 w-80 max-w-full rounded bg-gray-100" />
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <div className="h-28 rounded-2xl bg-gray-100" />
          <div className="h-28 rounded-2xl bg-gray-100" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={`${cabinetCardClass} p-5`} aria-labelledby="owner-onboarding-heading">
        <h2 id="owner-onboarding-heading" className="font-heading text-lg font-bold text-charcoal">
          Первые шаги владельца
        </h2>
        <p className="mt-2 text-sm text-slate">
          Нет данных для чек-листа. Обновите страницу позже — готовые пункты не подставляются вручную.
        </p>
      </section>
    );
  }

  if (items.length === 0) return null;

  const completeCount = items.filter((item) => item.status === "complete").length;
  return (
    <section className={`${cabinetCardClass} p-5`} aria-labelledby="owner-onboarding-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-ink">
            Реальное состояние сайта
          </p>
          <h2 id="owner-onboarding-heading" className="mt-1 font-heading text-lg font-bold text-charcoal">
            Первые шаги владельца
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate">
            Пункты закрываются автоматически только после сохранения или подтверждённой проверки.
          </p>
        </div>
        <span className="rounded-full bg-surface-muted px-3 py-1.5 text-xs font-semibold text-charcoal">
          Готово {completeCount} из {items.length}
        </span>
      </div>

      <ol className="mt-5 grid gap-3 lg:grid-cols-2">
        {items.map((item) => {
          const meta = STATUS_META[item.status];
          const Icon = meta.icon;
          return (
            <li key={item.id} className="rounded-2xl border border-border-subtle bg-surface-muted/45 p-4">
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.className}`}>
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-semibold text-charcoal">{item.title}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-slate">{item.description}</p>
                  <p className="mt-2 text-xs font-medium text-charcoal">{item.fact}</p>
                  {item.status !== "complete" ? (
                    <Link
                      href={item.href}
                      className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-sky-ink hover:underline"
                    >
                      {item.linkLabel}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
