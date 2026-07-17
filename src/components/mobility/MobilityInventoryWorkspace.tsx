"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Archive, CarFront, FileCheck2, RefreshCw, Route, ShieldCheck } from "lucide-react";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cabinetCardClass, cabinetPanelClass } from "@/lib/cabinet-ui";
import { cn } from "@/lib/cn";
import MobilityRequestInbox from "@/components/mobility/MobilityRequestInbox";
import type {
  MobilityInventory,
  MobilityInventoryItem,
  MobilityInventoryProvider,
  MobilityLifecycleStatus,
  MobilityVertical,
} from "@/types/mobility";

type Props = { mode: "organizer" | "admin" };
type ItemKind = "vehicle" | "rental" | "transfer";
type Notice = { variant: "success" | "error" | "info"; title: string; description?: string };
type MarketPreset = "ar" | "uy" | "custom";

const EMPTY: MobilityInventory = {
  providers: [],
  documents: [],
  vehicles: [],
  rentalOffers: [],
  transferServices: [],
};

const MARKET_PRESETS = {
  ar: {
    label: "Аргентина",
    marketId: "ar",
    countryCode: "AR",
    timezone: "America/Argentina/Buenos_Aires",
    sourceCurrency: "ARS",
    displayCurrency: "USD",
  },
  uy: {
    label: "Уругвай",
    marketId: "uy",
    countryCode: "UY",
    timezone: "America/Montevideo",
    sourceCurrency: "UYU",
    displayCurrency: "USD",
  },
} as const;

const STATUS_LABELS: Record<MobilityLifecycleStatus, string> = {
  draft: "Черновик",
  review: "На проверке",
  published: "Опубликовано",
  archived: "В архиве",
};

const STATUS_STYLES: Record<MobilityLifecycleStatus, string> = {
  draft: "bg-surface-muted text-muted",
  review: "bg-amber-50 text-amber-800",
  published: "bg-emerald-50 text-emerald-800",
  archived: "bg-slate-100 text-slate-600",
};

const VERIFICATION_LABELS = {
  unverified: "Ещё не проверено",
  pending: "Ожидает проверки",
  verified: "Проверено",
  rejected: "Нужно исправить",
  expired: "Срок проверки истёк",
} as const;

const READINESS_LABELS = {
  requires_verification: "Нужна проверка команды",
  manual_handoff: "Заявки обрабатываются вручную",
  verified: "Можно готовить предложения",
  blocked: "Временно приостановлено",
} as const;

const HEALTH_LABELS = {
  unknown: "Состояние ещё не проверялось",
  healthy: "Работает штатно",
  degraded: "Работает с ограничениями",
  unavailable: "Временно недоступно",
} as const;

const DOCUMENT_LABELS: Record<string, string> = {
  registration: "Регистрация транспорта",
  insurance: "Страхование",
  inspection: "Технический осмотр",
  driver_license: "Водительское удостоверение",
  passenger_license: "Разрешение на перевозку пассажиров",
};

const CURRENCY_LABELS: Record<string, string> = {
  ARS: "ARS — аргентинское песо",
  UYU: "UYU — уругвайское песо",
  USD: "USD — доллар США",
};

function majorToMinor(value: FormDataEntryValue | null): number | null {
  const normalized = String(value ?? "").trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(minor) ? minor : null;
}

function formatDate(value: string | null): string {
  if (!value) return "Не указан";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? "Указан некорректно"
    : new Intl.DateTimeFormat("ru-RU").format(date);
}

function itemLabel(kind: ItemKind): string {
  if (kind === "vehicle") return "транспорт";
  if (kind === "rental") return "предложение аренды";
  return "маршрут трансфера";
}

function ItemCard({
  item,
  kind,
  vertical,
  mode,
  busy,
  mutate,
}: {
  item: MobilityInventoryItem;
  kind: ItemKind;
  vertical: MobilityVertical;
  mode: Props["mode"];
  busy: boolean;
  mutate: (payload: Record<string, unknown>, label: string) => Promise<boolean>;
}) {
  const title = item.title || item.public_name || "Без названия";
  const [documentsValidUntil, setDocumentsValidUntil] = useState("");
  const transition = (nextStatus: MobilityLifecycleStatus, actionLabel: string) => mutate({
    action: "transition",
    vertical,
    entityType: kind,
    entityId: item.id,
    expectedVersion: item.row_version,
    nextStatus,
    marketId: item.market_id,
    countryCode: item.country_code,
  }, actionLabel);

  async function confirmTransition(nextStatus: MobilityLifecycleStatus, prompt: string, label: string) {
    if (!window.confirm(prompt)) return;
    await transition(nextStatus, label);
  }

  return (
    <article className={cn(cabinetCardClass, "p-5")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{itemLabel(kind)}</p>
          <h3 className="mt-1 break-words font-semibold text-foreground">{title}</h3>
          {item.verification_status ? (
            <p className="mt-2 text-xs text-muted">Проверка: {VERIFICATION_LABELS[item.verification_status]}</p>
          ) : null}
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-medium", STATUS_STYLES[item.status])}>
          {STATUS_LABELS[item.status]}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {mode === "organizer" && item.status === "draft" ? (
          <Button
            size="sm"
            disabled={busy}
            onClick={() => void confirmTransition(
              "review",
              `Отправить «${title}» на проверку? До решения команды запись нельзя будет редактировать.`,
              "Отправляем на проверку",
            )}
          >
            На проверку
          </Button>
        ) : null}

        {mode === "admin" && kind === "vehicle" && item.status === "review" && item.verification_status !== "verified" ? (
          <div className="w-full space-y-3 rounded-2xl bg-surface-muted p-4">
            <FormField
              id={`mobility-documents-valid-${item.id}`}
              label="Документы действуют до"
              required
              hint="Дата нужна, чтобы вовремя запросить повторную проверку."
            >
              <Input
                type="date"
                required
                value={documentsValidUntil}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(event) => setDocumentsValidUntil(event.target.value)}
                disabled={busy}
              />
            </FormField>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={busy || !documentsValidUntil}
                onClick={() => {
                  if (!window.confirm(`Подтвердить проверку транспорта «${title}» до ${formatDate(documentsValidUntil)}?`)) return;
                  void mutate({
                    action: "verify_vehicle",
                    vehicleId: item.id,
                    expectedVersion: item.row_version,
                    approved: true,
                    documentsValidUntil,
                  }, "Подтверждаем проверку");
                }}
              >
                Подтвердить проверку
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={busy}
                onClick={() => {
                  if (!window.confirm(`Отклонить проверку транспорта «${title}»? Организатор увидит, что данные нужно исправить.`)) return;
                  void mutate({
                    action: "verify_vehicle",
                    vehicleId: item.id,
                    expectedVersion: item.row_version,
                    approved: false,
                  }, "Отклоняем проверку");
                }}
              >
                Отклонить
              </Button>
            </div>
          </div>
        ) : null}

        {mode === "admin" && item.status === "review" && (kind !== "vehicle" || item.verification_status === "verified") ? (
          <>
            <Button
              size="sm"
              disabled={busy}
              onClick={() => void confirmTransition(
                "published",
                `Опубликовать «${title}»? Запись станет доступна в соответствующем разделе сайта.`,
                "Публикуем",
              )}
            >
              Опубликовать
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => void confirmTransition(
                "draft",
                `Вернуть «${title}» на доработку? Запись не будет опубликована.`,
                "Возвращаем на доработку",
              )}
            >
              На доработку
            </Button>
          </>
        ) : null}

        {item.status !== "archived" ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => void confirmTransition(
              "archived",
              `Перенести «${title}» в архив? ${item.status === "published" ? "Запись исчезнет из публичного каталога." : "Её можно будет восстановить позже."}`,
              "Переносим в архив",
            )}
          >
            <Archive className="h-4 w-4" aria-hidden />
            В архив
          </Button>
        ) : null}

        {mode === "admin" && item.status === "archived" ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => void confirmTransition(
              "draft",
              `Восстановить «${title}» как черновик? Для публикации потребуется новая проверка.`,
              "Восстанавливаем черновик",
            )}
          >
            Восстановить
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function ProviderCard({
  provider,
  mode,
  busy,
  mutate,
}: {
  provider: MobilityInventoryProvider;
  mode: Props["mode"];
  busy: boolean;
  mutate: (payload: Record<string, unknown>, label: string) => Promise<boolean>;
}) {
  return (
    <article className={cn(cabinetCardClass, "p-5")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Канал приёма заявок</p>
          <h3 className="mt-1 font-semibold text-foreground">{provider.displayName}</h3>
        </div>
        <ShieldCheck className="h-5 w-5 text-sky" aria-hidden />
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-xs text-muted">Проверка</dt><dd className="mt-0.5 font-medium text-foreground">{VERIFICATION_LABELS[provider.verificationStatus]}</dd></div>
        <div><dt className="text-xs text-muted">Готовность</dt><dd className="mt-0.5 font-medium text-foreground">{READINESS_LABELS[provider.readinessStatus]}</dd></div>
        <div><dt className="text-xs text-muted">Состояние</dt><dd className="mt-0.5 font-medium text-foreground">{HEALTH_LABELS[provider.healthStatus]}</dd></div>
        <div><dt className="text-xs text-muted">Цены для гостей</dt><dd className="mt-0.5 font-medium text-foreground">{CURRENCY_LABELS[provider.displayCurrency] ?? provider.displayCurrency}</dd></div>
      </dl>
      {mode === "admin" && provider.verificationStatus !== "verified" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={busy}
            onClick={() => {
              if (!window.confirm(`Разрешить каналу «${provider.displayName}» принимать предложения в выбранном разделе?`)) return;
              void mutate({
                action: "verify_provider_market",
                providerId: provider.id,
                vertical: provider.vertical,
                marketId: provider.marketId,
                expectedVersion: provider.rowVersion,
                approved: true,
              }, "Разрешаем канал");
            }}
          >
            Разрешить работу
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={busy}
            onClick={() => {
              if (!window.confirm(`Отклонить проверку канала «${provider.displayName}»? Новые предложения не станут публичными.`)) return;
              void mutate({
                action: "verify_provider_market",
                providerId: provider.id,
                vertical: provider.vertical,
                marketId: provider.marketId,
                expectedVersion: provider.rowVersion,
                approved: false,
              }, "Отклоняем канал");
            }}
          >
            Отклонить
          </Button>
        </div>
      ) : null}
    </article>
  );
}

export default function MobilityInventoryWorkspace({ mode }: Props) {
  const [vertical, setVertical] = useState<MobilityVertical>("rental");
  const [marketPreset, setMarketPreset] = useState<MarketPreset>("ar");
  const [marketId, setMarketId] = useState<string>(MARKET_PRESETS.ar.marketId);
  const [countryCode, setCountryCode] = useState<string>(MARKET_PRESETS.ar.countryCode);
  const [timezone, setTimezone] = useState<string>(MARKET_PRESETS.ar.timezone);
  const [sourceCurrency, setSourceCurrency] = useState<string>(MARKET_PRESETS.ar.sourceCurrency);
  const [displayCurrency, setDisplayCurrency] = useState<string>(MARKET_PRESETS.ar.displayCurrency);
  const customMarketRef = useRef({
    marketId: "",
    countryCode: "",
    timezone: "",
    sourceCurrency: "USD",
    displayCurrency: "USD",
  });
  const [inventory, setInventory] = useState(EMPTY);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const mutationLockRef = useRef(false);
  const loadSequenceRef = useRef(0);
  const endpoint = mode === "admin" ? "/api/admin/mobility" : "/api/organizer/mobility";

  const load = useCallback(async (preserveNotice = false) => {
    const sequence = ++loadSequenceRef.current;
    setLoading(true);
    try {
      const response = await fetch(
        `${endpoint}?vertical=${vertical}&marketId=${encodeURIComponent(marketId)}`,
        { cache: "no-store" },
      );
      const payload = await response.json().catch(() => ({})) as { inventory?: MobilityInventory };
      if (!response.ok || !payload.inventory) throw new Error("inventory_unavailable");
      if (sequence !== loadSequenceRef.current) return;
      setInventory(payload.inventory);
      if (!preserveNotice) setNotice(null);
    } catch {
      if (sequence !== loadSequenceRef.current) return;
      setInventory(EMPTY);
      setNotice({
        variant: "error",
        title: "Не удалось загрузить авто и трансферы",
        description: "Старые данные не показываются. Проверьте соединение и обновите список.",
      });
    } finally {
      if (sequence === loadSequenceRef.current) setLoading(false);
    }
  }, [endpoint, marketId, vertical]);

  useEffect(() => { void load(); }, [load]);

  function applyPreset(nextPreset: MarketPreset) {
    if (nextPreset === "custom") {
      const custom = customMarketRef.current.marketId
        ? customMarketRef.current
        : { marketId, countryCode, timezone, sourceCurrency, displayCurrency };
      customMarketRef.current = custom;
      setMarketId(custom.marketId);
      setCountryCode(custom.countryCode);
      setTimezone(custom.timezone);
      setSourceCurrency(custom.sourceCurrency);
      setDisplayCurrency(custom.displayCurrency);
      setMarketPreset("custom");
      return;
    }
    if (marketPreset === "custom") {
      customMarketRef.current = { marketId, countryCode, timezone, sourceCurrency, displayCurrency };
    }
    const preset = MARKET_PRESETS[nextPreset];
    setMarketId(preset.marketId);
    setCountryCode(preset.countryCode);
    setTimezone(preset.timezone);
    setSourceCurrency(preset.sourceCurrency);
    setDisplayCurrency(preset.displayCurrency);
    setMarketPreset(nextPreset);
  }

  function updateCustomField(field: keyof typeof customMarketRef.current, value: string) {
    customMarketRef.current = { ...customMarketRef.current, [field]: value };
    if (field === "marketId") setMarketId(value);
    if (field === "countryCode") setCountryCode(value);
    if (field === "timezone") setTimezone(value);
    if (field === "sourceCurrency") setSourceCurrency(value);
    if (field === "displayCurrency") setDisplayCurrency(value);
  }

  async function mutate(payload: Record<string, unknown>, label: string): Promise<boolean> {
    if (mutationLockRef.current) return false;
    mutationLockRef.current = true;
    setBusyLabel(label);
    setNotice(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({})) as { code?: string };
      if (!response.ok) {
        const description = response.status === 409 || data.code === "VERSION_CONFLICT"
          ? "Данные уже изменились в другой вкладке. Обновите список и повторите решение."
          : response.status === 403
            ? "У вашей роли нет права на это действие."
            : "Проверьте заполнение и попробуйте ещё раз.";
        setNotice({ variant: "error", title: "Изменение не сохранено", description });
        return false;
      }
      setNotice({ variant: "success", title: "Готово", description: "Изменение сохранено и журналировано." });
      await load(true);
      return true;
    } catch {
      setNotice({
        variant: "error",
        title: "Связь прервалась",
        description: "Проверьте соединение и повторите действие. Список автоматически не изменён.",
      });
      return false;
    } finally {
      mutationLockRef.current = false;
      setBusyLabel(null);
    }
  }

  async function createVehicle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutationLockRef.current) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const providerId = String(values.get("providerId") ?? "");
    if (!providerId) {
      setNotice({ variant: "error", title: "Сначала подготовьте канал приёма заявок" });
      return;
    }
    const saved = await mutate({
      action: "create_vehicle",
      vertical,
      marketId,
      countryCode,
      timezone,
      providerId,
      publicName: values.get("publicName"),
      vehicleClass: values.get("vehicleClass"),
      seatCapacity: Number(values.get("seats")),
      luggageCapacity: Number(values.get("luggage")),
    }, "Сохраняем транспорт");
    if (saved) form.reset();
  }

  async function createOffer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutationLockRef.current) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const rateMinor = majorToMinor(values.get("rateMajor"));
    const depositMinor = majorToMinor(values.get("depositMajor"));
    if (rateMinor === null || (vertical === "rental" && depositMinor === null)) {
      setNotice({
        variant: "error",
        title: "Проверьте стоимость",
        description: "Укажите сумму в обычном формате, например 125 или 125,50.",
      });
      return;
    }
    const saved = await mutate({
      action: "create_offer",
      vertical,
      marketId,
      countryCode,
      providerId: values.get("providerId"),
      vehicleId: values.get("vehicleId"),
      pickupTimezone: timezone,
      dropoffTimezone: timezone,
      slug: values.get("slug"),
      title: values.get("title"),
      originLabel: values.get("origin"),
      destinationLabel: values.get("destination"),
      sourceCurrency,
      displayCurrency,
      rateMinor,
      policy: vertical === "rental"
        ? {
            depositMinor,
            mileagePolicy: "unlimited",
            fuelPolicy: "same_to_same",
            insuranceSummary: values.get("policy"),
          }
        : {
            meetingPolicy: values.get("policy"),
            flightDelayPolicy: "Задержка согласуется с диспетчером",
            noShowPolicy: "Условия сообщаются до подтверждения",
            confirmationMode: "manual",
          },
    }, "Сохраняем предложение");
    if (saved) form.reset();
  }

  async function uploadDocument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutationLockRef.current) return;
    mutationLockRef.current = true;
    const form = event.currentTarget;
    const body = new FormData(form);
    body.set("vertical", vertical);
    setBusyLabel("Безопасно загружаем документ");
    setNotice(null);
    try {
      const response = await fetch("/api/organizer/mobility/documents", { method: "POST", body });
      if (!response.ok) {
        setNotice({
          variant: "error",
          title: "Документ не загружен",
          description: response.status === 413
            ? "Файл больше 10 МБ. Выберите уменьшенную копию."
            : "Проверьте формат, срок действия и выбранный транспорт.",
        });
        return;
      }
      form.reset();
      setNotice({ variant: "success", title: "Документ передан на проверку", description: "Файл хранится в закрытом разделе и не публикуется на сайте." });
      await load(true);
    } catch {
      setNotice({ variant: "error", title: "Связь прервалась", description: "Обновите список перед повторной загрузкой." });
    } finally {
      mutationLockRef.current = false;
      setBusyLabel(null);
    }
  }

  async function openDocument(documentId: string) {
    if (mutationLockRef.current) return;
    mutationLockRef.current = true;
    setBusyLabel("Готовим защищённый просмотр");
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/mobility/documents/${encodeURIComponent(documentId)}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({})) as { url?: string };
      if (!response.ok || !payload.url) {
        setNotice({ variant: "error", title: "Документ временно недоступен", description: "Обновите список и повторите позже." });
        return;
      }
      const tab = window.open(payload.url, "_blank", "noopener,noreferrer");
      if (!tab) setNotice({ variant: "info", title: "Браузер заблокировал новую вкладку", description: "Разрешите всплывающие окна для кабинета и повторите просмотр." });
    } catch {
      setNotice({ variant: "error", title: "Не удалось открыть документ", description: "Проверьте соединение и повторите позже." });
    } finally {
      mutationLockRef.current = false;
      setBusyLabel(null);
    }
  }

  const busy = busyLabel !== null;
  const offers = vertical === "rental" ? inventory.rentalOffers : inventory.transferServices;

  return (
    <div className="space-y-6">
      <section className={cabinetPanelClass}>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Что вы настраиваете</h2>
          <p className="mt-1 text-sm text-muted">Выберите услугу и страну. Эти настройки сохраняются вместе с каждым предложением.</p>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField id="mobility-vertical" label="Услуга" required>
            <NativeSelect
              value={vertical}
              onChange={(event) => setVertical(event.target.value as MobilityVertical)}
              disabled={busy}
            >
              <option value="rental">Аренда авто</option>
              <option value="transfer">Трансферы</option>
            </NativeSelect>
          </FormField>
          <FormField id="mobility-market-preset" label="Страна и раздел сайта" required>
            <NativeSelect
              value={marketPreset}
              onChange={(event) => applyPreset(event.target.value as MarketPreset)}
              disabled={busy}
            >
              <option value="ar">Аргентина</option>
              <option value="uy">Уругвай</option>
              <option value="custom">Другая страна</option>
            </NativeSelect>
          </FormField>
          <FormField id="mobility-timezone" label="Местное время" required hint="Используется для подачи и возврата транспорта.">
            <NativeSelect
              value={[MARKET_PRESETS.ar.timezone, MARKET_PRESETS.uy.timezone].includes(timezone as never) ? timezone : "custom"}
              onChange={(event) => {
                if (event.target.value !== "custom") {
                  setTimezone(event.target.value);
                  if (marketPreset === "custom") updateCustomField("timezone", event.target.value);
                }
              }}
              disabled={busy}
            >
              <option value={MARKET_PRESETS.ar.timezone}>Аргентина — Буэнос-Айрес</option>
              <option value={MARKET_PRESETS.uy.timezone}>Уругвай — Монтевидео</option>
              {!([MARKET_PRESETS.ar.timezone, MARKET_PRESETS.uy.timezone] as readonly string[]).includes(timezone) ? <option value="custom">Другое местное время</option> : null}
            </NativeSelect>
          </FormField>
          <FormField id="mobility-source-currency" label="Валюта расчётов" required hint="В ней организатор задаёт стоимость.">
            <NativeSelect
              value={sourceCurrency}
              onChange={(event) => {
                setSourceCurrency(event.target.value);
                if (marketPreset === "custom") updateCustomField("sourceCurrency", event.target.value);
              }}
              disabled={busy}
            >
              <option value="ARS">ARS — аргентинское песо</option>
              <option value="UYU">UYU — уругвайское песо</option>
              <option value="USD">USD — доллар США</option>
              {!(["ARS", "UYU", "USD"] as const).includes(sourceCurrency as "ARS") ? <option value={sourceCurrency}>{sourceCurrency}</option> : null}
            </NativeSelect>
          </FormField>
          <FormField id="mobility-display-currency" label="Валюта для гостя" required hint="В ней цена показывается в каталоге.">
            <NativeSelect
              value={displayCurrency}
              onChange={(event) => {
                setDisplayCurrency(event.target.value);
                if (marketPreset === "custom") updateCustomField("displayCurrency", event.target.value);
              }}
              disabled={busy}
            >
              <option value="USD">USD — доллар США</option>
              <option value="ARS">ARS — аргентинское песо</option>
              <option value="UYU">UYU — уругвайское песо</option>
              {!(["ARS", "UYU", "USD"] as const).includes(displayCurrency as "ARS") ? <option value={displayCurrency}>{displayCurrency}</option> : null}
            </NativeSelect>
          </FormField>
        </div>

        {marketPreset === "custom" ? (
          <div className="mt-4 grid gap-4 rounded-2xl bg-surface-muted p-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField id="mobility-custom-market" label="Код раздела" required hint="Короткий код для адресов сайта, например br.">
              <Input
                value={marketId}
                minLength={2}
                maxLength={40}
                pattern="[a-z0-9][a-z0-9_-]+"
                onChange={(event) => updateCustomField("marketId", event.target.value.toLowerCase())}
                disabled={busy}
              />
            </FormField>
            <FormField id="mobility-custom-country" label="Код страны" required hint="Две буквы, например BR.">
              <Input
                value={countryCode}
                minLength={2}
                maxLength={2}
                pattern="[A-Z]{2}"
                onChange={(event) => updateCustomField("countryCode", event.target.value.toUpperCase())}
                disabled={busy}
              />
            </FormField>
            <FormField id="mobility-custom-timezone" label="Местное время страны" required hint="Например America/Sao_Paulo.">
              <Input
                value={timezone}
                minLength={3}
                onChange={(event) => updateCustomField("timezone", event.target.value)}
                disabled={busy}
              />
            </FormField>
          </div>
        ) : null}
      </section>

      {busyLabel ? <InlineFeedback variant="loading" title={busyLabel} description="Не закрывайте страницу до завершения действия." /> : null}
      {notice ? <InlineFeedback {...notice} action={notice.variant === "error" ? { label: "Обновить список", onClick: () => void load() } : undefined} /> : null}
      {loading ? <InlineFeedback variant="loading" title="Загружаем транспорт и предложения" /> : null}

      {!loading && mode === "organizer" && inventory.providers.length === 0 ? (
        <section className={cabinetPanelClass}>
          <EmptyState
            icon={ShieldCheck}
            variant="cabinet"
            title="Подготовьте канал приёма заявок"
            description="Он свяжет транспорт и предложения с выбранной страной. После этого можно сохранять черновики."
            action={{
              label: busy ? "Подготавливаем…" : "Подготовить канал",
              onClick: () => void mutate({
                action: "ensure_provider",
                vertical,
                marketId,
                countryCode,
                timezone,
                sourceCurrency,
                displayCurrency,
              }, "Подготавливаем канал"),
            }}
          />
        </section>
      ) : null}

      {!loading && inventory.providers.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold text-foreground">Каналы приёма заявок</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {inventory.providers.map((provider) => (
              <ProviderCard key={`${provider.id}:${provider.vertical}`} provider={provider} mode={mode} busy={busy} mutate={mutate} />
            ))}
          </div>
        </section>
      ) : null}

      {!loading ? (
        <MobilityRequestInbox mode={mode} vertical={vertical} vehicles={inventory.vehicles} />
      ) : null}

      {!loading && mode === "organizer" && inventory.providers.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <form onSubmit={createVehicle} className={cn(cabinetPanelClass, "space-y-4")}>
            <div><h2 className="font-semibold text-foreground">1. Добавьте транспорт</h2><p className="mt-1 text-sm text-muted">Сохранится черновик. Публикация возможна только после проверки документов.</p></div>
            <FormField id="mobility-vehicle-provider" label="Канал заявок" required>
              <NativeSelect name="providerId" disabled={busy}>
                {inventory.providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.displayName}</option>)}
              </NativeSelect>
            </FormField>
            <FormField id="mobility-vehicle-name" label="Название для гостей" required hint="Например Toyota Corolla или Минивэн на 7 мест.">
              <Input name="publicName" required minLength={2} maxLength={160} disabled={busy} />
            </FormField>
            <FormField id="mobility-vehicle-class" label="Класс транспорта" required>
              <NativeSelect name="vehicleClass" disabled={busy}>
                <option value="economy">Эконом</option>
                <option value="comfort">Комфорт</option>
                <option value="business">Бизнес</option>
                <option value="suv">Внедорожник</option>
                <option value="minivan">Минивэн</option>
                <option value="van">Фургон</option>
                <option value="bus">Автобус</option>
              </NativeSelect>
            </FormField>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField id="mobility-vehicle-seats" label="Пассажирских мест" required>
                <Input name="seats" required min={1} max={80} type="number" inputMode="numeric" disabled={busy} />
              </FormField>
              <FormField id="mobility-vehicle-luggage" label="Мест для багажа" required>
                <Input name="luggage" required min={0} max={100} type="number" inputMode="numeric" disabled={busy} />
              </FormField>
            </div>
            <Button type="submit" loading={busy} loadingLabel={busyLabel ?? undefined}>Сохранить транспорт</Button>
          </form>

          <form onSubmit={createOffer} className={cn(cabinetPanelClass, "space-y-4")}>
            <div><h2 className="font-semibold text-foreground">2. Добавьте {vertical === "rental" ? "условия аренды" : "маршрут"}</h2><p className="mt-1 text-sm text-muted">Гость отправит заявку. Доступность и итоговые условия вы подтвердите отдельно.</p></div>
            <FormField id="mobility-offer-provider" label="Канал заявок" required>
              <NativeSelect name="providerId" disabled={busy}>
                {inventory.providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.displayName}</option>)}
              </NativeSelect>
            </FormField>
            <FormField id="mobility-offer-vehicle" label="Транспорт" required>
              <NativeSelect name="vehicleId" disabled={busy || inventory.vehicles.length === 0}>
                {inventory.vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.public_name || "Транспорт без названия"}</option>)}
              </NativeSelect>
            </FormField>
            <FormField id="mobility-offer-title" label="Название предложения" required hint={vertical === "rental" ? "Например Авто на неделю в Мендосе." : "Например Аэропорт EZE — центр Буэнос-Айреса."}>
              <Input name="title" required minLength={2} maxLength={180} disabled={busy} />
            </FormField>
            <FormField id="mobility-offer-slug" label="Адрес страницы" required hint="Латинские буквы, цифры и дефисы: eze-buenos-aires. Он станет частью ссылки.">
              <Input name="slug" required minLength={2} maxLength={160} pattern="[a-z0-9-]+" placeholder="eze-buenos-aires" disabled={busy} />
            </FormField>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField id="mobility-offer-origin" label={vertical === "rental" ? "Где получить авто" : "Откуда"} required>
                <Input name="origin" required minLength={2} maxLength={180} disabled={busy} />
              </FormField>
              <FormField id="mobility-offer-destination" label={vertical === "rental" ? "Где вернуть авто" : "Куда"} required>
                <Input name="destination" required minLength={2} maxLength={180} disabled={busy} />
              </FormField>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField id="mobility-offer-rate" label={`Стоимость, ${sourceCurrency}`} required hint="Обычная сумма: 125 или 125,50.">
                <Input name="rateMajor" required min={0} step="0.01" type="number" inputMode="decimal" disabled={busy} />
              </FormField>
              {vertical === "rental" ? (
                <FormField id="mobility-offer-deposit" label={`Возвратный залог, ${sourceCurrency}`} required hint="Укажите 0, если залога нет.">
                  <Input name="depositMajor" required defaultValue="0" min={0} step="0.01" type="number" inputMode="decimal" disabled={busy} />
                </FormField>
              ) : null}
            </div>
            <FormField
              id="mobility-offer-policy"
              label={vertical === "rental" ? "Что входит в страхование" : "Как проходит встреча"}
              required
              hint="Опишите простыми словами то, что важно знать гостю до отправки заявки."
            >
              <Textarea name="policy" required minLength={10} maxLength={1200} rows={4} disabled={busy} />
            </FormField>
            <Button type="submit" disabled={inventory.vehicles.length === 0} loading={busy} loadingLabel={busyLabel ?? undefined}>
              Сохранить предложение
            </Button>
            {inventory.vehicles.length === 0 ? <p className="text-xs text-muted">Сначала сохраните хотя бы один транспорт.</p> : null}
          </form>
        </div>
      ) : null}

      {!loading ? (
        <section>
          <h2 className="text-lg font-semibold text-foreground">Документы транспорта</h2>
          <p className="mt-1 text-sm text-muted">Здесь видны только результаты безопасной проверки. Сами файлы и номера документов публично не показываются.</p>
          {mode === "organizer" && inventory.vehicles.length > 0 ? (
            <form onSubmit={uploadDocument} className={cn(cabinetPanelClass, "mt-4 grid gap-4 md:grid-cols-2")}>
              <div className="md:col-span-2">
                <h3 className="font-semibold text-foreground">Передать документ на проверку</h3>
                <p className="mt-1 text-sm text-muted">PDF, JPG, PNG или WebP до 10 МБ. Файл останется закрытым и будет доступен только проверяющему.</p>
              </div>
              <FormField id="mobility-document-vehicle" label="Транспорт" required>
                <NativeSelect name="vehicleId" required disabled={busy}>
                  <option value="">Выберите транспорт</option>
                  {inventory.vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.public_name || "Транспорт"}</option>)}
                </NativeSelect>
              </FormField>
              <FormField id="mobility-document-type" label="Тип документа" required>
                <NativeSelect name="documentType" required disabled={busy}>
                  <option value="registration">Регистрация транспорта</option>
                  <option value="insurance">Страхование</option>
                  <option value="inspection">Технический осмотр</option>
                  <option value="driver_license">Водительское удостоверение</option>
                  <option value="passenger_license">Разрешение на перевозку</option>
                </NativeSelect>
              </FormField>
              <FormField id="mobility-document-expiry" label="Действует до" required>
                <Input name="expiresAt" type="date" min={new Date().toISOString().slice(0, 10)} required disabled={busy} />
              </FormField>
              <FormField id="mobility-document-last4" label="Последние 4 символа номера" optional hint="Помогают отличить документы, полный номер не сохраняем в карточке.">
                <Input name="identifierLast4" maxLength={4} autoComplete="off" disabled={busy} />
              </FormField>
              <FormField id="mobility-document-file" label="Файл" required>
                <Input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required disabled={busy} />
              </FormField>
              <div className="self-end"><Button type="submit" loading={busy} loadingLabel={busyLabel ?? undefined}>Передать на проверку</Button></div>
            </form>
          ) : null}
          {inventory.documents.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                icon={FileCheck2}
                variant={mode === "admin" ? "admin" : "cabinet"}
                title="Проверенных документов пока нет"
                description={mode === "organizer"
                  ? "Загрузите первый документ через закрытую форму выше. После проверки статус обновится здесь."
                  : "Документы появятся после безопасной загрузки организатором. Не запрашивайте их через открытые комментарии."}
              />
            </div>
          ) : (
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {inventory.documents.map((document) => (
                <article key={document.id} className={cn(cabinetCardClass, "p-5")}>
                  <h3 className="font-semibold text-foreground">{DOCUMENT_LABELS[document.documentType] ?? "Документ транспорта"}</h3>
                  <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <div><dt className="text-xs text-muted">Действует до</dt><dd className="mt-0.5 font-medium">{formatDate(document.expiresAt)}</dd></div>
                    <div><dt className="text-xs text-muted">Проверка</dt><dd className="mt-0.5 font-medium">{VERIFICATION_LABELS[document.verificationStatus]}</dd></div>
                  </dl>
                  {mode === "admin" && document.verificationStatus === "pending" ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" disabled={busy} onClick={() => void openDocument(document.id)}>
                        Открыть для проверки
                      </Button>
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => {
                          if (!window.confirm("Подтвердить документ? Убедитесь, что срок и принадлежность транспорта проверены.")) return;
                          void mutate({ action: "review_document", documentId: document.id, approved: true }, "Подтверждаем документ");
                        }}
                      >
                        Подтвердить
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={busy}
                        onClick={() => {
                          if (!window.confirm("Отклонить документ? Организатору потребуется передать исправленный документ.")) return;
                          void mutate({ action: "review_document", documentId: document.id, approved: false }, "Отклоняем документ");
                        }}
                      >
                        Отклонить
                      </Button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {!loading ? (
        <section>
          <div className="flex items-center gap-2"><CarFront className="h-5 w-5 text-sky" aria-hidden /><h2 className="text-lg font-semibold text-foreground">Транспорт</h2></div>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {inventory.vehicles.map((item) => <ItemCard key={item.id} item={item} kind="vehicle" vertical={vertical} mode={mode} busy={busy} mutate={mutate} />)}
          </div>
          {inventory.vehicles.length === 0 ? <div className="mt-3"><EmptyState icon={CarFront} variant={mode === "admin" ? "admin" : "cabinet"} title="Транспорт пока не добавлен" description={mode === "admin" ? "В выбранном разделе нет транспорта для проверки." : "Добавьте первый автомобиль или другой транспорт в форме выше."} /></div> : null}
        </section>
      ) : null}

      {!loading ? (
        <section>
          <div className="flex items-center gap-2"><Route className="h-5 w-5 text-sky" aria-hidden /><h2 className="text-lg font-semibold text-foreground">{vertical === "rental" ? "Предложения аренды" : "Маршруты трансферов"}</h2></div>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {offers.map((item) => <ItemCard key={item.id} item={item} kind={vertical} vertical={vertical} mode={mode} busy={busy} mutate={mutate} />)}
          </div>
          {offers.length === 0 ? <div className="mt-3"><EmptyState icon={Route} variant={mode === "admin" ? "admin" : "cabinet"} title={vertical === "rental" ? "Предложений аренды пока нет" : "Маршрутов пока нет"} description={mode === "admin" ? "В выбранном разделе нет предложений для проверки." : "Сохраните первое предложение в форме выше."} /></div> : null}
        </section>
      ) : null}

      {!loading && mode === "organizer" ? (
        <InlineFeedback
          variant="info"
          title="Публикацию подтверждает команда сайта"
          description="Предложение не означает мгновенную доступность или оплату. Сначала проверяются документы, транспорт и условия, а каждую заявку вы подтверждаете отдельно."
          steps={[
            "Занятость формируется автоматически, когда вы подтверждаете заявку и назначаете транспорт.",
            "Документы передаются через закрытую форму и не попадают в публичный каталог.",
          ]}
        />
      ) : null}

      {!loading && notice?.variant === "error" ? (
        <Button variant="ghost" size="sm" onClick={() => void load()} disabled={busy}>
          <RefreshCw className="h-4 w-4" aria-hidden /> Обновить данные
        </Button>
      ) : null}
    </div>
  );
}
