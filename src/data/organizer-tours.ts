import { getTourCoverImage } from "@/lib/media-resolver";
import type { OrganizerTourListing } from "@/types/organizer-tour";
import { DEFAULT_ORGANIZER_OWNER_ID } from "@/types/user";

const rawOrganizerTours = [
  {
    id: "org-iguazu",
    ownerUserId: DEFAULT_ORGANIZER_OWNER_ID,
    slug: "iguazu-falls",
    title: "Водопады Игуасу за 1 день: аргентинская и бразильская стороны",
    coverLabel: "IGUAZU",
    durationDays: 2,
    type: "tour" as const,
    status: "published" as const,
    archived: false,
    isPreliminaryProgram: true,
    partnerName: "Пора в Аргентину",
    partnerUrl: "/tours",
  },
  {
    id: "org-salta",
    ownerUserId: DEFAULT_ORGANIZER_OWNER_ID,
    slug: "salta-northwest",
    title: "Сальта и ХуХуй: горные деревни, виноградники и долина Калчакí",
    coverLabel: "SALTA",
    durationDays: 4,
    type: "tour" as const,
    status: "published" as const,
    archived: false,
    partnerName: "Пора в Аргентину",
    partnerUrl: "/tours",
  },
  {
    id: "org-mendoza",
    ownerUserId: DEFAULT_ORGANIZER_OWNER_ID,
    slug: "mendoza-wine",
    title: "Мендоса: винные маршруты, Аконкагуа и гастрономические ужины",
    coverLabel: "MENDOZA",
    durationDays: 3,
    type: "tour" as const,
    status: "published" as const,
    archived: false,
    isPreliminaryProgram: true,
    partnerName: "Пора в Аргентину",
    partnerUrl: "/tours",
  },
  {
    id: "org-buenosaires",
    ownerUserId: DEFAULT_ORGANIZER_OWNER_ID,
    slug: "buenos-aires-tango",
    title: "Буэнос-Айрес: San Telmo, La Boca, танго-шоу и авторская гастрономия",
    coverLabel: "BA",
    durationDays: 2,
    type: "tour" as const,
    status: "draft" as const,
    archived: false,
    partnerName: "Пора в Аргентину",
    partnerUrl: "/tours",
  },
  {
    id: "org-patagonia-archive",
    ownerUserId: DEFAULT_ORGANIZER_OWNER_ID,
    slug: "patagonia-glaciers",
    title: "Ледники Патагонии: Перито-Морено и национальный парк Лос-Гласьярес",
    coverLabel: "PATAGONIA",
    durationDays: 10,
    type: "tour" as const,
    status: "published" as const,
    archived: true,
    partnerName: "Пора в Аргентину",
    partnerUrl: "/tours",
  },
] satisfies Omit<OrganizerTourListing, "image">[];

/** Демо-список туров организатора — заменить на API */
export const ORGANIZER_TOUR_LISTINGS: OrganizerTourListing[] = rawOrganizerTours.map((tour) => ({
  ...tour,
  image: getTourCoverImage(tour.slug),
}));
