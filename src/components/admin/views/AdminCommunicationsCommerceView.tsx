import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  CreditCard,
  Eye,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import type {
  CommunicationsCommerceReadiness,
  ProviderReadiness,
  ReadinessStatus,
} from "@/lib/admin/communications-commerce-readiness";
import { cabinetCardClass, cabinetHeroClass, cabinetStatCardClass } from "@/lib/cabinet-ui";

const statusMeta: Record<ReadinessStatus, { label: string; className: string }> = {
  ready: {
    label: "Готово",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  configured: {
    label: "Настроено, не проверено",
    className: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  partial: {
    label: "Нужна настройка",
    className: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  not_configured: {
    label: "Не подключено",
    className: "bg-slate-100 text-slate-600 ring-slate-200",
  },
};

function ProviderCard({ provider }: { provider: ProviderReadiness }) {
  const meta = statusMeta[provider.status];

  return (
    <section className={`${cabinetStatCardClass} space-y-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Подключение
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">{provider.title}</h2>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${meta.className}`}
        >
          {meta.label}
        </span>
      </div>

      <ul className="space-y-2.5">
        {provider.checks.map((check) => (
          <li className="flex items-start gap-2 text-sm text-slate-600" key={check.key}>
            {check.ready ? (
              <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            ) : (
              <CircleDashed aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-400" />
            )}
            <span>{check.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AdminCommunicationsCommerceView({
  readiness,
}: {
  readiness: CommunicationsCommerceReadiness;
}) {
  const email = readiness.providers.find((provider) => provider.id === "email");
  const paymentProviders = readiness.providers.filter((provider) => provider.id !== "email");

  return (
    <CapabilityGate capability="dashboard.view">
      <AdminPageShell>
        <AdminPageHeader
          title="Коммуникации и платежи"
          subtitle="Единый безопасный обзор готовности писем и платёжных подключений — без доступа к секретам и без внешних действий."
        />

        <div className="space-y-6">
          <section className={`${cabinetHeroClass} overflow-hidden`}>
            <div className="grid gap-5 p-6 lg:grid-cols-[1.3fr_0.7fr] lg:p-8">
              <div>
                <div className="flex size-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <ShieldCheck aria-hidden="true" className="size-5" />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-slate-950">
                  Здесь можно проверить готовность, но нельзя случайно запустить отправку или оплату
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Экран показывает только наличие обязательных частей подключения. Значения ключей,
                  адресов и других конфиденциальных данных никогда не выводятся.
                </p>
              </div>
              <div className="rounded-2xl border border-sky-200 bg-white/80 p-4">
                <p className="text-sm font-semibold text-slate-900">Режим платежей</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {readiness.paymentSandboxMode
                    ? "Тестовый режим подтверждён настройкой проекта."
                    : "Тестовый режим не подтверждён. Перед проверкой оплаты уточните среду и настройки проекта."}
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-3">
            {readiness.providers.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className={`${cabinetCardClass} p-0`}>
              <div className="border-b border-slate-200 p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                    <Mail aria-hidden="true" className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">Предпросмотр письма</h2>
                    <p className="text-sm text-slate-500">Пример — письмо не отправляется</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-5 sm:p-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <dl className="grid gap-2 text-slate-600 sm:grid-cols-[110px_1fr]">
                    <dt className="font-medium text-slate-500">Получатель</dt>
                    <dd>Администратор проекта</dd>
                    <dt className="font-medium text-slate-500">Тема</dt>
                    <dd>Новое бронирование: Буэнос-Айрес за один день</dd>
                  </dl>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
                    Пора в Аргентину
                  </p>
                  <h3 className="mt-3 text-xl font-semibold text-slate-950">Получена новая заявка</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Анна Петрова хочет забронировать экскурсию для двух путешественников на 18
                    сентября. Номер примера: AR-1042.
                  </p>
                  <div className="mt-5 rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white">
                    Посмотреть детали заявки
                  </div>
                </div>
                <p className="flex items-start gap-2 text-xs leading-5 text-slate-500">
                  <Eye aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  Готовность отправки: {email ? statusMeta[email.status].label.toLowerCase() : "неизвестна"}.
                  Это демонстрационный контент, не реальные данные клиента.
                </p>
              </div>
            </section>

            <section className={`${cabinetCardClass} p-5 sm:p-6`}>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <CreditCard aria-hidden="true" className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Рабочие журналы</h2>
                  <p className="text-sm text-slate-500">Переходы к уже существующим разделам</p>
                </div>
              </div>

              <div className="mt-5 divide-y divide-slate-200 rounded-2xl border border-slate-200">
                {[
                  ["Очередь писем", "Ошибки, повторные попытки и восстановление", "/admin/operations/email"],
                  ["Платежи", "Состояния операций и возвратов", "/admin/operations/payments"],
                  ["Сверка", "Расхождения и ручная проверка", "/admin/operations/reconciliation"],
                  ["Бронирования", "Заявки туристов и статусы", "/admin/operations/bookings"],
                  ["Обращения", "Входящие запросы и контакты", "/admin/operations/leads"],
                ].map(([title, description, href]) => (
                  <Link
                    className="group flex items-center justify-between gap-4 px-4 py-3.5 transition hover:bg-slate-50"
                    href={href}
                    key={href}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{title}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-sky-600"
                    />
                  </Link>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                Этот раздел не включает платёжные системы и не меняет их порядок. Подключение,
                тестирование и публикация выполняются отдельно с обязательной проверкой среды.
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-500">
              Подключений, готовых по всем проверкам:{" "}
              {paymentProviders.filter((provider) => provider.status === "ready").length} из{" "}
              {paymentProviders.length}.
              </p>
            </section>
          </div>
        </div>
      </AdminPageShell>
    </CapabilityGate>
  );
}
