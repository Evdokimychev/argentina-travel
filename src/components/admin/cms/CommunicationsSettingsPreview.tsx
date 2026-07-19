import {
  BellRing,
  CheckCircle2,
  Mail,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import { cn } from "@/lib/cn";
import {
  normalizeSiteEmail,
  normalizeSiteForms,
  normalizeSiteMarketing,
} from "@/lib/cms/site-globals/normalize";
import { isCaptchaRequired, type CaptchaFormId } from "@/lib/forms/captcha-policy";
import type {
  IntegrationReadinessItem,
  IntegrationReadinessStatus,
} from "@/lib/integrations/admin-readiness";
import type {
  SiteEmailGlobal,
  SiteFormsGlobal,
  SiteMarketingGlobal,
} from "@/types/site-globals";

export type CommunicationsSettingsPreviewProps = {
  marketingValues?: Partial<SiteMarketingGlobal> | Record<string, unknown>;
  formsValues?: Partial<SiteFormsGlobal> | Record<string, unknown>;
  emailValues?: Partial<SiteEmailGlobal> | Record<string, unknown>;
  integrations?: IntegrationReadinessItem[];
};

type PreviewState = "ready" | "warning" | "off" | "unknown";

const STATE_META: Record<PreviewState, { className: string; icon: typeof CheckCircle2 }> = {
  ready: { className: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  warning: { className: "bg-amber-50 text-amber-800", icon: TriangleAlert },
  off: { className: "bg-surface-muted text-slate", icon: ShieldCheck },
  unknown: { className: "bg-surface-muted text-slate", icon: TriangleAlert },
};

const READINESS_LABELS: Record<IntegrationReadinessStatus, string> = {
  ready: "Подключено",
  partial: "Настроено частично",
  missing: "Не настроено",
  built_in: "Работает",
  planned: "Следующий этап",
};

const ANNOUNCEMENT_TONE_CLASS: Record<SiteMarketingGlobal["announcementTone"], string> = {
  sky: "border-sky/25 bg-sky/10 text-sky-ink",
  wine: "border-wine/20 bg-wine/10 text-wine",
  neutral: "border-border-subtle bg-surface-muted text-foreground",
};

const CAPTCHA_FORM_LABELS: ReadonlyArray<{ id: CaptchaFormId; label: string }> = [
  { id: "native_booking", label: "Собственное бронирование" },
  { id: "waitlist", label: "Лист ожидания" },
  { id: "shop_order", label: "Заказ магазина" },
  { id: "partner_booking", label: "Партнёрская заявка" },
];

function isReadinessOperational(item: IntegrationReadinessItem | undefined): boolean {
  return item?.status === "ready" || item?.status === "built_in";
}

function readinessState(item: IntegrationReadinessItem | undefined): PreviewState {
  if (!item) return "unknown";
  if (isReadinessOperational(item)) return "ready";
  if (item.status === "planned" || item.status === "missing" || item.status === "partial") {
    return "warning";
  }
  return "unknown";
}

function StatusBadge({ state, children }: { state: PreviewState; children: React.ReactNode }) {
  const meta = STATE_META[state];
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        meta.className,
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
      {children}
    </span>
  );
}

function ReadinessNote({
  label,
  item,
}: {
  label: string;
  item: IntegrationReadinessItem | undefined;
}) {
  const state = readinessState(item);
  const statusLabel = item ? READINESS_LABELS[item.status] : "Статус не получен";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-subtle bg-white px-3 py-2.5 dark:bg-surface-elevated">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <StatusBadge state={state}>{statusLabel}</StatusBadge>
    </div>
  );
}

function captchaStatus(
  forms: SiteFormsGlobal,
  formId: CaptchaFormId,
  captchaReadiness: IntegrationReadinessItem | undefined,
): { state: PreviewState; label: string } {
  if (!isCaptchaRequired(forms, formId)) {
    return { state: "off", label: "Не требуется" };
  }
  if (!captchaReadiness) {
    return { state: "unknown", label: "Выбрана, статус неизвестен" };
  }
  if (!isReadinessOperational(captchaReadiness)) {
    return { state: "warning", label: "Выбрана, но не готова" };
  }
  return { state: "ready", label: "Активна" };
}

export default function CommunicationsSettingsPreview({
  marketingValues,
  formsValues,
  emailValues,
  integrations,
}: CommunicationsSettingsPreviewProps) {
  const marketing = normalizeSiteMarketing(marketingValues);
  const forms = normalizeSiteForms(formsValues);
  const email = normalizeSiteEmail(emailValues);
  const readiness = integrations ?? [];
  const emailReadiness = readiness.find((item) => item.id === "email");
  const captchaReadiness = readiness.find((item) => item.id === "captcha");
  const rateLimitReadiness = readiness.find((item) => item.id === "form-rate-limit");
  const emailOperational = isReadinessOperational(emailReadiness);
  const announcementText = marketing.announcementText.trim();
  const announcementVisible = marketing.announcementEnabled && Boolean(announcementText);

  const publicForms = [
    {
      id: "contact" as const,
      label: "Контактная форма",
      enabled: forms.contactEnabled,
    },
    {
      id: "newsletter" as const,
      label: "Подписка на новости",
      enabled: forms.newsletterEnabled,
    },
  ];

  const emailScenarios = [
    {
      id: "booking",
      label: "Бронирование и изменение статуса",
      description: "Подтверждение заявки и важные изменения для путешественника.",
      required: true,
      enabled: true,
    },
    {
      id: "payment",
      label: "Получение оплаты",
      description: "Подтверждение полученной денежной операции.",
      required: true,
      enabled: true,
    },
    {
      id: "booking-lookup",
      label: "Код поиска заявки",
      description: "Одноразовый код для безопасного доступа к существующей заявке.",
      required: true,
      enabled: true,
    },
    {
      id: "privacy",
      label: "Запросы о персональных данных",
      description: "Подтверждение завершения обязательной операции с данными.",
      required: true,
      enabled: true,
    },
    {
      id: "leads",
      label: "Новые обращения",
      description: "Оперативное уведомление команды о новой заявке или вопросе.",
      required: false,
      enabled: email.leadAlertsEnabled,
    },
    {
      id: "organizers",
      label: "Уведомления организаторам",
      description: "Сообщения о действиях, требующих внимания организатора.",
      required: false,
      enabled: email.organizerAlertsEnabled,
    },
    {
      id: "daily-digest",
      label: "Ежедневная сводка",
      description: "Сводное служебное письмо вместо множества отдельных уведомлений.",
      required: false,
      enabled: email.dailyDigestEnabled,
    },
    {
      id: "content-freshness",
      label: "Актуальность контента",
      description: "Напоминания редакции о материалах, которые пора проверить.",
      required: false,
      enabled: email.contentFreshnessAlertsEnabled,
    },
  ];

  return (
    <section
      className={`${cabinetCardClass} space-y-6 p-5`}
      aria-labelledby="communications-settings-preview-title"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-ink">
          Живой предпросмотр
        </p>
        <h2
          id="communications-settings-preview-title"
          className="mt-1 font-heading text-lg font-bold text-foreground"
        >
          Объявления, формы и системные письма
        </h2>
        <p className="mt-1 max-w-4xl text-sm leading-6 text-slate">
          Здесь показано, что увидит посетитель и какие служебные сценарии действительно готовы.
          Секретные ключи и их значения в предпросмотр не передаются.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-2xl border border-border-subtle bg-surface-muted/45 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <BellRing className="h-4 w-4 text-sky-ink" aria-hidden />
                Объявление в шапке
              </p>
              <p className="mt-1 text-xs leading-5 text-slate">
                Показывается только когда переключатель включён и текст заполнен.
              </p>
            </div>
            <StatusBadge
              state={announcementVisible ? "ready" : marketing.announcementEnabled ? "warning" : "off"}
            >
              {announcementVisible
                ? "Будет показано"
                : marketing.announcementEnabled
                  ? "Добавьте текст"
                  : "Отключено"}
            </StatusBadge>
          </div>

          <div
            className={cn(
              "mt-4 flex min-h-12 items-center justify-between gap-4 rounded-xl border px-3 py-2.5 text-xs",
              ANNOUNCEMENT_TONE_CLASS[marketing.announcementTone],
              !announcementVisible && "opacity-55",
            )}
            aria-live="polite"
          >
            <span className="font-medium">
              {announcementText || "Здесь появится текст объявления"}
            </span>
            <span className="shrink-0 font-semibold">
              {marketing.announcementCtaLabel.trim() || "Подробнее"} →
            </span>
          </div>
          <p className="mt-3 text-xs text-slate">
            На мобильных: {marketing.announcementOnMobile ? "показывается" : "скрыто"}. Ссылка: {" "}
            <span className="break-all font-medium text-foreground">
              {marketing.announcementHref || "/services"}
            </span>
          </p>
        </article>

        <article className="rounded-2xl border border-border-subtle bg-surface-muted/45 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-sky-ink" aria-hidden />
            Защита публичных форм
          </p>
          <p className="mt-1 text-xs leading-5 text-slate">
            CAPTCHA включается только для выбранных отправок и только при готовой серверной
            интеграции.
          </p>
          <div className="mt-4 space-y-2">
            <ReadinessNote label="Ограничение частоты и базовая защита" item={rateLimitReadiness} />
            <ReadinessNote label="CAPTCHA Cloudflare Turnstile" item={captchaReadiness} />
          </div>
          <p className="mt-3 text-xs font-medium text-foreground">
            Режим: {forms.captchaMode === "off"
              ? "выключена"
              : forms.captchaMode === "selected"
                ? "только выбранные формы"
                : "все гостевые отправки"}
          </p>
        </article>
      </div>

      <article className="overflow-hidden rounded-2xl border border-border-subtle">
        <div className="border-b border-border-subtle bg-surface-muted/45 px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Доступность форм</h3>
          <p className="mt-1 text-xs text-slate">
            Отключённая форма перестаёт принимать новые отправки; сохранённые обращения не удаляются.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-xs">
            <thead className="bg-white text-slate dark:bg-surface-elevated">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Форма</th>
                <th scope="col" className="px-4 py-3 font-medium">Приём обращений</th>
                <th scope="col" className="px-4 py-3 font-medium">CAPTCHA</th>
                <th scope="col" className="px-4 py-3 font-medium">Серверная защита</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle bg-white dark:bg-surface-elevated">
              {publicForms.map((form) => {
                const protection = captchaStatus(forms, form.id, captchaReadiness);
                return (
                  <tr key={form.id}>
                    <th scope="row" className="px-4 py-3 font-semibold text-foreground">
                      {form.label}
                    </th>
                    <td className="px-4 py-3">
                      <StatusBadge state={form.enabled ? "ready" : "off"}>
                        {form.enabled ? "Принимает" : "Отключена"}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge state={protection.state}>{protection.label}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-slate">
                      {rateLimitReadiness
                        ? READINESS_LABELS[rateLimitReadiness.status]
                        : "Статус не получен"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border-subtle bg-surface-muted/30 px-4 py-3">
          {CAPTCHA_FORM_LABELS.map((form) => {
            const status = captchaStatus(forms, form.id, captchaReadiness);
            return (
              <StatusBadge key={form.id} state={status.state}>
                {form.label}: {status.label}
              </StatusBadge>
            );
          })}
        </div>
      </article>

      <article className="rounded-2xl border border-border-subtle bg-surface-muted/45 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Mail className="h-4 w-4 text-sky-ink" aria-hidden />
              Системные email-сценарии
            </p>
            <p className="mt-1 text-xs leading-5 text-slate">
              Обязательные письма нельзя отключить настройкой. Операционные сводки и уведомления
              можно остановить без влияния на бронирования и безопасность.
            </p>
          </div>
          <StatusBadge state={readinessState(emailReadiness)}>
            Почтовый канал: {emailReadiness ? READINESS_LABELS[emailReadiness.status] : "нет данных"}
          </StatusBadge>
        </div>

        <div className="mt-4 rounded-xl border border-border-subtle bg-white p-3 text-xs dark:bg-surface-elevated">
          <p className="font-semibold text-foreground">
            Отправитель: {email.senderName.trim() || "Имя не заполнено"}
          </p>
          <p className="mt-1 text-slate">
            Ответы: {email.replyToEmail?.trim() || "адрес по умолчанию"}
          </p>
          <p className="mt-1 line-clamp-2 text-slate">
            Подвал: {email.footerText.trim() || "текст не задан"}
          </p>
        </div>

        <ul className="mt-4 grid gap-3 md:grid-cols-2" aria-label="Каталог системных email-сценариев">
          {emailScenarios.map((scenario) => {
            const deliveryState: PreviewState = !scenario.enabled
              ? "off"
              : !emailReadiness
                ? "unknown"
                : emailOperational
                  ? "ready"
                  : "warning";
            const deliveryLabel = !scenario.enabled
              ? "Отключено"
              : !emailReadiness
                ? "Включено, статус канала неизвестен"
                : emailOperational
                  ? "Готово к отправке"
                  : "Включено, канал не готов";

            return (
              <li key={scenario.id} className="rounded-xl border border-border-subtle bg-white p-3 dark:bg-surface-elevated">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-foreground">{scenario.label}</p>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    scenario.required
                      ? "bg-sky/10 text-sky-ink"
                      : "bg-surface-muted text-slate",
                  )}>
                    {scenario.required ? "Обязательное" : "Можно отключить"}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate">{scenario.description}</p>
                <div className="mt-2">
                  <StatusBadge state={deliveryState}>{deliveryLabel}</StatusBadge>
                </div>
              </li>
            );
          })}
        </ul>
      </article>
    </section>
  );
}
