"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleOff,
  ExternalLink,
  EyeOff,
  Settings2,
} from "lucide-react";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAdminApi } from "@/hooks/useAdminApi";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import { cn } from "@/lib/cn";
import {
  resolveProductModuleSnapshots,
  type ProductModuleGroup,
  type ProductModuleSnapshot,
  type ProductModuleStatus,
} from "@/lib/modules/registry";
import type {
  SiteModulesGlobal,
  SiteNavigationGlobal,
  SitePublicModuleId,
  SitePublicModuleState,
} from "@/types/site-globals";

type ModulesResponse = {
  modules: ProductModuleSnapshot[];
  settings: {
    navigation: SiteNavigationGlobal;
    modules: SiteModulesGlobal;
  };
  rowVersions: {
    "site.navigation": number;
    "site.modules": number;
  };
  updatedAt: {
    "site.navigation": string | null;
    "site.modules": string | null;
  };
  checkedAt: string;
};

type ModuleFilter = "all" | "active" | "disabled" | "attention";

const FILTER_LABELS: Record<ModuleFilter, string> = {
  all: "Все модули",
  active: "Работают",
  disabled: "Отключены",
  attention: "Требуют внимания",
};

const GROUP_LABELS: Record<ProductModuleGroup, string> = {
  core: "Основа сайта",
  content: "Контент",
  sales: "Продажи и бронирования",
  community: "Сообщество",
  services: "Сервисы",
  system: "Система",
};

const STATUS_META: Record<
  ProductModuleStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  active: {
    label: "Работает",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    icon: CheckCircle2,
  },
  disabled: {
    label: "Отключён",
    className: "bg-gray-100 text-slate ring-gray-200",
    icon: CircleOff,
  },
  not_published: {
    label: "Не опубликован",
    className: "bg-amber-50 text-amber-800 ring-amber-200",
    icon: AlertTriangle,
  },
  hidden_from_navigation: {
    label: "Скрыт из меню",
    className: "bg-sky-50 text-sky-ink ring-sky-200",
    icon: EyeOff,
  },
  not_configured: {
    label: "Нужна настройка",
    className: "bg-amber-50 text-amber-800 ring-amber-200",
    icon: AlertTriangle,
  },
  dependency_unavailable: {
    label: "Недоступна зависимость",
    className: "bg-red-50 text-red-700 ring-red-200",
    icon: AlertTriangle,
  },
  unavailable: {
    label: "Недоступен",
    className: "bg-red-50 text-red-700 ring-red-200",
    icon: CircleOff,
  },
};

function isAttentionStatus(status: ProductModuleStatus): boolean {
  return status !== "active" && status !== "disabled" && status !== "hidden_from_navigation";
}

function ModuleStatusBadge({ status }: { status: ProductModuleStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1", meta.className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {meta.label}
    </span>
  );
}

function SettingSwitch({
  checked,
  disabled,
  label,
  description,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  description: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className={cn("flex min-w-0 items-start gap-3 rounded-xl border border-border-subtle bg-surface-muted/40 p-3", disabled && "opacity-60")}>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        aria-label={label}
        className="mt-0.5"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        <span className="mt-0.5 block text-xs leading-5 text-slate">{description}</span>
      </span>
    </div>
  );
}

async function saveModuleSettings(
  navigation: SiteNavigationGlobal,
  modules: SiteModulesGlobal,
  versions: ModulesResponse["rowVersions"],
): Promise<void> {
  const payload = {
    batch: [
      { key: "site.navigation", value: navigation, expectedVersion: versions["site.navigation"] },
      { key: "site.modules", value: modules, expectedVersion: versions["site.modules"] },
    ],
  };
  const send = (confirmationToken?: string) =>
    fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, confirmationToken }),
    });

  let response = await send();
  let result = (await response.json().catch(() => ({}))) as {
    error?: string;
    requiresConfirmation?: boolean;
    confirmationToken?: string;
    risks?: Array<{ label: string }>;
  };
  if (response.status === 428 && result.requiresConfirmation && result.confirmationToken) {
    const risks = (result.risks ?? []).map((risk) => `• ${risk.label}`).join("\n");
    if (!window.confirm(`Проверьте последствия изменения модулей:\n\n${risks}\n\nПродолжить?`)) {
      throw new Error("Сохранение отменено. Настройки не изменены.");
    }
    response = await send(result.confirmationToken);
    result = (await response.json().catch(() => ({}))) as typeof result;
  }
  if (!response.ok) throw new Error(result.error ?? "Не удалось сохранить модули");
}

export default function ModulesView() {
  const { data, loading, error, refresh } = useAdminApi<ModulesResponse>("/api/admin/modules");
  const [filter, setFilter] = useState<ModuleFilter>("all");
  const [navigation, setNavigation] = useState<SiteNavigationGlobal | null>(null);
  const [modules, setModules] = useState<SiteModulesGlobal | null>(null);
  const [baseline, setBaseline] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!data?.settings) return;
    const serialized = JSON.stringify(data.settings);
    setNavigation(data.settings.navigation);
    setModules(data.settings.modules);
    setBaseline(serialized);
  }, [data]);

  const dirty = Boolean(
    navigation && modules && JSON.stringify({ navigation, modules }) !== baseline,
  );
  useUnsavedChangesGuard(dirty);

  const snapshots = useMemo(
    () => (navigation && modules ? resolveProductModuleSnapshots(navigation, modules) : []),
    [modules, navigation],
  );
  const visibleSnapshots = snapshots.filter((module) => {
    if (filter === "active") return module.status === "active" || module.status === "hidden_from_navigation";
    if (filter === "disabled") return module.status === "disabled";
    if (filter === "attention") return isAttentionStatus(module.status);
    return true;
  });
  const grouped = Object.entries(GROUP_LABELS)
    .map(([group, label]) => ({
      group: group as ProductModuleGroup,
      label,
      items: visibleSnapshots.filter((module) => module.group === group),
    }))
    .filter((entry) => entry.items.length > 0);

  const updatePublicModule = (
    id: SitePublicModuleId,
    patch: Partial<SitePublicModuleState>,
  ) => {
    setModules((current) => current
      ? {
          ...current,
          publicModules: {
            ...current.publicModules,
            [id]: { ...current.publicModules[id], ...patch },
          },
        }
      : current);
    setFeedback(null);
  };

  const save = async () => {
    if (!data || !navigation || !modules || !dirty) return;
    setSaving(true);
    setFeedback(null);
    try {
      await saveModuleSettings(navigation, modules, data.rowVersions);
      await refresh();
      setFeedback({
        variant: "success",
        message: "Состояния сохранены. Меню, публичные маршруты, поиск и карта сайта читают этот же контур.",
      });
    } catch (saveError) {
      setFeedback({
        variant: "error",
        message: saveError instanceof Error ? saveError.message : "Не удалось сохранить модули",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <CapabilityGate capability="system.settings">
      <AdminPageShell>
        <AdminPageHeader
          title="Модули сайта"
          subtitle="Реальное состояние публичных разделов, меню, поиска и карты сайта"
        />

        {error ? <InlineFeedback variant="error" title="Не удалось загрузить модули" description={error} /> : null}
        {feedback ? (
          <InlineFeedback
            variant={feedback.variant}
            title={feedback.variant === "success" ? "Изменения сохранены" : "Сохранение не выполнено"}
            description={feedback.message}
          />
        ) : null}

        <section className={cn(cabinetCardClass, "sticky top-[var(--admin-mobile-header-height,0px)] z-20 flex flex-col gap-4 p-4 sm:top-3 lg:flex-row lg:items-center lg:justify-between")}>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {dirty ? "Есть несохранённые изменения" : loading ? "Проверяем состояние…" : "Состояние синхронизировано"}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate">
              Обычное отключение не удаляет данные. Скрытие из меню не закрывает рабочий URL.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={!dirty || saving || !data}
              onClick={() => {
                if (!data) return;
                setNavigation(data.settings.navigation);
                setModules(data.settings.modules);
                setFeedback(null);
              }}
            >
              Отменить
            </Button>
            <Button disabled={!dirty || saving || loading} onClick={() => void save()}>
              {saving ? "Сохраняем…" : dirty ? "Сохранить изменения" : "Всё сохранено"}
            </Button>
          </div>
        </section>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Фильтр модулей">
          {(Object.keys(FILTER_LABELS) as ModuleFilter[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              onClick={() => setFilter(key)}
              className={cn(
                "min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors",
                filter === key
                  ? "border-sky-ink bg-sky-ink text-white"
                  : "border-border-subtle bg-surface-elevated text-foreground hover:bg-surface-muted",
              )}
            >
              {FILTER_LABELS[key]}
            </button>
          ))}
        </div>

        {loading && snapshots.length === 0 ? (
          <div className={cn(cabinetCardClass, "p-6 text-sm text-slate")}>Загружаем реальное состояние модулей…</div>
        ) : null}

        {grouped.map((entry) => (
          <section key={entry.group} className="space-y-3" aria-labelledby={`module-group-${entry.group}`}>
            <div className="flex items-center justify-between gap-3">
              <h2 id={`module-group-${entry.group}`} className="font-heading text-lg font-bold text-foreground">
                {entry.label}
              </h2>
              <span className="text-xs text-slate">{entry.items.length}</span>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {entry.items.map((module) => {
                const state = module.publicModuleId && modules
                  ? modules.publicModules[module.publicModuleId]
                  : null;
                return (
                  <article key={module.id} className={cn(cabinetCardClass, "flex min-w-0 flex-col p-5")}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">{module.id}</p>
                        <h3 className="mt-1 font-heading text-lg font-bold text-foreground">{module.label}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate">{module.description}</p>
                      </div>
                      <ModuleStatusBadge status={module.status} />
                    </div>

                    {module.reason ? (
                      <p className="mt-4 rounded-xl border border-amber-200/70 bg-amber-50/70 px-3 py-2 text-xs leading-5 text-amber-900">
                        {module.reason}
                      </p>
                    ) : null}

                    <dl className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
                      <div className="rounded-xl bg-surface-muted p-2.5"><dt className="text-slate">URL</dt><dd className="mt-1 font-semibold text-foreground">{module.publicAvailable ? "Доступен" : "Закрыт"}</dd></div>
                      <div className="rounded-xl bg-surface-muted p-2.5"><dt className="text-slate">Меню</dt><dd className="mt-1 font-semibold text-foreground">{module.visibleInNavigation ? "Показан" : "Скрыт"}</dd></div>
                      <div className="rounded-xl bg-surface-muted p-2.5"><dt className="text-slate">Поиск</dt><dd className="mt-1 font-semibold text-foreground">{module.includedInSearch ? "Включён" : "Исключён"}</dd></div>
                      <div className="rounded-xl bg-surface-muted p-2.5"><dt className="text-slate">Sitemap</dt><dd className="mt-1 font-semibold text-foreground">{module.includedInSitemap ? "Включён" : "Исключён"}</dd></div>
                      <div className="rounded-xl bg-surface-muted p-2.5"><dt className="text-slate">Настройка</dt><dd className="mt-1 font-semibold text-foreground">{module.configured ? "Готова" : "Требуется"}</dd></div>
                    </dl>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate">
                      <span>
                        Зависимости: {module.dependencies?.length
                          ? module.dependencies.map((id) => snapshots.find((item) => item.id === id)?.label ?? id).join(", ")
                          : "нет"}
                      </span>
                      <span>
                        Проверено: {data?.checkedAt
                          ? new Date(data.checkedAt).toLocaleString("ru-RU")
                          : "ожидаем данные"}
                      </span>
                    </div>

                    {state && module.publicModuleId ? (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <SettingSwitch
                          checked={state.activated}
                          label="Модуль активирован"
                          description="Функция разрешена владельцем сайта."
                          onChange={(checked) => updatePublicModule(module.publicModuleId!, { activated: checked })}
                        />
                        <SettingSwitch
                          checked={state.published}
                          disabled={!state.activated}
                          label="Страница опубликована"
                          description="Публичный URL может отвечать успешно."
                          onChange={(checked) => updatePublicModule(module.publicModuleId!, { published: checked })}
                        />
                        {module.navigationKey && navigation ? (
                          <SettingSwitch
                            checked={navigation[module.navigationKey] === true}
                            disabled={!state.activated || !state.published}
                            label="Показывать в меню"
                            description="Ссылка видна в основной навигации."
                            onChange={(checked) => setNavigation((current) => current ? { ...current, [module.navigationKey!]: checked } : current)}
                          />
                        ) : null}
                        <SettingSwitch
                          checked={state.includeInSearch}
                          disabled={!state.activated || !state.published}
                          label="Включить в поиск"
                          description="Страницы находятся во внутреннем поиске."
                          onChange={(checked) => updatePublicModule(module.publicModuleId!, { includeInSearch: checked })}
                        />
                        <SettingSwitch
                          checked={state.includeInSitemap}
                          disabled={!state.activated || !state.published}
                          label="Включить в sitemap"
                          description="Страницы разрешены для карты сайта."
                          onChange={(checked) => updatePublicModule(module.publicModuleId!, { includeInSitemap: checked })}
                        />
                      </div>
                    ) : null}

                    <div className="mt-auto flex flex-wrap gap-2 pt-5">
                      <Link href={module.adminPath} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border-subtle px-3 text-sm font-semibold text-foreground hover:bg-surface-muted">
                        <Settings2 className="h-4 w-4" aria-hidden />
                        Настроить
                      </Link>
                      {module.publicPath && module.publicAvailable ? (
                        <Link href={module.publicPath} target="_blank" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border-subtle px-3 text-sm font-semibold text-sky-ink hover:bg-sky/5">
                          <ExternalLink className="h-4 w-4" aria-hidden />
                          Открыть страницу
                        </Link>
                      ) : module.publicPath ? (
                        <span className="inline-flex min-h-10 items-center rounded-full border border-border-subtle px-3 text-sm font-semibold text-slate" title={module.reason ?? "Публичная страница сейчас закрыта"}>
                          Страница закрыта
                        </span>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </AdminPageShell>
    </CapabilityGate>
  );
}
