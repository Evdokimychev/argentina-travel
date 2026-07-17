import { tourCover } from "@/lib/seed-media";
import { getCatalogSlug } from "@/lib/tour-slug";
import { getOrganizerTourListings } from "@/lib/organizer-tour-store";
import type {
  WaitlistEntry,
  WaitlistStatus,
  WaitlistStatusActor,
  WaitlistStatusChange,
} from "@/types/waitlist";

function organizerTourId(tourSlug: string): string | undefined {
  const catalogSlug = getCatalogSlug({ slug: tourSlug, catalogSlug: tourSlug });
  return getOrganizerTourListings().find((item) => getCatalogSlug(item) === catalogSlug)?.id;
}

function statusChange(input: {
  id: string;
  from: WaitlistStatus | null;
  to: WaitlistStatus;
  changedAt: string;
  changedBy: WaitlistStatusActor;
  note?: string;
}): WaitlistStatusChange {
  return input;
}

/** Isolated local-demo provider, selected only by the build alias. */
export function getDemoWaitlistSeeds(): WaitlistEntry[] {
  const now = new Date().toISOString();
  const fiveDaysAgo = new Date(Date.now() - 5 * 86_400_000).toISOString();

  return [
    {
      id: "waitlist-demo-1",
      userId: "guest-demo@example.com",
      organizerTourId: organizerTourId("patagonia-glaciers"),
      tourId: "1",
      tourSlug: "patagonia-glaciers",
      tourTitle: "Ледники Патагонии: Перито-Морено и Torres del Paine",
      tourImage: tourCover("patagonia-glaciers"),
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
        statusChange({
          id: "waitlist-status-demo-1",
          from: null,
          to: "waiting",
          changedAt: fiveDaysAgo,
          changedBy: "system",
        }),
      ],
      organizerComments: [],
      createdAt: fiveDaysAgo,
      updatedAt: fiveDaysAgo,
    },
    {
      id: "waitlist-demo-2",
      userId: "guest-demo2@example.com",
      organizerTourId: organizerTourId("mendoza-wine"),
      tourId: "3",
      tourSlug: "mendoza-wine",
      tourTitle: "Винный тур в Мендосе",
      tourImage: tourCover("mendoza-wine"),
      tourDateId: "dt-default",
      startDate: "2025-11-01",
      endDate: "2025-11-07",
      guests: 4,
      contactName: "Игорь Смирнов",
      contactEmail: "guest-demo2@example.com",
      contactPhone: "+7 916 555-44-33",
      status: "contacted",
      statusHistory: [
        statusChange({
          id: "waitlist-status-demo-2",
          from: null,
          to: "waiting",
          changedAt: fiveDaysAgo,
          changedBy: "system",
        }),
        statusChange({
          id: "waitlist-status-demo-3",
          from: "waiting",
          to: "contacted",
          changedAt: now,
          changedBy: "organizer",
          note: "Написали в WhatsApp — ждём ответа",
        }),
      ],
      organizerComments: [
        {
          id: "waitlist-comment-demo-1",
          text: "Возможно освободится 1 место после отмены — держим в резерве.",
          authorName: "Организатор",
          createdAt: fiveDaysAgo,
        },
      ],
      createdAt: fiveDaysAgo,
      updatedAt: now,
    },
  ];
}
