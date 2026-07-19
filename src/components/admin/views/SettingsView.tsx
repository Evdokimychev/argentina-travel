"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import SiteGlobalForm from "@/components/admin/site-globals/SiteGlobalForm";
import AnalyticsReadinessPanel from "@/components/admin/AnalyticsReadinessPanel";
import ProductionReadinessPanel from "@/components/admin/ProductionReadinessPanel";
import CutoverChecklistPanel from "@/components/admin/CutoverChecklistPanel";
import CmsCutoverPanel from "@/components/admin/CmsCutoverPanel";
import CmsOpsPanel from "@/components/admin/cms/CmsOpsPanel";
import SiteGlobalsSeoPreview from "@/components/admin/cms/SiteGlobalsSeoPreview";
import MaintenancePreviewPanel from "@/components/admin/cms/MaintenancePreviewPanel";
import SiteNavigationPreview from "@/components/admin/cms/SiteNavigationPreview";
import SiteDesignPreview from "@/components/admin/cms/SiteDesignPreview";
import SiteCompositionPreview from "@/components/admin/cms/SiteCompositionPreview";
import TravelModulesPreview from "@/components/admin/cms/TravelModulesPreview";
import IntegrationReadinessPanel from "@/components/admin/cms/IntegrationReadinessPanel";
import CommunicationsSettingsPreview from "@/components/admin/cms/CommunicationsSettingsPreview";
import ThemeSettingsSection from "@/components/settings/ThemeSettingsSection";
import { useAdminApi } from "@/hooks/useAdminApi";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { CmsOpsSummary } from "@/lib/cms/cms-ops";
import type { SearchOpsSnapshot } from "@/lib/search/search-ops-types";
import { SITE_GLOBAL_DEFINITIONS } from "@/lib/cms/site-globals/registry";
import type { AnalyticsReadinessSnapshot } from "@/lib/ops/analytics-readiness-types";
import type { CronHealthReport } from "@/lib/ops/ops-status";
import type { ProductionReadinessSnapshot } from "@/lib/ops/production-readiness-types";
import type { IntegrationReadinessItem } from "@/lib/integrations/admin-readiness";
import { SITE_GLOBAL_KEYS, type SiteGlobalKey } from "@/types/site-globals";
import InlineFeedback from "@/components/feedback/InlineFeedback";

type CronRunEntry = {
  ranAt: string;
  ok: boolean;
  message: string;
};

type SettingsResponse = {
  settings?: Partial<Record<SiteGlobalKey, Record<string, unknown>>>;
  updatedAt?: Partial<Record<SiteGlobalKey, string>>;
  ops?: {
    rlsAudit: {
      ok: boolean;
      source: string;
      ranAt: string;
      criticalIssueCount: number;
    } | null;
    backup: {
      lastBackupAt: string | null;
      lastBackupFile: string | null;
      hint: string;
    };
    cron?: {
      digest: CronRunEntry | null;
      cleanupTyping: CronRunEntry | null;
      backupHint: CronRunEntry | null;
      contentFreshness: CronRunEntry | null;
      privacyProcess: CronRunEntry | null;
    };
  };
  productionReadiness?: ProductionReadinessSnapshot;
  analyticsReadiness?: AnalyticsReadinessSnapshot;
  publicHealth?: {
    ok: boolean;
    environment: {
      nodeEnv: string;
      deployEnv: string;
    };
    migrationVersion: string | null;
    checks: {
      database: {
        ok: boolean;
        skipped: boolean;
        error: string | null;
      };
      migrations: {
        latestId: string | null;
        fileCount: number;
      };
    };
  };
  cmsOps?: CmsOpsSummary;
  cronHealth?: CronHealthReport;
  searchOps?: SearchOpsSnapshot;
  integrations?: IntegrationReadinessItem[];
};

type SettingsTab =
  | "appearance"
  | "content"
  | "commerce"
  | "marketing"
  | "access"
  | "operations";

const TAB_LABELS: Record<SettingsTab, string> = {
  appearance: "Внешний вид",
  content: "Контент",
  commerce: "Туры и магазин",
  marketing: "SEO и коммуникации",
  access: "Команда и правила",
  operations: "Работа сайта",
};

const TAB_DESCRIPTIONS: Record<SettingsTab, string> = {
  appearance: "Логотипы, палитра, типографика, шапка, подвал и главное меню.",
  content: "Состав статей, медиатека, страницы, переводы и публикации.",
  commerce: "Каталог товаров и рабочие разделы туров, экскурсий и организаторов.",
  marketing: "Поисковая видимость, социальные каналы, аналитика и воронки.",
  access: "Юридические данные, функции сайта, сотрудники, роли и журнал действий.",
  operations: "Обслуживание, резервные копии, здоровье сайта и техническая готовность.",
};

type ModuleLink = {
  href: string;
  label: string;
  description: string;
};

const MODULE_LINKS: Partial<Record<SettingsTab, ModuleLink[]>> = {
  content: [
    { href: "/admin/content/documents", label: "Страницы и статьи", description: "Редактирование и публикация материалов." },
    { href: "/admin/media", label: "Медиафайлы", description: "Изображения, документы и права использования." },
    { href: "/admin/content/social-feed", label: "Социальная лента", description: "Материалы из социальных каналов." },
    { href: "/admin/content/translations", label: "Переводы", description: "Локализованные версии публичного контента." },
  ],
  commerce: [
    { href: "/admin/marketplace/tours", label: "Туры", description: "Карточки, готовность, расписание и публикация." },
    { href: "/admin/marketplace/excursions", label: "Экскурсии", description: "Предложения и фактические способы бронирования." },
    { href: "/admin/marketplace/organizers", label: "Организаторы", description: "Профили, доступные функции и проверка." },
    { href: "/admin/marketplace/moderation", label: "Модерация", description: "Очередь публикаций и история решений." },
    { href: "/admin/operations/shop-orders", label: "Заказы магазина", description: "Заявки на цифровые и физические товары." },
    { href: "/admin/operations/payments", label: "Платежи", description: "Состояния оплат и сверка операций." },
  ],
  marketing: [
    { href: "/admin/analytics", label: "Аналитика", description: "Ключевые показатели и качество данных." },
    { href: "/admin/analytics/funnels", label: "Воронки", description: "Путь от просмотра до заявки или перехода партнёру." },
    { href: "/admin/content/social-feed", label: "Социальные медиа", description: "Публичная лента и источники материалов." },
    { href: "/admin/content-freshness", label: "Актуальность", description: "Контент, который пора проверить или обновить." },
  ],
  access: [
    { href: "/admin/users", label: "Пользователи", description: "Туристы, организаторы и состояния аккаунтов." },
    { href: "/admin/system/staff", label: "Команда", description: "Роли сотрудников и разрешённые действия." },
    { href: "/admin/feature-flags", label: "Доступность функций", description: "Безопасное включение возможностей сайта." },
    { href: "/admin/system/audit", label: "Журнал действий", description: "Кто, когда и что изменил в админке." },
  ],
  operations: [
    { href: "/admin/operations", label: "Операционный центр", description: "Заявки, бронирования и текущая работа команды." },
    { href: "/admin/system/api-keys", label: "Партнёрские API-ключи", description: "Доступ внешних партнёров к публичному API сайта." },
    { href: "/admin/system/redirects", label: "Переадресации", description: "Безопасные изменения адресов страниц." },
  ],
};

const TAB_GLOBAL_KEYS: Record<SettingsTab, SiteGlobalKey[]> = {
  appearance: ["site.branding", "site.design", "site.navigation"],
  content: ["site.blog"],
  commerce: ["site.commerce", "site.modules"],
  marketing: ["site.marketing", "site.seo", "site.contact", "site.forms", "site.email"],
  access: ["site.legal", "site.features"],
  operations: ["site.maintenance"],
};

function ModuleLinks({ tab }: { tab: SettingsTab }) {
  const items = MODULE_LINKS[tab];
  if (!items?.length) return null;

  return (
    <section className={`${cabinetCardClass} space-y-4 p-5`}>
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground">Рабочие разделы</h2>
        <p className="mt-1 text-sm leading-6 text-slate">
          Здесь находятся сами материалы и операции. Глобальные параметры выше управляют их
          публичным отображением.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-2xl border border-border-subtle bg-surface-muted/50 p-4 transition-colors hover:border-sky/40 hover:bg-sky/5"
          >
            <span className="text-sm font-semibold text-foreground group-hover:text-sky-ink">
              {item.label} →
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate">{item.description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function formatCronRun(entry: CronRunEntry | null | undefined): string {
  if (!entry) return "Ещё не запускался";
  const status = entry.ok ? "OK" : "ошибка";
  return `${entry.ranAt} — ${status}: ${entry.message}`;
}

function emptyGlobalsState(): Record<SiteGlobalKey, Record<string, unknown>> {
  return {
    "site.branding": {},
    "site.seo": {},
    "site.contact": {},
    "site.navigation": {},
    "site.design": {},
    "site.blog": {},
    "site.commerce": {},
    "site.modules": {},
    "site.forms": {},
    "site.email": {},
    "site.marketing": {},
    "site.legal": {},
    "site.features": {},
    "site.maintenance": {},
  };
}

export default function SettingsView() {
  const { data, loading, error, refresh } = useAdminApi<SettingsResponse>("/api/admin/settings");
  const [tab, setTab] = useState<SettingsTab>("appearance");
  const [globals, setGlobals] = useState(emptyGlobalsState);
  const [savingKey, setSavingKey] = useState<SiteGlobalKey | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [saveFeedback, setSaveFeedback] = useState<{
    variant: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!data?.settings) return;
    setGlobals((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(data.settings!) as SiteGlobalKey[]) {
        if (data.settings![key]) {
          next[key] = { ...data.settings![key] };
        }
      }
      return next;
    });
  }, [data?.settings]);

  const saveGlobal = useCallback(
    async (key: SiteGlobalKey) => {
      setSavingKey(key);
      setSaveFeedback(null);
      try {
        const res = await fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value: globals[key] }),
        });
        if (!res.ok) {
          const json = (await res.json()) as { error?: string };
          throw new Error(json.error ?? "Ошибка сохранения");
        }
        await refresh();
        setSaveFeedback({ variant: "success", message: "Настройки сохранены и применятся на публичном сайте." });
      } catch (saveError) {
        setSaveFeedback({
          variant: "error",
          message: saveError instanceof Error ? saveError.message : "Не удалось сохранить настройки",
        });
      } finally {
        setSavingKey(null);
      }
    },
    [globals, refresh]
  );

  const selectedDefinitions = useMemo(() => {
    const keys = new Set<SiteGlobalKey>(TAB_GLOBAL_KEYS[tab]);
    return SITE_GLOBAL_DEFINITIONS.filter((definition) => keys.has(definition.key));
  }, [tab]);

  const changedKeys = useMemo(
    () =>
      SITE_GLOBAL_KEYS.filter(
        (key) => JSON.stringify(globals[key]) !== JSON.stringify(data?.settings?.[key] ?? {}),
      ),
    [data?.settings, globals],
  );

  const saveAll = useCallback(async () => {
    if (changedKeys.length === 0) return;
    setSavingAll(true);
    setSaveFeedback(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch: changedKeys.map((key) => ({ key, value: globals[key] })),
        }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Ошибка сохранения");
      }
      await refresh();
      setSaveFeedback({
        variant: "success",
        message: "Все изменения сохранены. Публичные страницы используют обновлённые настройки.",
      });
    } catch (saveError) {
      setSaveFeedback({
        variant: "error",
        message: saveError instanceof Error ? saveError.message : "Не удалось сохранить настройки",
      });
    } finally {
      setSavingAll(false);
    }
  }, [changedKeys, globals, refresh]);

  const exportSettings = useCallback(() => {
    const payload = JSON.stringify(
      {
        format: "goargentina.site-settings",
        version: 1,
        exportedAt: new Date().toISOString(),
        settings: globals,
      },
      null,
      2,
    );
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `goargentina-settings-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [globals]);

  const importSettings = useCallback(async (file: File) => {
    setSaveFeedback(null);
    try {
      const parsed = JSON.parse(await file.text()) as {
        format?: string;
        settings?: Partial<Record<SiteGlobalKey, unknown>>;
      };
      if (parsed.format !== "goargentina.site-settings" || !parsed.settings) {
        throw new Error("Файл не является резервной копией настроек «Пора в Аргентину».");
      }
      const imported = { ...globals };
      for (const key of SITE_GLOBAL_KEYS) {
        const value = parsed.settings[key];
        if (value && typeof value === "object" && !Array.isArray(value)) {
          imported[key] = { ...(value as Record<string, unknown>) };
        }
      }
      setGlobals(imported);
      setSaveFeedback({
        variant: "success",
        message: "Копия загружена в форму. Проверьте предпросмотры и нажмите «Сохранить всё».",
      });
    } catch (importError) {
      setSaveFeedback({
        variant: "error",
        message: importError instanceof Error ? importError.message : "Не удалось прочитать файл",
      });
    }
  }, [globals]);

  const resetGlobal = useCallback(
    (key: SiteGlobalKey) => {
      const saved = data?.settings?.[key] ?? {};
      setGlobals((prev) => ({ ...prev, [key]: { ...saved } }));
      setSaveFeedback(null);
    },
    [data?.settings],
  );

  const resetAll = useCallback(() => {
    const saved = emptyGlobalsState();
    for (const key of SITE_GLOBAL_KEYS) {
      saved[key] = { ...(data?.settings?.[key] ?? {}) };
    }
    setGlobals(saved);
    setSaveFeedback(null);
  }, [data?.settings]);

  return (
    <CapabilityGate capability="system.settings">
      <AdminPageShell>
        <AdminPageHeader
          title="Центр управления сайтом"
          subtitle="Внешний вид, контент, продажи, продвижение и работа платформы — в одной системе"
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {loading ? <p className="text-sm text-slate">Загрузка…</p> : null}
        {saveFeedback ? (
          <InlineFeedback
            variant={saveFeedback.variant}
            title={saveFeedback.variant === "success" ? "Изменения сохранены" : "Не удалось сохранить"}
            description={saveFeedback.message}
          />
        ) : null}

        <section className={`${cabinetCardClass} flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between`}>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {changedKeys.length
                ? `Есть несохранённые изменения: ${changedKeys.length}`
                : "Все настройки синхронизированы"}
            </p>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate">
              Изменения сначала видны в предпросмотрах. На публичный сайт они попадут только после
              сохранения; каждое действие записывается в журнал администратора.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportSettings}
              className="inline-flex min-h-11 items-center rounded-full border border-border-subtle px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
            >
              Скачать копию
            </button>
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="inline-flex min-h-11 items-center rounded-full border border-border-subtle px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
            >
              Загрузить копию
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) void importSettings(file);
                event.currentTarget.value = "";
              }}
            />
            <button
              type="button"
              onClick={resetAll}
              disabled={changedKeys.length === 0 || savingAll}
              className="inline-flex min-h-11 items-center rounded-full border border-border-subtle px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Отменить изменения
            </button>
            <button
              type="button"
              onClick={() => void saveAll()}
              disabled={savingAll || loading || changedKeys.length === 0}
              className="inline-flex min-h-11 items-center rounded-full bg-sky-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-sky-ink/90 disabled:cursor-wait disabled:opacity-60"
            >
              {savingAll ? "Сохраняем…" : changedKeys.length ? "Сохранить всё" : "Всё сохранено"}
            </button>
          </div>
        </section>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {(Object.keys(TAB_LABELS) as SettingsTab[]).map((tabKey) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setTab(tabKey)}
              className={`min-h-20 rounded-2xl border px-4 py-3 text-left transition-colors ${
                tab === tabKey
                  ? "border-sky-ink bg-sky-ink text-white"
                  : "border-border-subtle bg-surface-elevated text-foreground hover:border-sky/40 hover:bg-sky/5"
              }`}
            >
              <span className="block text-sm font-semibold">{TAB_LABELS[tabKey]}</span>
              <span className={`mt-1 block text-xs leading-5 ${tab === tabKey ? "text-white/75" : "text-slate"}`}>
                {TAB_DESCRIPTIONS[tabKey]}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {selectedDefinitions.map((definition) => (
            <SiteGlobalForm
              key={definition.key}
              definition={definition}
              values={globals[definition.key]}
              onChange={(values) =>
                setGlobals((prev) => ({ ...prev, [definition.key]: values }))
              }
              onSave={() => void saveGlobal(definition.key)}
              onReset={() => resetGlobal(definition.key)}
              savedValues={data?.settings?.[definition.key] ?? {}}
              saving={savingKey === definition.key}
              updatedAt={data?.updatedAt?.[definition.key] ?? null}
            />
          ))}

          {tab === "appearance" ? (
            <>
              <SiteDesignPreview values={globals["site.design"]} />
              <SiteNavigationPreview values={globals["site.navigation"]} />
              <ThemeSettingsSection />
            </>
          ) : null}

          {tab === "content" || tab === "commerce" ? (
            <>
              <SiteCompositionPreview
                blogValues={globals["site.blog"]}
                commerceValues={globals["site.commerce"]}
              />
              {tab === "commerce" ? (
                <TravelModulesPreview values={globals["site.modules"]} />
              ) : null}
            </>
          ) : null}

          {tab === "marketing" ? (
            <>
              <CommunicationsSettingsPreview
                marketingValues={globals["site.marketing"]}
                formsValues={globals["site.forms"]}
                emailValues={globals["site.email"]}
                integrations={data?.integrations}
              />
              <SiteGlobalsSeoPreview
                branding={globals["site.branding"]}
                seo={globals["site.seo"]}
              />
              <IntegrationReadinessPanel items={data?.integrations} />
            </>
          ) : null}

          {tab === "access" ? <CmsCutoverPanel /> : null}

          <ModuleLinks tab={tab} />

          {tab === "operations" ? (
            <>
              <CmsOpsPanel
                cmsOps={data?.cmsOps}
                cronHealth={data?.cronHealth}
                searchOps={data?.searchOps}
                onRefresh={() => void refresh()}
              />
              <MaintenancePreviewPanel
                maintenance={globals["site.maintenance"]}
                branding={globals["site.branding"]}
                contact={globals["site.contact"]}
              />
              <IntegrationReadinessPanel items={data?.integrations} />

            <section className={`${cabinetCardClass} space-y-4 p-5`}>
              <h2 className="font-heading text-lg font-bold text-foreground">
                Резервная копия настроек
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-slate">
                JSON-копия содержит только управляемые параметры сайта и не включает пароли,
                токены интеграций или пользовательские данные. Импорт сначала загружает значения в
                форму — публикация происходит только после проверки и сохранения.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={exportSettings}
                  className="inline-flex min-h-11 items-center rounded-full bg-sky-ink px-4 text-sm font-semibold text-white"
                >
                  Экспортировать настройки
                </button>
                <button
                  type="button"
                  onClick={() => importInputRef.current?.click()}
                  className="inline-flex min-h-11 items-center rounded-full border border-border-subtle px-4 text-sm font-semibold text-foreground"
                >
                  Подготовить восстановление
                </button>
              </div>
            </section>

              <AnalyticsReadinessPanel snapshot={data?.analyticsReadiness} />
              <ProductionReadinessPanel snapshot={data?.productionReadiness} />
              <CutoverChecklistPanel
                health={data?.publicHealth}
                readiness={data?.productionReadiness}
              />

            <section className={`${cabinetCardClass} space-y-4 p-5`}>
              <h2 className="font-heading text-lg font-bold text-foreground">Для разработчика</h2>
              <p className="text-sm text-slate">
                Служебные проверки сайта. Они не влияют на обычное редактирование контента.
              </p>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate">Резервная копия схемы</dt>
                  <dd className="mt-1 font-medium text-charcoal">
                    {data?.ops?.backup.hint ?? "Нет данных"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate">Последний RLS-аудит</dt>
                  <dd className="mt-1 font-medium text-charcoal">
                    {data?.ops?.rlsAudit ? (
                      <>
                        {data.ops.rlsAudit.ranAt} —{" "}
                        {data.ops.rlsAudit.ok ? (
                          <span className="text-emerald-700">OK</span>
                        ) : (
                          <span className="text-red-600">
                            {data.ops.rlsAudit.criticalIssueCount} критичных проблем
                          </span>
                        )}{" "}
                        ({data.ops.rlsAudit.source})
                      </>
                    ) : (
                      "Аудит ещё не запускался"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate">Cron: ежедневная сводка</dt>
                  <dd className="mt-1 font-medium text-charcoal">
                    {formatCronRun(data?.ops?.cron?.digest ?? null)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate">Cron: очистка typing</dt>
                  <dd className="mt-1 font-medium text-charcoal">
                    {formatCronRun(data?.ops?.cron?.cleanupTyping ?? null)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate">Cron: резервная копия схемы</dt>
                  <dd className="mt-1 font-medium text-charcoal">
                    {formatCronRun(data?.ops?.cron?.backupHint ?? null)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate">Cron: актуальность контента</dt>
                  <dd className="mt-1 font-medium text-charcoal">
                    {formatCronRun(data?.ops?.cron?.contentFreshness ?? null)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate">Cron: GDPR soft delete</dt>
                  <dd className="mt-1 font-medium text-charcoal">
                    {formatCronRun(data?.ops?.cron?.privacyProcess ?? null)}
                  </dd>
                </div>
              </dl>
              </section>
            </>
          ) : null}
        </div>
      </AdminPageShell>
    </CapabilityGate>
  );
}
