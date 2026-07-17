"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Archive,
  Building2,
  CalendarDays,
  CheckCircle2,
  Circle,
  ImagePlus,
  MapPin,
  Pencil,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  Undo2,
} from "lucide-react";
import CmsMediaPathField from "@/components/admin/CmsMediaPathField";
import ApartmentInquiryInbox from "@/components/apartments/ApartmentInquiryInbox";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cabinetCardClass, cabinetPanelClass } from "@/lib/cabinet-ui";
import { cn } from "@/lib/cn";
import type { ApartmentImageInput, ApartmentPrivate } from "@/types/apartments";

type Role = "admin" | "organizer";

type Draft = {
  marketId: string;
  countryCode: string;
  slug: string;
  propertyTimezone: string;
  title: string;
  summary: string;
  description: string;
  locality: string;
  region: string;
  publicLocationNote: string;
  publicLatitude: string;
  publicLongitude: string;
  exactAddress: string;
  accessInstructions: string;
  maxGuests: string;
  bedrooms: string;
  beds: string;
  bathrooms: string;
  nightlyPriceMajor: string;
  currency: string;
  minimumStayNights: string;
  depositMajor: string;
  depositDisclosure: string;
  cancellationDisclosure: string;
  amenities: string;
  houseRules: string;
};

type EditableImage = ApartmentImageInput & { clientKey: string };
type AvailabilityBlock = {
  clientKey: string;
  startDate: string;
  endDate: string;
  note: string;
};
type Notice = {
  variant: "success" | "error" | "info";
  title: string;
  description?: string;
};

const COUNTRY_OPTIONS = [
  { value: "AR", label: "Аргентина" },
  { value: "UY", label: "Уругвай" },
] as const;
const MARKET_OPTIONS = [
  { value: "ar", label: "Аргентина" },
  { value: "uy", label: "Уругвай" },
] as const;
const TIMEZONE_OPTIONS = [
  { value: "America/Argentina/Buenos_Aires", label: "Аргентина — Буэнос-Айрес" },
  { value: "America/Montevideo", label: "Уругвай — Монтевидео" },
] as const;
const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD — доллар США" },
  { value: "ARS", label: "ARS — аргентинское песо" },
  { value: "UYU", label: "UYU — уругвайское песо" },
] as const;
const LICENSE_OPTIONS = [
  { value: "owned", label: "Собственное фото" },
  { value: "licensed", label: "Есть разрешение или лицензия" },
  { value: "partner", label: "Предоставлено партнёром" },
] as const;
const STATUS_LABELS = {
  draft: "Черновик",
  review: "На проверке",
  published: "Опубликован",
  archived: "В архиве",
} as const;

let clientKeySequence = 0;

function nextClientKey(prefix: string): string {
  clientKeySequence += 1;
  return `${prefix}-${Date.now()}-${clientKeySequence}`;
}

function createEmptyDraft(): Draft {
  return {
    marketId: "ar",
    countryCode: "AR",
    slug: "",
    propertyTimezone: "America/Argentina/Buenos_Aires",
    title: "",
    summary: "",
    description: "",
    locality: "",
    region: "",
    publicLocationNote: "",
    publicLatitude: "",
    publicLongitude: "",
    exactAddress: "",
    accessInstructions: "",
    maxGuests: "2",
    bedrooms: "1",
    beds: "1",
    bathrooms: "1",
    nightlyPriceMajor: "",
    currency: "USD",
    minimumStayNights: "1",
    depositMajor: "",
    depositDisclosure: "",
    cancellationDisclosure: "",
    amenities: "Wi‑Fi, Кухня",
    houseRules: "Не курить",
  };
}

export function createEditableImage(image?: ApartmentImageInput): EditableImage {
  return {
    clientKey: nextClientKey("apartment-image"),
    mediaRef: image?.mediaRef ?? "",
    altText: image?.altText ?? "",
    rightsHolder: image?.rightsHolder ?? "",
    rightsSourceUrl: image?.rightsSourceUrl ?? "",
    licenseCode: image?.licenseCode ?? "owned",
    position: image?.position ?? 0,
  };
}

/** Переводит привычную денежную запись в целое число минимальных единиц без float-округлений. */
export function moneyTextToMinor(value: string): number | null {
  const normalized = value.trim().replace(/[\s\u00a0\u202f]/g, "").replace(",", ".");
  const match = normalized.match(/^(\d{1,16})(?:\.(\d{1,2}))?$/);
  if (!match) return null;
  const whole = BigInt(match[1]);
  const fraction = BigInt((match[2] ?? "").padEnd(2, "0"));
  const minor = whole * BigInt(100) + fraction;
  if (minor > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  return Number(minor);
}

export function minorToMoneyText(value: number | null): string {
  if (value === null || !Number.isSafeInteger(value) || value < 0) return "";
  return `${Math.floor(value / 100)}.${String(value % 100).padStart(2, "0")}`;
}

function toDraft(item: ApartmentPrivate): Draft {
  return {
    marketId: item.marketId,
    countryCode: item.countryCode,
    slug: item.slug,
    propertyTimezone: item.propertyTimezone,
    title: item.title,
    summary: item.summary,
    description: item.description,
    locality: item.locality,
    region: item.region,
    publicLocationNote: item.publicLocationNote,
    publicLatitude: item.publicLatitude?.toString() ?? "",
    publicLongitude: item.publicLongitude?.toString() ?? "",
    exactAddress: item.exactAddress,
    accessInstructions: item.accessInstructions,
    maxGuests: String(item.maxGuests),
    bedrooms: String(item.bedrooms),
    beds: String(item.beds),
    bathrooms: String(item.bathrooms),
    nightlyPriceMajor: minorToMoneyText(item.nightlyPriceMinor),
    currency: item.currency,
    minimumStayNights: String(item.minimumStayNights),
    depositMajor: minorToMoneyText(item.depositMinor),
    depositDisclosure: item.depositDisclosure,
    cancellationDisclosure: item.cancellationDisclosure,
    amenities: item.amenities.join(", "),
    houseRules: item.houseRules.join(", "),
  };
}

function optionsWithCurrent<T extends ReadonlyArray<{ value: string; label: string }>>(
  options: T,
  current: string,
): Array<{ value: string; label: string }> {
  const known = options.some((option) => option.value === current);
  return known || !current
    ? [...options]
    : [{ value: current, label: `${current} — текущее значение` }, ...options];
}

function parseStayRange(value: string): { startDate: string; endDate: string } | null {
  const match = value.match(/^\[([^,]+),([^\)]+)\)$/);
  if (!match?.[1] || !match[2]) return null;
  return { startDate: match[1], endDate: match[2] };
}

function publishReadiness(draft: Draft, images: EditableImage[]) {
  return [
    { label: "Краткое описание — не менее 20 знаков", ready: draft.summary.trim().length >= 20 },
    { label: "Полное описание — не менее 80 знаков", ready: draft.description.trim().length >= 80 },
    { label: "Условия отмены — не менее 10 знаков", ready: draft.cancellationDisclosure.trim().length >= 10 },
    { label: "Точный адрес заполнен и остаётся закрытым", ready: draft.exactAddress.trim().length >= 5 },
    {
      label: "Есть фотография с подписью и подтверждёнными правами",
      ready: images.some((image) => image.mediaRef.trim() && image.altText.trim().length >= 3 && image.rightsHolder.trim().length >= 2 && image.licenseCode.trim().length >= 2),
    },
  ];
}

export function apartmentActionConfirmation(item: ApartmentPrivate, actionName: string): string | null {
  if (actionName === "publish") {
    return `Опубликовать «${item.title}» на сайте? Проверьте фотографии, стоимость и условия проживания.`;
  }
  if (actionName === "return_to_draft") {
    return `Вернуть «${item.title}» организатору на доработку? Объект останется скрытым от посетителей.`;
  }
  if (actionName === "archive") {
    return item.status === "published"
      ? `Переместить «${item.title}» в архив? Объект сразу исчезнет с публичных страниц.`
      : `Переместить «${item.title}» в архив?`;
  }
  return null;
}

export default function ApartmentManagerView({ role }: { role: Role }) {
  const base = role === "admin" ? "/api/admin/apartments" : "/api/organizer/apartments";
  const [items, setItems] = useState<ApartmentPrivate[]>([]);
  const [selected, setSelected] = useState<ApartmentPrivate | null>(null);
  const [draft, setDraft] = useState<Draft>(() => createEmptyDraft());
  const [images, setImages] = useState<EditableImage[]>([]);
  const [ownerUserId, setOwnerUserId] = useState("");
  const [owners, setOwners] = useState<Array<{ id: string; label: string }>>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveBusy, setSaveBusy] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const saveLock = useRef(false);
  const actionLock = useRef(false);

  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [blockNote, setBlockNote] = useState("");
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityBusy, setAvailabilityBusy] = useState(false);
  const [availabilityDirty, setAvailabilityDirty] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const availabilityLock = useRef(false);
  const availabilityRequest = useRef(0);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch(base, { cache: "no-store", signal });
      const body = await response.json().catch(() => ({})) as {
        apartments?: ApartmentPrivate[];
        owners?: Array<{ id: string; label: string }>;
        error?: string;
      };
      if (!response.ok) throw new Error(body.error ?? "Не удалось загрузить объекты.");
      const apartments = body.apartments ?? [];
      setItems(apartments);
      setOwners(body.owners ?? []);
      return apartments;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return null;
      setLoadError(error instanceof Error ? error.message : "Не удалось загрузить объекты.");
      return null;
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function loadBlocks(item: ApartmentPrivate) {
    if (role !== "organizer") return;
    const requestId = availabilityRequest.current + 1;
    availabilityRequest.current = requestId;
    setAvailabilityLoading(true);
    setAvailabilityError("");
    setAvailabilityDirty(false);
    try {
      const response = await fetch(`/api/organizer/apartments/${item.id}/availability`, { cache: "no-store" });
      const body = await response.json().catch(() => ({})) as {
        blocks?: Array<{ stay_range: string; status: string; note: string }>;
        error?: string;
      };
      if (requestId !== availabilityRequest.current) return;
      if (!response.ok) throw new Error(body.error ?? "Не удалось загрузить календарь.");
      setBlocks((body.blocks ?? []).flatMap((block) => {
        if (block.status !== "blocked") return [];
        const range = parseStayRange(block.stay_range);
        return range ? [{ ...range, note: block.note, clientKey: nextClientKey("availability") }] : [];
      }));
    } catch (error) {
      if (requestId !== availabilityRequest.current) return;
      setAvailabilityError(error instanceof Error ? error.message : "Не удалось загрузить календарь.");
    } finally {
      if (requestId === availabilityRequest.current) setAvailabilityLoading(false);
    }
  }

  function edit(item: ApartmentPrivate) {
    if (availabilityDirty && !window.confirm("Закрыть несохранённые изменения календаря и открыть другой объект?")) return;
    setSelected(item);
    setDraft(toDraft(item));
    setImages(item.images.map((image) => createEditableImage(image)));
    setOwnerUserId(item.ownerUserId);
    setNotice(null);
    setBlocks([]);
    setBlockStart("");
    setBlockEnd("");
    setBlockNote("");
    void loadBlocks(item);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    availabilityRequest.current += 1;
    setSelected(null);
    setDraft(createEmptyDraft());
    setImages([]);
    setOwnerUserId("");
    setBlocks([]);
    setBlockStart("");
    setBlockEnd("");
    setBlockNote("");
    setAvailabilityDirty(false);
    setAvailabilityError("");
    setAvailabilityLoading(false);
    setNotice(null);
  }

  function startNew() {
    if (availabilityDirty && !window.confirm("Закрыть несохранённые изменения календаря и создать новый объект?")) return;
    reset();
  }

  function updateDraft(name: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [name]: value }));
  }

  function updateImage(clientKey: string, patch: Partial<ApartmentImageInput>) {
    setImages((current) => current.map((image) => image.clientKey === clientKey ? { ...image, ...patch } : image));
  }

  function removeImage(clientKey: string) {
    setImages((current) => current.filter((image) => image.clientKey !== clientKey));
  }

  function renderTextField(
    name: keyof Draft,
    label: string,
    options: {
      required?: boolean;
      hint?: string;
      placeholder?: string;
      type?: React.HTMLInputTypeAttribute;
      min?: string;
      max?: string;
      step?: string;
      inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
    } = {},
  ) {
    const id = `apartment-${name}`;
    return (
      <FormField id={id} label={label} required={options.required} hint={options.hint}>
        <Input
          value={draft[name]}
          onChange={(event) => updateDraft(name, event.target.value)}
          type={options.type ?? "text"}
          min={options.min}
          max={options.max}
          step={options.step}
          inputMode={options.inputMode}
          placeholder={options.placeholder}
          disabled={saveBusy}
        />
      </FormField>
    );
  }

  function renderTextareaField(
    name: keyof Draft,
    label: string,
    options: { required?: boolean; hint?: string; placeholder?: string; rows?: number } = {},
  ) {
    const id = `apartment-${name}`;
    return (
      <FormField id={id} label={label} required={options.required} hint={options.hint}>
        <Textarea
          value={draft[name]}
          onChange={(event) => updateDraft(name, event.target.value)}
          placeholder={options.placeholder}
          rows={options.rows}
          disabled={saveBusy}
        />
      </FormField>
    );
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saveLock.current) return;
    if (availabilityDirty) {
      setNotice({ variant: "error", title: "Сначала сохраните календарь", description: "В нём есть несохранённые изменения. После этого сохраните описание объекта." });
      return;
    }
    const nightlyPriceMinor = moneyTextToMinor(draft.nightlyPriceMajor);
    const depositMinor = draft.depositMajor.trim() ? moneyTextToMinor(draft.depositMajor) : null;
    if (nightlyPriceMinor === null || nightlyPriceMinor < 1) {
      setNotice({ variant: "error", title: "Проверьте цену за ночь", description: "Введите сумму, например 125.00 или 125,00." });
      return;
    }
    if (draft.depositMajor.trim() && depositMinor === null) {
      setNotice({ variant: "error", title: "Проверьте депозит", description: "Введите сумму не более чем с двумя знаками после запятой." });
      return;
    }
    if (role === "admin" && !ownerUserId) {
      setNotice({ variant: "error", title: "Выберите владельца объекта" });
      return;
    }

    saveLock.current = true;
    setSaveBusy(true);
    setNotice(null);
    const numeric = (name: keyof Draft) => Number(draft[name]);
    const payload = {
      ...draft,
      nightlyPriceMajor: undefined,
      depositMajor: undefined,
      ownerUserId: role === "admin" ? ownerUserId : undefined,
      expectedVersion: selected?.rowVersion,
      publicLatitude: draft.publicLatitude ? numeric("publicLatitude") : null,
      publicLongitude: draft.publicLongitude ? numeric("publicLongitude") : null,
      maxGuests: numeric("maxGuests"),
      bedrooms: numeric("bedrooms"),
      beds: numeric("beds"),
      bathrooms: numeric("bathrooms"),
      nightlyPriceMinor,
      minimumStayNights: numeric("minimumStayNights"),
      depositMinor,
      amenities: draft.amenities.split(",").map((value) => value.trim()).filter(Boolean),
      houseRules: draft.houseRules.split(",").map((value) => value.trim()).filter(Boolean),
      images: images.map((image, position) => ({
        mediaRef: image.mediaRef,
        altText: image.altText,
        rightsHolder: image.rightsHolder,
        rightsSourceUrl: image.rightsSourceUrl,
        licenseCode: image.licenseCode,
        position,
      })),
    };

    try {
      const response = await fetch(selected ? `${base}/${selected.id}` : base, {
        method: selected ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Не удалось сохранить объект.");
      reset();
      setNotice({ variant: "success", title: "Черновик сохранён" });
      await load();
    } catch (error) {
      setNotice({
        variant: "error",
        title: "Не удалось сохранить объект",
        description: error instanceof Error ? error.message : "Попробуйте ещё раз.",
      });
    } finally {
      saveLock.current = false;
      setSaveBusy(false);
    }
  }

  async function action(item: ApartmentPrivate, actionName: string) {
    if (actionLock.current) return;
    const question = apartmentActionConfirmation(item, actionName);
    if (question && !window.confirm(question)) return;
    actionLock.current = true;
    setActionBusyId(item.id);
    setNotice(null);
    const url = role === "admin" ? `${base}/${item.id}/moderate` : `${base}/${item.id}/submit`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(role === "admin"
          ? { action: actionName, expectedVersion: item.rowVersion }
          : { expectedVersion: item.rowVersion }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
      if (!response.ok) throw new Error(body.error ?? "Действие недоступно.");
      setNotice({ variant: "success", title: body.message ?? "Статус обновлён" });
      if (selected?.id === item.id) reset();
      await load();
    } catch (error) {
      setNotice({
        variant: "error",
        title: "Не удалось изменить статус",
        description: error instanceof Error ? error.message : "Попробуйте ещё раз.",
      });
    } finally {
      actionLock.current = false;
      setActionBusyId(null);
    }
  }

  function addBlock() {
    setAvailabilityError("");
    if (!blockStart || !blockEnd) {
      setAvailabilityError("Укажите дату начала и дату, с которой объект снова доступен.");
      return;
    }
    if (blockEnd <= blockStart) {
      setAvailabilityError("Дата окончания должна быть позже даты начала.");
      return;
    }
    const overlaps = blocks.some((block) => blockStart < block.endDate && blockEnd > block.startDate);
    if (overlaps) {
      setAvailabilityError("Этот период пересекается с уже добавленным. Измените даты.");
      return;
    }
    setBlocks((current) => [...current, {
      clientKey: nextClientKey("availability"),
      startDate: blockStart,
      endDate: blockEnd,
      note: blockNote.trim() || "Закрыто владельцем",
    }]);
    setBlockStart("");
    setBlockEnd("");
    setBlockNote("");
    setAvailabilityDirty(true);
  }

  function removeBlock(clientKey: string) {
    setBlocks((current) => current.filter((block) => block.clientKey !== clientKey));
    setAvailabilityDirty(true);
    setAvailabilityError("");
  }

  async function saveBlocks() {
    if (!selected || availabilityLock.current || !availabilityDirty) return;
    availabilityLock.current = true;
    setAvailabilityBusy(true);
    setAvailabilityError("");
    try {
      const response = await fetch(`/api/organizer/apartments/${selected.id}/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: blocks.map(({ startDate, endDate, note }) => ({ startDate, endDate, note })),
          expectedVersion: selected.rowVersion,
        }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Не удалось сохранить календарь.");
      setAvailabilityDirty(false);
      setNotice({ variant: "success", title: "Календарь недоступности сохранён" });
      const refreshedItems = await load();
      const refreshed = refreshedItems?.find((item) => item.id === selected.id);
      if (refreshed) {
        setSelected((current) => current?.id === refreshed.id
          ? { ...current, rowVersion: refreshed.rowVersion, updatedAt: refreshed.updatedAt, status: refreshed.status }
          : current);
      }
    } catch (error) {
      setAvailabilityError(error instanceof Error ? error.message : "Не удалось сохранить календарь.");
    } finally {
      availabilityLock.current = false;
      setAvailabilityBusy(false);
    }
  }

  const readiness = publishReadiness(draft, images);
  const readyCount = readiness.filter((item) => item.ready).length;
  const countryOptions = optionsWithCurrent(COUNTRY_OPTIONS, draft.countryCode);
  const marketOptions = optionsWithCurrent(MARKET_OPTIONS, draft.marketId);
  const timezoneOptions = optionsWithCurrent(TIMEZONE_OPTIONS, draft.propertyTimezone);
  const currencyOptions = optionsWithCurrent(CURRENCY_OPTIONS, draft.currency);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className={cn(cabinetPanelClass, "bg-gradient-to-br from-surface-elevated to-sky/[0.06]")}>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-wine">
              {role === "admin" ? "Каталог и модерация" : "Мои предложения"}
            </p>
            <h1 className="mt-1 font-heading text-3xl font-bold text-foreground">Апартаменты</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate">
              Создавайте понятные страницы объектов и управляйте их доступностью. Точный адрес и инструкции
              остаются закрытыми. Публикация означает возможность отправить запрос — не мгновенное бронирование и не оплату.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={startNew} disabled={saveBusy || availabilityBusy || Boolean(actionBusyId)}>
            <Plus className="h-4 w-4" aria-hidden />
            Новый объект
          </Button>
        </div>
      </header>

      <ApartmentInquiryInbox role={role} />

      {notice ? (
        <InlineFeedback
          className="mt-4"
          variant={notice.variant}
          title={notice.title}
          description={notice.description}
        />
      ) : null}
      {loadError ? (
        <InlineFeedback
          className="mt-4"
          variant="error"
          title="Список объектов не загрузился"
          description={loadError}
          action={{ label: "Повторить", onClick: () => void load() }}
        />
      ) : null}

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <form onSubmit={(event) => void save(event)} className={cn(cabinetCardClass, "overflow-hidden")}>
          <div className="border-b border-border-subtle px-5 py-5 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate">
              {selected ? "Сохранённый объект" : "Новый объект"}
            </p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-foreground">
              {selected ? selected.title : "Создать черновик"}
            </h2>
            <p className="mt-2 text-sm text-slate">
              Сначала сохраните черновик. После этого организатор сможет отправить его на проверку.
            </p>
          </div>

          <div className="space-y-8 p-5 sm:p-6">
            <section aria-labelledby="apartment-basic-heading">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky/10 text-sky"><Building2 className="h-5 w-5" aria-hidden /></span>
                <div>
                  <h3 id="apartment-basic-heading" className="font-heading text-lg font-bold">1. Основная информация</h3>
                  <p className="text-xs text-slate">То, что поможет посетителю быстро понять предложение.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">{renderTextField("title", "Название объекта", { required: true, placeholder: "Например, светлая квартира в Палермо" })}</div>
                {role === "admin" ? (
                  <FormField id="apartment-owner" label="Владелец объекта" required hint="Организатор увидит объект в своём кабинете.">
                    <NativeSelect id="apartment-owner" required value={ownerUserId} onChange={(event) => setOwnerUserId(event.target.value)} disabled={saveBusy}>
                      <option value="">Выберите организатора</option>
                      {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.label}</option>)}
                    </NativeSelect>
                  </FormField>
                ) : null}
                {renderTextField("slug", "Адрес страницы", { required: true, hint: "Латинские буквы, цифры и дефисы: palermo-light-apartment", placeholder: "palermo-light-apartment" })}
                <div className="sm:col-span-2">{renderTextareaField("summary", "Краткое описание", { required: true, rows: 3, hint: "Для проверки нужно не менее 20 знаков. Это описание видно в каталоге." })}</div>
                <div className="sm:col-span-2">{renderTextareaField("description", "Полное описание", { required: true, rows: 7, hint: "Для проверки нужно не менее 80 знаков. Расскажите о пространстве, районе и особенностях проживания." })}</div>
              </div>
            </section>

            <section aria-labelledby="apartment-location-heading" className="border-t border-border-subtle pt-8">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky/10 text-sky"><MapPin className="h-5 w-5" aria-hidden /></span>
                <div>
                  <h3 id="apartment-location-heading" className="font-heading text-lg font-bold">2. Расположение</h3>
                  <p className="text-xs text-slate">Публичное описание отдельно от закрытого точного адреса.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {renderTextField("locality", "Город или населённый пункт", { required: true, placeholder: "Буэнос-Айрес" })}
                {renderTextField("region", "Регион", { required: true, placeholder: "CABA" })}
                <FormField id="apartment-country" label="Страна" required hint="Определяет страну объекта и правила каталога.">
                  <NativeSelect id="apartment-country" value={draft.countryCode} onChange={(event) => updateDraft("countryCode", event.target.value)} disabled={saveBusy}>
                    {countryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </NativeSelect>
                </FormField>
                <FormField id="apartment-market" label="Раздел каталога" required hint="Обычно совпадает со страной. Это помогает развивать сайт для новых стран без переделки объектов.">
                  <NativeSelect id="apartment-market" value={draft.marketId} onChange={(event) => updateDraft("marketId", event.target.value)} disabled={saveBusy}>
                    {marketOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </NativeSelect>
                </FormField>
                <FormField id="apartment-timezone" label="Местное время объекта" required hint="Используется для дат заезда, выезда и связи с гостем.">
                  <NativeSelect id="apartment-timezone" value={draft.propertyTimezone} onChange={(event) => updateDraft("propertyTimezone", event.target.value)} disabled={saveBusy}>
                    {timezoneOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </NativeSelect>
                </FormField>
                <div className="sm:col-span-2">{renderTextareaField("publicLocationNote", "Как описать район на сайте", { rows: 2, hint: "Не указывайте номер дома, квартиры, код домофона или инструкции доступа.", placeholder: "Палермо, рядом с парком и остановками общественного транспорта" })}</div>
                <div className="sm:col-span-2 rounded-2xl border border-sky/20 bg-sky/5 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><ShieldCheck className="h-4 w-4 text-sky" aria-hidden />Закрытые данные</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">{renderTextField("exactAddress", "Точный адрес", { required: true, hint: "Доступен только владельцу и команде сайта." })}</div>
                    <div className="sm:col-span-2">{renderTextareaField("accessInstructions", "Инструкции доступа", { rows: 2, hint: "Ключи, домофон и порядок заселения не публикуются." })}</div>
                  </div>
                </div>
                {renderTextField("publicLatitude", "Примерная широта", { hint: "Необязательно. Указывайте вместе с долготой, не точнее двух знаков.", inputMode: "decimal", placeholder: "-34.58" })}
                {renderTextField("publicLongitude", "Примерная долгота", { hint: "Необязательно. Точка должна показывать район, а не точный дом.", inputMode: "decimal", placeholder: "-58.42" })}
              </div>
            </section>

            <section aria-labelledby="apartment-capacity-heading" className="border-t border-border-subtle pt-8">
              <div className="mb-4">
                <h3 id="apartment-capacity-heading" className="font-heading text-lg font-bold">3. Размещение и стоимость</h3>
                <p className="mt-1 text-xs text-slate">Цена вводится обычной суммой. Система сама сохранит её точно.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {renderTextField("maxGuests", "Максимум гостей", { required: true, type: "number", min: "1", max: "40", step: "1" })}
                {renderTextField("bedrooms", "Спальни", { required: true, type: "number", min: "0", max: "20", step: "1" })}
                {renderTextField("beds", "Спальные места", { required: true, type: "number", min: "1", max: "40", step: "1" })}
                {renderTextField("bathrooms", "Ванные комнаты", { required: true, type: "number", min: "0.5", max: "20", step: "0.5" })}
                {renderTextField("minimumStayNights", "Минимум ночей", { required: true, type: "number", min: "1", max: "365", step: "1" })}
                <FormField id="apartment-currency" label="Валюта цены" required hint="Цена и депозит сохраняются в выбранной валюте.">
                  <NativeSelect id="apartment-currency" value={draft.currency} onChange={(event) => updateDraft("currency", event.target.value)} disabled={saveBusy}>
                    {currencyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </NativeSelect>
                </FormField>
                <div className="lg:col-span-2">{renderTextField("nightlyPriceMajor", `Цена за ночь (${draft.currency})`, { required: true, inputMode: "decimal", placeholder: "125.00", hint: "Можно использовать точку или запятую, например 125,00." })}</div>
                {renderTextField("depositMajor", `Депозит (${draft.currency})`, { inputMode: "decimal", placeholder: "100.00", hint: "Оставьте пустым, если депозита нет." })}
                <div className="sm:col-span-2 lg:col-span-3">{renderTextField("amenities", "Удобства", { hint: "Перечислите через запятую: Wi‑Fi, кухня, кондиционер." })}</div>
                <div className="sm:col-span-2 lg:col-span-3">{renderTextField("houseRules", "Правила проживания", { hint: "Перечислите через запятую: не курить, без вечеринок." })}</div>
              </div>
            </section>

            <section aria-labelledby="apartment-terms-heading" className="border-t border-border-subtle pt-8">
              <div className="mb-4">
                <h3 id="apartment-terms-heading" className="font-heading text-lg font-bold">4. Условия проживания</h3>
                <p className="mt-1 text-xs text-slate">Гость должен увидеть условия до отправки запроса.</p>
              </div>
              <div className="grid gap-4">
                {renderTextareaField("depositDisclosure", "Условия депозита", { rows: 3, hint: draft.depositMajor.trim() ? "Обязательно укажите, когда и при каких условиях депозит возвращается." : "Заполнять необязательно, если депозита нет." })}
                {renderTextareaField("cancellationDisclosure", "Условия отмены", { required: true, rows: 3, hint: "Для проверки нужно не менее 10 знаков. Опишите сроки и возможные удержания простыми словами." })}
              </div>
            </section>

            <section aria-labelledby="apartment-images-heading" className="border-t border-border-subtle pt-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 id="apartment-images-heading" className="font-heading text-lg font-bold">5. Фотографии и права</h3>
                  <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate">Для каждого фото укажите понятную подпись и правообладателя. На проверку можно отправить объект минимум с одной полностью заполненной фотографией.</p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => setImages((current) => [...current, createEditableImage()])} disabled={saveBusy || images.length >= 30}>
                  <ImagePlus className="h-4 w-4" aria-hidden />Добавить фото
                </Button>
              </div>
              <div className="mt-4 space-y-4">
                {images.map((image, imageNumber) => (
                  <article key={image.clientKey} className="rounded-2xl border border-border-subtle bg-surface-muted/35 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">Фотография {imageNumber + 1}</p>
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeImage(image.clientKey)} disabled={saveBusy} aria-label={`Удалить фотографию ${imageNumber + 1}`}>
                        <Trash2 className="h-4 w-4 text-red-600" aria-hidden />Удалить
                      </Button>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        {role === "admin" ? (
                          <CmsMediaPathField
                            value={image.mediaRef}
                            onChange={(value) => updateImage(image.clientKey, { mediaRef: value })}
                            label="Файл или ссылка *"
                            hint="Выберите готовый файл из медиатеки или вставьте ссылку."
                          />
                        ) : (
                          <FormField id={`apartment-image-${image.clientKey}-ref`} label="Файл или ссылка" required hint="Вставьте https://-ссылку или путь вида /media/....">
                            <Input id={`apartment-image-${image.clientKey}-ref`} value={image.mediaRef} onChange={(event) => updateImage(image.clientKey, { mediaRef: event.target.value })} placeholder="https://... или /media/..." disabled={saveBusy} />
                          </FormField>
                        )}
                      </div>
                      <FormField id={`apartment-image-${image.clientKey}-alt`} label="Что изображено" required hint="Короткая подпись для доступности и поиска.">
                        <Input id={`apartment-image-${image.clientKey}-alt`} value={image.altText} onChange={(event) => updateImage(image.clientKey, { altText: event.target.value })} placeholder="Гостиная с окном во двор" disabled={saveBusy} />
                      </FormField>
                      <FormField id={`apartment-image-${image.clientKey}-holder`} label="Правообладатель" required hint="Кто сделал фото или разрешил его использовать.">
                        <Input id={`apartment-image-${image.clientKey}-holder`} value={image.rightsHolder} onChange={(event) => updateImage(image.clientKey, { rightsHolder: event.target.value })} placeholder="Владелец объекта" disabled={saveBusy} />
                      </FormField>
                      <FormField id={`apartment-image-${image.clientKey}-license`} label="Основание использования" required>
                        <NativeSelect id={`apartment-image-${image.clientKey}-license`} value={image.licenseCode} onChange={(event) => updateImage(image.clientKey, { licenseCode: event.target.value })} disabled={saveBusy}>
                          {optionsWithCurrent(LICENSE_OPTIONS, image.licenseCode).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </NativeSelect>
                      </FormField>
                      <FormField id={`apartment-image-${image.clientKey}-source`} label="Ссылка на разрешение или источник" optional hint="Если есть, укажите полную https://-ссылку.">
                        <Input id={`apartment-image-${image.clientKey}-source`} type="url" value={image.rightsSourceUrl ?? ""} onChange={(event) => updateImage(image.clientKey, { rightsSourceUrl: event.target.value })} placeholder="https://..." disabled={saveBusy} />
                      </FormField>
                    </div>
                  </article>
                ))}
                {!images.length ? (
                  <EmptyState
                    icon={ImagePlus}
                    variant={role === "admin" ? "admin" : "cabinet"}
                    title="Фотографий пока нет"
                    description="Черновик можно сохранить без фото, но отправить его на проверку пока не получится."
                    action={{ label: "Добавить фотографию", onClick: () => setImages([createEditableImage()]) }}
                  />
                ) : null}
              </div>
            </section>

            <section aria-labelledby="apartment-readiness-heading" className="border-t border-border-subtle pt-8">
              <div className="rounded-2xl border border-border-subtle bg-surface-muted/35 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 id="apartment-readiness-heading" className="font-heading text-lg font-bold">Готовность к проверке</h3>
                    <p className="mt-1 text-xs text-slate">Черновик сохраняется и без полного набора. Эти пункты нужны перед публикацией.</p>
                  </div>
                  <span className="rounded-full bg-surface-elevated px-3 py-1 text-xs font-semibold">{readyCount} из {readiness.length}</span>
                </div>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {readiness.map((item) => (
                    <li key={item.label} className="flex items-start gap-2 text-sm">
                      {item.ready ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate/50" aria-hidden />}
                      <span className={item.ready ? "text-foreground" : "text-slate"}>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <div className="flex flex-wrap items-center gap-3 border-t border-border-subtle pt-6">
              <Button type="submit" loading={saveBusy} loadingLabel="Сохраняем…" disabled={Boolean(actionBusyId) || availabilityBusy}>
                <Save className="h-4 w-4" aria-hidden />
                Сохранить черновик
              </Button>
              {selected ? <Button type="button" variant="ghost" onClick={startNew} disabled={saveBusy || availabilityBusy || Boolean(actionBusyId)}><Undo2 className="h-4 w-4" aria-hidden />Закрыть без сохранения</Button> : null}
              <p className="basis-full text-xs text-slate">Сохранение не публикует объект и не меняет его статус.</p>
            </div>

            {role === "organizer" && selected ? (
              <section aria-labelledby="apartment-availability-heading" className="border-t border-border-subtle pt-8">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky/10 text-sky"><CalendarDays className="h-5 w-5" aria-hidden /></span>
                  <div>
                    <h3 id="apartment-availability-heading" className="font-heading text-lg font-bold">Когда объект недоступен</h3>
                    <p className="mt-1 text-xs text-slate">Добавьте занятые периоды в список, проверьте их и затем сохраните календарь.</p>
                  </div>
                </div>

                {availabilityLoading ? <InlineFeedback className="mt-4" variant="loading" title="Загружаем календарь" /> : null}
                {availabilityError ? <InlineFeedback className="mt-4" variant="error" title="Проверьте календарь" description={availabilityError} /> : null}

                {!availabilityLoading ? (
                  <div className="mt-4 space-y-4">
                    <div className="grid gap-3 rounded-2xl border border-border-subtle bg-surface-muted/35 p-4 sm:grid-cols-2">
                      <FormField id="apartment-block-start" label="Недоступно с" required>
                        <Input id="apartment-block-start" type="date" value={blockStart} onChange={(event) => setBlockStart(event.target.value)} disabled={availabilityBusy} />
                      </FormField>
                      <FormField id="apartment-block-end" label="Снова доступно с" required hint="Эта дата должна быть позже даты начала.">
                        <Input id="apartment-block-end" type="date" value={blockEnd} onChange={(event) => setBlockEnd(event.target.value)} disabled={availabilityBusy} />
                      </FormField>
                      <div className="sm:col-span-2">
                        <FormField id="apartment-block-note" label="Комментарий" optional hint="Виден владельцу и команде сайта.">
                          <Input id="apartment-block-note" value={blockNote} onChange={(event) => setBlockNote(event.target.value)} placeholder="Например, проживание владельца" disabled={availabilityBusy} />
                        </FormField>
                      </div>
                      <div className="sm:col-span-2"><Button type="button" variant="outline" onClick={addBlock} disabled={availabilityBusy}><Plus className="h-4 w-4" aria-hidden />Добавить период в список</Button></div>
                    </div>

                    {blocks.length ? (
                      <ul className="space-y-2">
                        {blocks.map((block) => (
                          <li key={block.clientKey} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle px-4 py-3">
                            <div>
                              <p className="text-sm font-semibold">{block.startDate} — {block.endDate}</p>
                              <p className="mt-0.5 text-xs text-slate">{block.note}</p>
                            </div>
                            <Button type="button" size="sm" variant="ghost" onClick={() => removeBlock(block.clientKey)} disabled={availabilityBusy} aria-label={`Удалить период с ${block.startDate} по ${block.endDate}`}><Trash2 className="h-4 w-4 text-red-600" aria-hidden />Удалить</Button>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="rounded-xl border border-dashed border-border-subtle p-4 text-sm text-slate">Закрытых периодов нет: объект считается доступным для запроса.</p>}

                    <div className="flex flex-wrap items-center gap-3">
                      <Button type="button" onClick={() => void saveBlocks()} loading={availabilityBusy} loadingLabel="Сохраняем…" disabled={!availabilityDirty || saveBusy || Boolean(actionBusyId)}>
                        <Save className="h-4 w-4" aria-hidden />Сохранить календарь
                      </Button>
                      <p className="text-xs text-slate">{availabilityDirty ? "Есть несохранённые изменения." : "Все изменения сохранены."}</p>
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
        </form>

        <aside className="space-y-4 xl:sticky xl:top-6" aria-labelledby="apartment-list-heading">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 id="apartment-list-heading" className="font-heading text-xl font-bold">Объекты</h2>
              <p className="mt-1 text-xs text-slate">{items.length ? `Всего: ${items.length}` : "Список пуст"}</p>
            </div>
          </div>
          {loading ? <InlineFeedback variant="loading" title="Загружаем объекты" /> : null}
          {!loading ? items.map((item) => {
            const itemBusy = actionBusyId === item.id;
            const itemReadiness = publishReadiness(toDraft(item), item.images.map((image) => ({ ...image, clientKey: image.mediaRef })));
            const itemReady = itemReadiness.every((entry) => entry.ready);
            return (
              <article key={item.id} className={cn(cabinetCardClass, selected?.id === item.id && "ring-2 ring-sky/25")}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-foreground">{item.title}</h3>
                      <p className="mt-1 text-xs text-slate">{item.locality} · {item.countryCode}</p>
                    </div>
                    <span className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                      item.status === "published" ? "bg-emerald-50 text-emerald-700" : item.status === "review" ? "bg-sky/10 text-sky" : "bg-surface-muted text-slate",
                    )}>{STATUS_LABELS[item.status]}</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">{minorToMoneyText(item.nightlyPriceMinor)} {item.currency} <span className="font-normal text-slate">за ночь</span></p>
                  {!itemReady && item.status === "draft" ? <p className="mt-2 text-xs text-amber-700">Сначала заполните обязательные пункты для проверки.</p> : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => edit(item)} disabled={saveBusy || availabilityBusy || Boolean(actionBusyId)}><Pencil className="h-4 w-4" aria-hidden />Открыть</Button>
                    {role === "organizer" && item.status === "draft" ? (
                      <Button type="button" size="sm" onClick={() => void action(item, "submit")} loading={itemBusy} loadingLabel="Отправляем…" disabled={!itemReady || saveBusy || availabilityBusy || Boolean(actionBusyId && !itemBusy)}><Send className="h-4 w-4" aria-hidden />На проверку</Button>
                    ) : null}
                    {role === "admin" && item.status === "review" ? (
                      <>
                        <Button type="button" size="sm" onClick={() => void action(item, "publish")} loading={itemBusy} loadingLabel="Публикуем…" disabled={saveBusy || availabilityBusy || Boolean(actionBusyId && !itemBusy)}><CheckCircle2 className="h-4 w-4" aria-hidden />Опубликовать</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => void action(item, "return_to_draft")} disabled={saveBusy || availabilityBusy || Boolean(actionBusyId)}><Undo2 className="h-4 w-4" aria-hidden />Вернуть</Button>
                      </>
                    ) : null}
                    {role === "admin" && item.status !== "archived" ? (
                      <Button type="button" size="sm" variant="ghost" onClick={() => void action(item, "archive")} disabled={saveBusy || availabilityBusy || Boolean(actionBusyId)}><Archive className="h-4 w-4 text-red-600" aria-hidden />В архив</Button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          }) : null}
          {!loading && !items.length && !loadError ? (
            <EmptyState
              icon={Building2}
              variant={role === "admin" ? "admin" : "cabinet"}
              title="Объектов пока нет"
              description="Создайте первый черновик — он не появится на сайте без проверки."
              action={{ label: "Создать объект", onClick: startNew }}
            />
          ) : null}
        </aside>
      </div>
    </main>
  );
}
