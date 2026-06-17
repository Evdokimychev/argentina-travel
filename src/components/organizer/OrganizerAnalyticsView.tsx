"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarRange,
  Crown,
  Lock,
  Minus,
  TrendingUp,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import FormattedPrice from "@/components/FormattedPrice";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/cn";
import { cabinetHeroClass, cabinetLinkClass, cabinetPanelClass } from "@/lib/cabinet-ui";
import {
  getOrganizerAdvancedAnalyticsReport,
  getOrganizerBasicAnalyticsReport,
} from "@/lib/organizer-analytics-report";
import {
  getOrganizerPlan,
  getOrganizerPlanTier,
  organizerHasAdvancedAnalytics,
  setOrganizerPlanTierDemo,
} from "@/lib/organizer-plan";
import {
  ORGANIZER_PLAN_UPDATED_EVENT,
  ORGANIZER_PLANS,
  type OrganizerPlanTier,
} from "@/types/organizer-plan";
import {
  ANALYTICS_PERIOD_LABELS,
  type AnalyticsPeriod,
  type TourPerformanceRow,
} from "@/types/organizer-analytics";
import { BOOKINGS_UPDATED_EVENT } from "@/types/tourist";
import { WAITLIST_UPDATED_EVENT } from "@/types/waitlist";
import { ORGANIZER_TOURS_UPDATED_EVENT } from "@/types/organizer-tour";
import AnalyticsBarChart from "@/components/organizer/analytics/AnalyticsBarChart";
import AnalyticsTrendChart from "@/components/organizer/analytics/AnalyticsTrendChart";
import AnalyticsUpgradePanel, {
  AnalyticsLockedSection,
} from "@/components/organizer/analytics/AnalyticsUpgradePanel";
import { shouldSeedDemoData } from "@/lib/demo-mode";

function GrowthBadge({ value }: { value: number | null }) {
  if (value == null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate">
        <Minus className="h-3.5 w-3.5" aria-hidden /> —
      </span>
    );
  }
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
        positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {positive ? "+" : ""}
      {value}%
    </span>
  );
}

function KpiCard({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-3xl border bg-white p-4 shadow-card", className)}>
      <p className="text-sm text-slate">{label}</p>
      <div className="mt-2 font-heading text-2xl font-bold text-charcoal">{children}</div>
      {hint ? <p className="mt-1 text-xs text-slate">{hint}</p> : null}
    </div>
  );
}

function TourPerformanceTable({ rows }: { rows: TourPerformanceRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate">Нет данных по турам за период.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200">
      <table className="min-w-[760px] w-full text-left text-sm">
        <thead className="bg-surface-muted/60 text-slate">
          <tr>
            <th className="px-4 py-3 font-medium">Тур</th>
            <th className="px-4 py-3 font-medium">Бронирования</th>
            <th className="px-4 py-3 font-medium">Выручка</th>
            <th className="px-4 py-3 font-medium">Средний чек</th>
            <th className="px-4 py-3 font-medium">Гости</th>
            <th className="px-4 py-3 font-medium">Очередь</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.tourSlug} className="border-t border-gray-100">
              <td className="px-4 py-3">
                <Link
                  href={`/tours/${row.tourSlug}`}
                  className="font-medium text-charcoal hover:text-sky"
                >
                  {row.tourTitle}
                </Link>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {row.isPrivate ? (
                    <span className="rounded-full bg-charcoal/5 px-2 py-0.5 text-[10px] font-medium text-charcoal">
                      Приватный
                    </span>
                  ) : null}
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-slate">
                    {row.region}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 tabular-nums">{row.bookingsCount}</td>
              <td className="px-4 py-3">
                <FormattedPrice priceUsd={row.revenueUsd} className="font-medium" />
              </td>
              <td className="px-4 py-3">
                {row.averageOrderValueUsd != null ? (
                  <FormattedPrice priceUsd={row.averageOrderValueUsd} />
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 tabular-nums">{row.totalGuests}</td>
              <td className="px-4 py-3 tabular-nums">{row.waitlistCount || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function OrganizerAnalyticsView() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const [planTier, setPlanTier] = useState<OrganizerPlanTier>("starter");
  const [refreshKey, setRefreshKey] = useState(0);

  const hasAdvanced = organizerHasAdvancedAnalytics(user?.id ?? "");

  useEffect(() => {
    if (!user) return;
    setPlanTier(getOrganizerPlanTier(user.id));

    function refresh() {
      if (!user) return;
      setPlanTier(getOrganizerPlanTier(user.id));
      setRefreshKey((k) => k + 1);
    }

    window.addEventListener(BOOKINGS_UPDATED_EVENT, refresh);
    window.addEventListener(WAITLIST_UPDATED_EVENT, refresh);
    window.addEventListener(ORGANIZER_TOURS_UPDATED_EVENT, refresh);
    window.addEventListener(ORGANIZER_PLAN_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener(BOOKINGS_UPDATED_EVENT, refresh);
      window.removeEventListener(WAITLIST_UPDATED_EVENT, refresh);
      window.removeEventListener(ORGANIZER_TOURS_UPDATED_EVENT, refresh);
      window.removeEventListener(ORGANIZER_PLAN_UPDATED_EVENT, refresh);
    };
  }, [user]);

  const basic = useMemo(() => {
    if (!user) return null;
    void refreshKey;
    return getOrganizerBasicAnalyticsReport(user.id, period);
  }, [user, period, refreshKey]);

  const advanced = useMemo(() => {
    if (!user || !hasAdvanced) return null;
    void refreshKey;
    return getOrganizerAdvancedAnalyticsReport(user.id, period);
  }, [user, period, hasAdvanced, refreshKey]);

  if (!user || !basic) return null;

  const plan = getOrganizerPlan(user.id);

  return (
    <div className="space-y-6">
      <section className={cabinetHeroClass}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-sky/10 px-3 py-1 text-xs font-semibold text-sky">
              <BarChart3 className="h-3.5 w-3.5" aria-hidden />
              Аналитика
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold text-charcoal sm:text-3xl">
              Показатели бизнеса
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate">
              Отслеживайте заявки, выручку и эффективность туров — включая приватные предложения
              без публикации в каталоге.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
              <CalendarRange className="h-4 w-4 text-slate" aria-hidden />
              <NativeSelect
                value={period}
                onChange={(event) => setPeriod(event.target.value as AnalyticsPeriod)}
                className="border-0 bg-transparent py-0 pl-0 pr-8 text-sm font-medium"
              >
                {(Object.keys(ANALYTICS_PERIOD_LABELS) as AnalyticsPeriod[]).map((key) => (
                  <option key={key} value={key}>
                    {ANALYTICS_PERIOD_LABELS[key]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
                hasAdvanced
                  ? "bg-violet-100 text-violet-800"
                  : "bg-gray-100 text-slate"
              )}
            >
              {hasAdvanced ? <Crown className="h-3.5 w-3.5" aria-hidden /> : <Lock className="h-3.5 w-3.5" aria-hidden />}
              Тариф «{plan.label}»
            </span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-charcoal">Базовая аналитика</h2>
        <p className="mt-1 text-sm text-slate">
          Ключевые цифры за {basic.period.label.toLowerCase()} — доступны на всех тарифах.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Бронирования" hint="Все заявки за период">
            {basic.kpis.totalBookings}
          </KpiCard>
          <KpiCard label="Выручка" hint="Подтверждённые и завершённые" className="border-emerald-100 bg-emerald-50/30">
            <FormattedPrice priceUsd={basic.kpis.revenueUsd} />
          </KpiCard>
          <KpiCard label="Средний чек" hint="AOV по подтверждённым">
            {basic.kpis.averageOrderValueUsd != null ? (
              <FormattedPrice priceUsd={basic.kpis.averageOrderValueUsd} />
            ) : (
              "—"
            )}
          </KpiCard>
          <KpiCard label="Клиенты" hint="Уникальные email за период">
            {basic.kpis.uniqueCustomers}
          </KpiCard>
          <KpiCard label="Конверсия" hint="Подтверждение без отмен">
            {basic.kpis.conversionRate != null ? `${basic.kpis.conversionRate}%` : "—"}
          </KpiCard>
          <KpiCard label="Приватные туры" hint="Можно вести только по ссылкам">
            {basic.kpis.privateTours}
          </KpiCard>
          <KpiCard label="Лист ожидания" hint="Активные заявки">
            {basic.kpis.waitlistActive}
          </KpiCard>
          <KpiCard label="Ожидают оплаты" hint="По всем заявкам">
            {basic.kpis.pendingPayments}
          </KpiCard>
        </div>
      </section>

      <section className={cabinetPanelClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold text-charcoal">Динамика заявок</h2>
            <p className="mt-1 text-sm text-slate">Количество новых бронирований по дням</p>
          </div>
          <Link href="/organizer/bookings" className={cabinetLinkClass}>
            Все заявки
          </Link>
        </div>
        <div className="mt-4">
          <AnalyticsTrendChart points={basic.recentTrend} />
        </div>
      </section>

      <section className={cabinetPanelClass}>
        <h2 className="font-heading text-lg font-bold text-charcoal">Воронка заявок</h2>
        <p className="mt-1 text-sm text-slate">Все заявки — не только за выбранный период</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(
            [
              ["Новые", basic.funnel.new, "border-violet-100 bg-violet-50/40"],
              ["В обработке", basic.funnel.pending, "border-amber-100 bg-amber-50/40"],
              ["Подтверждены", basic.funnel.confirmed, "border-emerald-100 bg-emerald-50/40"],
              ["Завершены", basic.funnel.completed, "border-sky/20 bg-sky/5"],
              ["Отменены", basic.funnel.cancelled, "border-gray-200 bg-gray-50"],
            ] as const
          ).map(([label, value, tone]) => (
            <div key={label} className={cn("rounded-2xl border p-4", tone)}>
              <p className="text-sm text-slate">{label}</p>
              <p className="mt-2 font-heading text-3xl font-bold text-charcoal">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {!hasAdvanced ? <AnalyticsUpgradePanel /> : null}

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-violet-700" aria-hidden />
          <h2 className="font-heading text-lg font-bold text-charcoal">Расширенная аналитика</h2>
          {!hasAdvanced ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-slate">
              Тариф «Профи» и выше
            </span>
          ) : null}
        </div>

        <AnalyticsLockedSection locked={!hasAdvanced}>
          {advanced ? (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <KpiCard label="Рост бронирований" hint="К пред. периоду">
                  <GrowthBadge value={advanced.growth.bookingsChangePct} />
                </KpiCard>
                <KpiCard label="Рост выручки" hint="К пред. периоду">
                  <GrowthBadge value={advanced.growth.revenueChangePct} />
                </KpiCard>
                <KpiCard label="Рост клиентов" hint="Уникальные email">
                  <GrowthBadge value={advanced.growth.customersChangePct} />
                </KpiCard>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className={cabinetPanelClass}>
                  <h3 className="font-heading font-bold text-charcoal">Бронирования по дням</h3>
                  <div className="mt-4">
                    <AnalyticsTrendChart points={advanced.timeSeries.bookings} accentClassName="from-violet-500/80 to-violet-300/40" />
                  </div>
                </div>
                <div className={cabinetPanelClass}>
                  <h3 className="font-heading font-bold text-charcoal">Выручка по дням</h3>
                  <div className="mt-4">
                    <AnalyticsTrendChart
                      points={advanced.timeSeries.revenue}
                      formatValue={(v) => `$${v.toLocaleString("ru-RU")}`}
                      accentClassName="from-emerald-500/80 to-emerald-300/40"
                    />
                  </div>
                </div>
              </div>

              <div className={cabinetPanelClass}>
                <h3 className="font-heading font-bold text-charcoal">Публичные и приватные туры</h3>
                <p className="mt-1 text-sm text-slate">
                  Удобно, если вы публикуете только скрытые предложения и ведёте продажи по ссылкам.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-sky/20 bg-sky/5 p-4">
                    <p className="text-sm font-medium text-charcoal">Публичные</p>
                    <p className="mt-2 text-2xl font-bold">{advanced.visibilitySplit.public.bookings} заявок</p>
                    <p className="mt-1 text-sm text-slate">
                      <FormattedPrice priceUsd={advanced.visibilitySplit.public.revenueUsd} /> ·{" "}
                      {advanced.visibilitySplit.public.tours} туров
                    </p>
                  </div>
                  <div className="rounded-2xl border border-charcoal/10 bg-charcoal/[0.03] p-4">
                    <p className="text-sm font-medium text-charcoal">Приватные</p>
                    <p className="mt-2 text-2xl font-bold">{advanced.visibilitySplit.private.bookings} заявок</p>
                    <p className="mt-1 text-sm text-slate">
                      <FormattedPrice priceUsd={advanced.visibilitySplit.private.revenueUsd} /> ·{" "}
                      {advanced.visibilitySplit.private.tours} туров
                    </p>
                  </div>
                </div>
              </div>

              <div className={cabinetPanelClass}>
                <h3 className="font-heading font-bold text-charcoal">Эффективность туров</h3>
                <p className="mt-1 text-sm text-slate">Сортировка по выручке за период</p>
                <div className="mt-4">
                  <TourPerformanceTable rows={advanced.tourPerformance.slice(0, 10)} />
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <div className={cabinetPanelClass}>
                  <h3 className="font-heading font-bold text-charcoal">Регионы</h3>
                  <div className="mt-4">
                    <AnalyticsBarChart
                      items={advanced.regions.slice(0, 6).map((r) => ({
                        label: r.label,
                        value: r.revenueUsd,
                        hint: `${r.bookings} заявок · ${r.sharePct}%`,
                      }))}
                      formatValue={(v) => `$${v.toLocaleString("ru-RU")}`}
                    />
                  </div>
                </div>
                <div className={cabinetPanelClass}>
                  <h3 className="font-heading font-bold text-charcoal">Типы активности</h3>
                  <div className="mt-4">
                    <AnalyticsBarChart
                      items={advanced.activities.slice(0, 6).map((r) => ({
                        label: r.label,
                        value: r.bookings,
                        hint: `$${r.revenueUsd.toLocaleString("ru-RU")}`,
                      }))}
                      barClassName="bg-violet-500"
                    />
                  </div>
                </div>
                <div className={cabinetPanelClass}>
                  <h3 className="font-heading font-bold text-charcoal">Формат</h3>
                  <div className="mt-4">
                    <AnalyticsBarChart
                      items={advanced.tourTypes.map((r) => ({
                        label: r.label,
                        value: r.revenueUsd,
                        hint: `${r.bookings} заявок`,
                      }))}
                      formatValue={(v) => `$${v.toLocaleString("ru-RU")}`}
                      barClassName="bg-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className={cabinetPanelClass}>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-sky" aria-hidden />
                    <h3 className="font-heading font-bold text-charcoal">Клиенты</h3>
                  </div>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-gray-50 px-3 py-2.5">
                      <dt className="text-xs text-slate">Уникальные</dt>
                      <dd className="text-lg font-bold">{advanced.customers.uniqueTotal}</dd>
                    </div>
                    <div className="rounded-xl bg-gray-50 px-3 py-2.5">
                      <dt className="text-xs text-slate">Повторные</dt>
                      <dd className="text-lg font-bold">
                        {advanced.customers.returningCount}
                        {advanced.customers.returningRatePct != null
                          ? ` (${advanced.customers.returningRatePct}%)`
                          : ""}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-gray-50 px-3 py-2.5">
                      <dt className="text-xs text-slate">Гостей в заявке</dt>
                      <dd className="text-lg font-bold">
                        {advanced.customers.averageGuestsPerBooking ?? "—"}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-gray-50 px-3 py-2.5">
                      <dt className="text-xs text-slate">Срок до тура</dt>
                      <dd className="text-lg font-bold">
                        {advanced.customers.averageLeadTimeDays != null
                          ? `${advanced.customers.averageLeadTimeDays} дн.`
                          : "—"}
                      </dd>
                    </div>
                  </dl>
                  {advanced.customers.topSpenders.length > 0 ? (
                    <ul className="mt-4 space-y-2">
                      {advanced.customers.topSpenders.map((customer) => (
                        <li
                          key={customer.contactEmail}
                          className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 text-sm"
                        >
                          <div>
                            <p className="font-medium text-charcoal">
                              {customer.contactName || customer.contactEmail}
                            </p>
                            <p className="text-xs text-slate">
                              {customer.bookingsCount} заявок
                              {customer.isReturning ? " · повторный" : ""}
                            </p>
                          </div>
                          <FormattedPrice priceUsd={customer.revenueUsd} className="font-semibold" />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                <div className={cabinetPanelClass}>
                  <h3 className="font-heading font-bold text-charcoal">Лист ожидания и оплаты</h3>
                  <dl className="mt-4 space-y-3">
                    <div className="flex justify-between rounded-xl bg-violet-50/60 px-3 py-2.5 text-sm">
                      <span className="text-slate">Всего в очереди</span>
                      <span className="font-semibold">{advanced.waitlist.totalEntries}</span>
                    </div>
                    <div className="flex justify-between rounded-xl bg-violet-50/60 px-3 py-2.5 text-sm">
                      <span className="text-slate">Переведено в бронирование</span>
                      <span className="font-semibold">
                        {advanced.waitlist.convertedCount}
                        {advanced.waitlist.conversionRatePct != null
                          ? ` (${advanced.waitlist.conversionRatePct}%)`
                          : ""}
                      </span>
                    </div>
                    <div className="flex justify-between rounded-xl bg-emerald-50/60 px-3 py-2.5 text-sm">
                      <span className="text-slate">Получено оплат</span>
                      <FormattedPrice priceUsd={advanced.payments.collectedUsd} className="font-semibold" />
                    </div>
                    <div className="flex justify-between rounded-xl bg-amber-50/60 px-3 py-2.5 text-sm">
                      <span className="text-slate">Ожидается</span>
                      <FormattedPrice priceUsd={advanced.payments.outstandingUsd} className="font-semibold" />
                    </div>
                  </dl>
                </div>
              </div>

              {advanced.monthlySeries.length > 0 ? (
                <div className={cabinetPanelClass}>
                  <h3 className="font-heading font-bold text-charcoal">Помесячная динамика</h3>
                  <div className="mt-4">
                    <AnalyticsBarChart
                      items={advanced.monthlySeries.map((m) => ({
                        label: m.label,
                        value: m.revenueUsd,
                        hint: `${m.bookings} заявок`,
                      }))}
                      formatValue={(v) => `$${v.toLocaleString("ru-RU")}`}
                      barClassName="bg-sky"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </AnalyticsLockedSection>
      </section>

      {shouldSeedDemoData() ? (
        <section className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/80 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate">Демо тарифов</p>
          <p className="mt-1 text-sm text-slate">
            Переключите тариф, чтобы проверить базовую и расширенную аналитику до подключения биллинга.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(ORGANIZER_PLANS) as OrganizerPlanTier[]).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setOrganizerPlanTierDemo(user.id, tier)}
                className={cn(
                  "rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors",
                  planTier === tier
                    ? "border-sky bg-sky text-white"
                    : "border-gray-200 bg-white text-charcoal hover:border-sky/40"
                )}
              >
                {ORGANIZER_PLANS[tier].label}
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
