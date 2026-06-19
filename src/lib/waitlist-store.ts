import type { TourDetail } from "@/types";
import type { CheckoutFormState } from "@/components/tour-detail/checkout/types";
import { shouldSeedDemoData } from "@/lib/demo-mode";
import { getCatalogSlug } from "@/lib/tour-slug";
import { getOrganizerTourListings, getOrganizerTourOwnerId } from "@/lib/organizer-tour-store";
import { createBooking } from "@/lib/bookings-store";
import { getCanonicalTourBySlug } from "@/lib/tour-repository";
import { tourToDetail } from "@/lib/tour-mapper";
import { guestUserIdFromEmail } from "@/lib/guest-booking";
import type { SessionUser } from "@/types/user";
import type {
  WaitlistEntry,
  WaitlistOrganizerComment,
  WaitlistStatus,
  WaitlistStatusActor,
  WaitlistStatusChange,
  OrganizerWaitlistStats,
} from "@/types/waitlist";
import {
  WAITLIST_STORE_KEY,
  WAITLIST_UPDATED_EVENT,
} from "@/types/waitlist";
import { isActiveWaitlistStatus } from "@/data/waitlist-statuses";

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}`;
}

function notifyUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(WAITLIST_UPDATED_EVENT));
  }
}

function readAll(): WaitlistEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WAITLIST_STORE_KEY);
    if (!raw) return seedDemoWaitlist();
    const parsed = JSON.parse(raw) as WaitlistEntry[];
    if (!Array.isArray(parsed)) return seedDemoWaitlist();
    return parsed.map(normalizeWaitlistEntry);
  } catch {
    return seedDemoWaitlist();
  }
}

function writeAll(entries: WaitlistEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WAITLIST_STORE_KEY, JSON.stringify(entries));
  notifyUpdated();
}

function createStatusChange(input: {
  from: WaitlistStatus | null;
  to: WaitlistStatus;
  changedBy: WaitlistStatusActor;
  note?: string;
}): WaitlistStatusChange {
  return {
    id: createId("wl-status"),
    from: input.from,
    to: input.to,
    changedAt: new Date().toISOString(),
    changedBy: input.changedBy,
    note: input.note?.trim() || undefined,
  };
}

function normalizeComments(comments: WaitlistOrganizerComment[] | undefined): WaitlistOrganizerComment[] {
  if (!comments?.length) return [];
  return comments.map((item) => ({
    id: item.id || createId("wl-comment"),
    text: item.text,
    authorName: item.authorName,
    createdAt: item.createdAt || new Date().toISOString(),
  }));
}

function normalizeWaitlistEntry(entry: WaitlistEntry): WaitlistEntry {
  return {
    ...entry,
    organizerComments: normalizeComments(entry.organizerComments),
    statusHistory: entry.statusHistory?.length
      ? entry.statusHistory
      : [
          createStatusChange({
            from: null,
            to: entry.status ?? "waiting",
            changedBy: "system",
          }),
        ],
  };
}

function resolveOrganizerTourId(tourSlug: string): string | undefined {
  const catalogSlug = getCatalogSlug({ slug: tourSlug, catalogSlug: tourSlug });
  const listing = getOrganizerTourListings().find(
    (item) => getCatalogSlug(item) === catalogSlug
  );
  return listing?.id;
}

function seedDemoWaitlist(): WaitlistEntry[] {
  if (!shouldSeedDemoData()) return [];
  const now = new Date().toISOString();
  const weekAgo = new Date(Date.now() - 5 * 86400000).toISOString();

  const demo: WaitlistEntry[] = [
    {
      id: "waitlist-demo-1",
      userId: "guest-demo@example.com",
      organizerTourId: resolveOrganizerTourId("patagonia-glaciers"),
      tourId: "1",
      tourSlug: "patagonia-glaciers",
      tourTitle: "Ледники Патагонии: Перито-Морено и Torres del Paine",
      tourImage:
        "https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&q=80",
      tourDateId: "dt3",
      startDate: "2025-12-01",
      endDate: "2025-12-10",
      guests: 8,
      contactName: "Анна Петрова",
      contactEmail: "guest-demo@example.com",
      contactPhone: "+7 900 111-22-33",
      touristComment: "Готовы подождать до декабря, если наберётся группа.",
      status: "waiting",
      statusHistory: [
        createStatusChange({ from: null, to: "waiting", changedBy: "system" }),
      ],
      organizerComments: [],
      createdAt: weekAgo,
      updatedAt: weekAgo,
    },
    {
      id: "waitlist-demo-2",
      userId: "guest-demo2@example.com",
      organizerTourId: resolveOrganizerTourId("mendoza-wine"),
      tourId: "3",
      tourSlug: "mendoza-wine",
      tourTitle: "Винный тур в Мендосе",
      tourImage:
        "https://images.unsplash.com/photo-1506377247377-2ccd5a1b6b4a?w=800&q=80",
      tourDateId: "dt-default",
      startDate: "2025-11-01",
      endDate: "2025-11-07",
      guests: 4,
      contactName: "Игорь Смирнов",
      contactEmail: "guest-demo2@example.com",
      contactPhone: "+7 916 555-44-33",
      status: "contacted",
      statusHistory: [
        createStatusChange({ from: null, to: "waiting", changedBy: "system" }),
        createStatusChange({
          from: "waiting",
          to: "contacted",
          changedBy: "organizer",
          note: "Написали в WhatsApp — ждём ответа",
        }),
      ],
      organizerComments: [
        {
          id: "wl-comment-demo-1",
          text: "Возможно освободится 1 место после отмены — держим в резерве.",
          authorName: "Организатор",
          createdAt: weekAgo,
        },
      ],
      createdAt: weekAgo,
      updatedAt: now,
    },
  ];

  if (typeof window !== "undefined") {
    writeAll(demo);
  }
  return demo;
}

export function getAllWaitlistEntries(): WaitlistEntry[] {
  return readAll();
}

export function getWaitlistEntryById(id: string): WaitlistEntry | undefined {
  return readAll().find((entry) => entry.id === id);
}

export function getUserWaitlistEntries(userId: string): WaitlistEntry[] {
  return readAll()
    .filter((entry) => entry.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getOrganizerWaitlistEntries(catalogSlugs: string[]): WaitlistEntry[] {
  const slugSet = new Set(catalogSlugs);
  return readAll()
    .filter((entry) => slugSet.has(entry.tourSlug))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getOrganizerWaitlistStats(catalogSlugs: string[]): OrganizerWaitlistStats {
  const entries = getOrganizerWaitlistEntries(catalogSlugs);
  return {
    waitingCount: entries.filter((entry) => entry.status === "waiting").length,
    activeCount: entries.filter((entry) => isActiveWaitlistStatus(entry.status)).length,
    offeredCount: entries.filter((entry) => entry.status === "offered").length,
  };
}

export function createWaitlistEntry(input: {
  actor: SessionUser | null;
  userId?: string;
  tour: Pick<
    TourDetail,
    "id" | "slug" | "title" | "image" | "priceUsd" | "groupDiscount"
  >;
  guests: number;
  tourDateId?: string;
  startDate?: string;
  endDate?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  touristComment?: string;
  allowGuestRequest?: boolean;
}): WaitlistEntry | { error: string } {
  const contactEmail = input.contactEmail.trim();
  if (!contactEmail) {
    return { error: "Укажите email — мы сообщим, когда появится место." };
  }

  const userId =
    input.userId ??
    input.actor?.id ??
    (contactEmail ? guestUserIdFromEmail(contactEmail) : "");

  if (!userId) {
    return { error: "Укажите email для заявки в лист ожидания." };
  }

  const now = new Date().toISOString();
  const entry: WaitlistEntry = {
    id: createId("waitlist"),
    userId,
    organizerTourId: resolveOrganizerTourId(input.tour.slug),
    tourId: input.tour.id,
    tourSlug: input.tour.slug,
    tourTitle: input.tour.title,
    tourImage: input.tour.image,
    tourDateId: input.tourDateId,
    startDate: input.startDate,
    endDate: input.endDate,
    guests: input.guests,
    contactName: input.contactName.trim(),
    contactEmail,
    contactPhone: input.contactPhone.trim(),
    touristComment: input.touristComment?.trim() || undefined,
    status: "waiting",
    statusHistory: [createStatusChange({ from: null, to: "waiting", changedBy: "system" })],
    organizerComments: [],
    createdAt: now,
    updatedAt: now,
  };

  const all = readAll();
  writeAll([normalizeWaitlistEntry(entry), ...all]);
  return entry;
}

export function createWaitlistFromForm(input: {
  actor: SessionUser | null;
  userId?: string;
  tour: TourDetail;
  guests: number;
  tourDateId?: string;
  startDate?: string;
  endDate?: string;
  form: Pick<
    CheckoutFormState,
    "contactFirstName" | "contactLastName" | "contactEmail" | "contactPhone" | "comments"
  >;
}): WaitlistEntry | { error: string } {
  return createWaitlistEntry({
    actor: input.actor,
    userId: input.userId,
    tour: input.tour,
    guests: input.guests,
    tourDateId: input.tourDateId,
    startDate: input.startDate,
    endDate: input.endDate,
    contactName: [input.form.contactFirstName, input.form.contactLastName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" "),
    contactEmail: input.form.contactEmail,
    contactPhone: input.form.contactPhone,
    touristComment: input.form.comments,
    allowGuestRequest: !input.actor,
  });
}

export function updateWaitlistStatus(input: {
  waitlistId: string;
  status: WaitlistStatus;
  changedBy: WaitlistStatusActor;
  note?: string;
}): { entry: WaitlistEntry } | { error: string } {
  const all = readAll();
  const index = all.findIndex((entry) => entry.id === input.waitlistId);
  if (index === -1) return { error: "Заявка в листе ожидания не найдена" };

  const current = normalizeWaitlistEntry(all[index]);
  if (current.status === input.status) {
    return { entry: current };
  }

  const updated: WaitlistEntry = {
    ...current,
    status: input.status,
    statusHistory: [
      ...current.statusHistory,
      createStatusChange({
        from: current.status,
        to: input.status,
        changedBy: input.changedBy,
        note: input.note,
      }),
    ],
    updatedAt: new Date().toISOString(),
  };

  all[index] = updated;
  writeAll(all);
  return { entry: updated };
}

export function addWaitlistOrganizerComment(input: {
  waitlistId: string;
  text: string;
  authorName: string;
}): { entry: WaitlistEntry } | { error: string } {
  const text = input.text.trim();
  if (!text) return { error: "Введите комментарий" };

  const all = readAll();
  const index = all.findIndex((entry) => entry.id === input.waitlistId);
  if (index === -1) return { error: "Заявка в листе ожидания не найдена" };

  const current = normalizeWaitlistEntry(all[index]);
  const updated: WaitlistEntry = {
    ...current,
    organizerComments: [
      {
        id: createId("wl-comment"),
        text,
        authorName: input.authorName.trim() || "Организатор",
        createdAt: new Date().toISOString(),
      },
      ...current.organizerComments,
    ],
    updatedAt: new Date().toISOString(),
  };

  all[index] = updated;
  writeAll(all);
  return { entry: updated };
}

export function cancelWaitlistByTourist(
  waitlistId: string,
  actor: SessionUser | null
): { entry: WaitlistEntry } | { error: string } {
  const entry = getWaitlistEntryById(waitlistId);
  if (!entry) return { error: "Заявка не найдена" };
  if (actor && entry.userId !== actor.id) {
    return { error: "Нет доступа к этой заявке" };
  }
  if (!isActiveWaitlistStatus(entry.status)) {
    return { error: "Заявку уже нельзя отменить" };
  }
  return updateWaitlistStatus({
    waitlistId,
    status: "cancelled",
    changedBy: "tourist",
    note: "Отменено туристом",
  });
}

export function convertWaitlistToBooking(input: {
  waitlistId: string;
  actor: SessionUser | null;
  organizerName?: string;
}): { entry: WaitlistEntry; bookingId: string } | { error: string } {
  const entry = getWaitlistEntryById(input.waitlistId);
  if (!entry) return { error: "Заявка не найдена" };
  if (entry.status === "converted" && entry.convertedBookingId) {
    return { entry, bookingId: entry.convertedBookingId };
  }
  if (!isActiveWaitlistStatus(entry.status) && entry.status !== "offered") {
    return { error: "Заявку нельзя перевести в бронирование в текущем статусе" };
  }

  const tourOwnerUserId = entry.organizerTourId
    ? getOrganizerTourOwnerId(entry.organizerTourId)
    : undefined;
  if (input.actor?.id && tourOwnerUserId && input.actor.id !== tourOwnerUserId) {
    return { error: "Нет прав на оформление бронирования" };
  }

  const tour = getCanonicalTourBySlug(entry.tourSlug);
  const detail = tour ? tourToDetail(tour) : null;
  const selectedDate = detail?.dates.find((date) => date.id === entry.tourDateId);
  const basePriceUsd = selectedDate?.priceUsd ?? detail?.priceUsd ?? 0;
  const totalPriceUsd = basePriceUsd * entry.guests;

  const bookingResult = createBooking({
    actor: input.actor,
    userId: entry.userId,
    tour: {
      id: entry.tourId,
      slug: entry.tourSlug,
      title: entry.tourTitle,
      image: entry.tourImage,
    },
    guests: entry.guests,
    startDate: entry.startDate,
    endDate: entry.endDate,
    totalPriceUsd,
    contactName: entry.contactName,
    contactEmail: entry.contactEmail,
    contactPhone: entry.contactPhone,
    touristComment: entry.touristComment,
    status: "pending",
    organizerTourId: entry.organizerTourId,
    fillTravelersLater: true,
    allowGuestRequest: true,
  });

  if ("error" in bookingResult) return { error: bookingResult.error };

  const all = readAll();
  const index = all.findIndex((item) => item.id === entry.id);
  if (index === -1) return { error: "Заявка не найдена" };

  const updated: WaitlistEntry = {
    ...normalizeWaitlistEntry(all[index]),
    status: "converted",
    convertedBookingId: bookingResult.id,
    statusHistory: [
      ...all[index].statusHistory,
      createStatusChange({
        from: all[index].status,
        to: "converted",
        changedBy: "organizer",
        note: input.organizerName
          ? `Оформлено бронирование организатором (${input.organizerName})`
          : "Оформлено бронирование",
      }),
    ],
    updatedAt: new Date().toISOString(),
  };

  all[index] = updated;
  writeAll(all);
  return { entry: updated, bookingId: bookingResult.id };
}
