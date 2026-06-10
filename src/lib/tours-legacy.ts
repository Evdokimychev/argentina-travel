import { TourDetail, DifficultyLevel, ComfortLevel, AccommodationType } from "@/types";
import { tourDetailsMap } from "@/data/tour-details/patagonia";
import { baseTours } from "@/data/tours";
import { tourExtra, type TourExtra } from "@/data/tour-extra";
import { getTourRoutePoints } from "@/data/tour-routes";
import { getTourDescriptionExtra } from "@/data/tour-description-extra";
import { marketplaceTours } from "@/data/marketplace-tours";

function mapDifficulty(d: string): DifficultyLevel {
  const map: Record<string, DifficultyLevel> = {
    Лёгкий: "Лёгкая",
    Лёгкая: "Лёгкая",
    Средний: "Средняя",
    Средняя: "Средняя",
    Сложный: "Высокая",
    Сложная: "Высокая",
    Экспедиция: "Экстремальная",
  };
  return map[d] ?? "Умеренная";
}

function mapComfort(c: string): ComfortLevel {
  const map: Record<string, ComfortLevel> = {
    Простой: "Стандарт",
    Средний: "Комфорт",
    Высокий: "Премиум",
  };
  return map[c] ?? "Комфорт";
}

function parseGroupSize(size: string): { min: number; max: number } {
  const match = size.match(/(\d+)[–-](\d+)/);
  if (match) return { min: +match[1], max: +match[2] };
  return { min: 4, max: 12 };
}

function parseDuration(d: string): { days: number; nights: number } {
  const days = parseInt(d, 10) || 7;
  return { days, nights: Math.max(days - 1, 0) };
}

function resolveListingAccommodationType(slug: string, nights: number): AccommodationType {
  const listing = marketplaceTours.find((t) => t.slug === slug);
  if (listing) return listing.accommodationType;
  return nights === 0 ? "Без проживания" : "Отель";
}

function resolveDetailComfort(
  slug: string,
  nights: number,
  extraComfort: string
): ComfortLevel {
  const type = resolveListingAccommodationType(slug, nights);
  if (type === "Без проживания" || nights === 0) return "Без проживания";
  return mapComfort(extraComfort);
}

/** Build a TourDetail from catalog data when full detail is not yet in DB */
function buildTourDetailFromBase(
  base: (typeof baseTours)[number],
  extra: TourExtra
): TourDetail {
  const { min, max } = parseGroupSize(base.groupSize);
  const { days, nights } = parseDuration(base.duration);

  return {
    id: base.id,
    slug: base.slug,
    title: base.title,
    country: "Аргентина",
    region: base.region,
    durationDays: days,
    durationNights: nights,
    priceUsd: base.priceUsd,
    originalPriceUsd: extra.originalPriceUsd,
    rating: extra.rating,
    reviewCount: extra.reviewCount,
    gallery: base.gallery,
    image: base.image,
    shortDescription: base.shortDescription,
    difficulty: mapDifficulty(base.difficulty),
    comfort: resolveDetailComfort(base.slug, nights, extra.comfort),
    accommodationType: resolveListingAccommodationType(base.slug, nights),
    groupMin: min,
    groupMax: max,
    minimumAge: extra.minimumAge,
    startLocation: extra.startLocation,
    bookingMode: extra.bookingMode,
    requestDateFrom: extra.requestDateFrom,
    requestDateTo: extra.requestDateTo,
    bookingAdvantages: extra.bookingAdvantages,
    places: base.highlights.slice(0, 4).map((h, i) => ({
      id: `place-${i}`,
      title: h,
      description: base.shortDescription,
      image: base.gallery[i] ?? base.image,
    })),
    descriptionBlocks: [
      { type: "paragraph", content: base.description },
      {
        type: "list",
        content: "",
        items: base.highlights,
      },
    ],
    itinerary: Array.from({ length: Math.min(days, 5) }, (_, i) => ({
      id: `day-${i + 1}`,
      dayNumber: i + 1,
      title: `День ${i + 1}`,
      description: base.description.slice(0, 200) + "...",
      images: [base.gallery[i % base.gallery.length]],
      activities: base.highlights.slice(0, 2),
      meals: ["Завтрак", "Обед"],
      accommodation: "Отель по программе",
    })),
    organizerComment: {
      greeting: `Здравствуйте! Я ${extra.organizer.name}, ваш организатор этого путешествия.`,
      recommendations: [
        "Забронируйте тур заранее — места ограничены",
        "Оформите страховку перед поездкой",
      ],
      routeNotes: base.shortDescription,
    },
    organizer: {
      id: `org-${base.id}`,
      name: extra.organizer.name,
      role: extra.organizer.role,
      avatar: extra.organizer.avatar,
      rating: 4.8,
      tourCount: 12,
      travelerCount: 320,
      languages: ["Русский", "Испанский"],
      experienceYears: 8,
      phone: "+7 (495) 123-45-67",
      email: "info@argentina-travel.ru",
    },
    reviews: [
      {
        id: "r-default-1",
        author: "Путешественник",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
        rating: 5,
        date: "2025-03-01",
        tripDate: "2025-02-01",
        text: "Отличный тур, всё организовано на высшем уровне. Рекомендую!",
        photos: [],
        verifiedTrip: true,
      },
    ],
    accommodations: (() => {
      const type = resolveListingAccommodationType(base.slug, nights);
      if (type === "Без проживания" || nights === 0) return [];
      return [
        {
          id: "a-default",
          name: "Отель по программе",
          description: "Комфортабельное размещение согласно категории тура.",
          comfort: mapComfort(extra.comfort),
          amenities: ["Wi-Fi", "Завтрак"],
          images: [base.image],
        },
      ];
    })(),
    included: base.included,
    excluded: [
      "Международные авиабилеты",
      "Личные расходы",
      "Страховка",
    ],
    arrival: {
      airports: [extra.startLocation],
      flights: ["Рекомендуем прилетать за день до начала"],
      transfers: ["Трансфер из аэропорта включён"],
      meetingPoint: extra.startLocation,
    },
    importantInfo: [
      "Необходима медицинская страховка",
      "Уточняйте актуальные требования к въезду",
    ],
    faq: [
      {
        id: "f1",
        question: "Как забронировать тур?",
        answer: "Нажмите «Забронировать» или свяжитесь с нами через форму контактов.",
      },
    ],
    dates: (() => {
      const start = new Date("2025-11-01");
      const end = new Date(start);
      end.setDate(end.getDate() + days - 1);
      return [
        {
          id: "dt-default",
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10),
          spotsLeft: max,
          priceUsd: base.priceUsd,
        },
      ];
    })(),
    tags: extra.tags,
    featured: base.featured,
  };
}

/** Legacy detail resolver — used as seed/fallback outside the canonical repository. */
export function getLegacyTourDetail(slug: string): TourDetail | undefined {
  const full = tourDetailsMap[slug];
  const base = full ?? (() => {
    const b = baseTours.find((t) => t.slug === slug);
    const extra = tourExtra[slug];
    if (!b || !extra) return undefined;
    return buildTourDetailFromBase(b, extra);
  })();

  if (!base) return undefined;

  const routePoints = base.routePoints?.length
    ? base.routePoints
    : getTourRoutePoints(slug);

  const descriptionExtra = base.descriptionExtra ?? getTourDescriptionExtra(base);

  return {
    ...base,
    ...(routePoints.length ? { routePoints } : {}),
    descriptionExtra,
  };
}

export function getLegacySimilarTours(currentSlug: string, limit = 3): TourDetail[] {
  return baseTours
    .filter((t) => t.slug !== currentSlug)
    .slice(0, limit)
    .map((t) => getLegacyTourDetail(t.slug)!)
    .filter(Boolean);
}
