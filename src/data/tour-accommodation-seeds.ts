import type { OrganizerTourAccommodationPlace } from "@/data/tour-accommodation-defaults";

export interface TourAccommodationSeed {
  /** Общее описание проживания по маршруту. */
  description?: string;
  /** Разрешить выбор типа номера при бронировании. */
  upgradesEnabled?: boolean;
  places: OrganizerTourAccommodationPlace[];
}

export const TOUR_ACCOMMODATION_SEEDS: Record<string, TourAccommodationSeed> = {
  "patagonia-glaciers": {
    description:
      "По маршруту — отель 4* в Эль-Калафате и lodge у Торрес-дель-Пaine. Стандартное размещение включено; одноместный номер и категория 5★ — за доплату.",
    upgradesEnabled: true,
    places: [
      {
        id: "acc-calafate",
        nights: 3,
        fullPeriod: false,
        name: "Отель Los Glaciares 4*",
        accommodationType: "Отель",
        displayMode: "manual",
        description:
          "<p>Современный отель в центре Эль-Калафате с видом на озеро Аргентино. Двухместные номера с собственной ванной, завтрак шведский стол.</p>",
        amenities: ["Wi-Fi", "Завтрак", "Кондиционер", "Сейф", "Прачечная"],
        images: [
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
          "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80",
        ],
        roomTypes: [
          {
            id: "room-twin",
            name: "Номер с двумя кроватями",
            description: "Две отдельные кровати — стандартное размещение по программе.",
            capacity: 2,
            priceUsdPerPerson: 0,
            images: [],
          },
          {
            id: "room-double",
            name: "Двухместный номер",
            description: "Одна двуспальная кровать — для пары.",
            capacity: 2,
            priceUsdPerPerson: 0,
            images: [],
          },
          {
            id: "room-single",
            name: "Одноместный номер",
            description: "Отдельный номер для одного гостя.",
            capacity: 1,
            priceUsdPerPerson: 180,
            images: [],
          },
          {
            id: "room-upgrade5",
            name: "Номер категории 5★",
            description: "Повышенная категория с видом на озеро.",
            capacity: 2,
            priceUsdPerPerson: 250,
            images: [],
          },
        ],
        alternatives: [],
      },
      {
        id: "acc-tdp-lodge",
        nights: 2,
        fullPeriod: false,
        name: "Lodge Torres del Paine",
        accommodationType: "Лодж",
        displayMode: "booking_link",
        bookingUrl: "https://www.booking.com/hotel/cl/torres-del-paine-lodge.html",
        bookingLabel: "Посмотреть на Booking.com",
        description:
          "<p>Уютный lodge у входа в парк. Точный номер и категорию можно посмотреть на Booking.com — бронирование там оформляется отдельно, мы поможем с трансфером.</p>",
        amenities: ["Wi-Fi", "Завтрак и ужин", "Отопление"],
        images: ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80"],
        roomTypes: [],
        alternatives: [
          {
            id: "acc-tdp-alt",
            name: "Refugio внутри парка",
            accommodationType: "Хостел",
            displayMode: "manual",
            description: "Бюджетный вариант — общие зоны, спальные мешки. Подходит для опытных треккеров.",
            images: [],
            bookingLabel: "Посмотреть на Booking.com",
          },
        ],
      },
    ],
  },
  "mendoza-wine": {
    description:
      "Проживание в бутик-отеле в винном регионе. Стандарт — двухместный номер; одноместный и люкс — за доплату.",
    upgradesEnabled: true,
    places: [
      {
        id: "acc-mendoza-boutique",
        nights: 4,
        fullPeriod: true,
        name: "Boutique Hotel Vines & Views",
        accommodationType: "Отель",
        displayMode: "manual",
        description:
          "<p>Отель среди виноградников с бассейном и дегустационным залом. Завтрак включён, вечером — свободное время в городе.</p>",
        amenities: ["Wi-Fi", "Завтрак", "Бассейн", "Парковка"],
        images: ["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80"],
        roomTypes: [
          {
            id: "room-mendoza-double",
            name: "Двухместный номер",
            description: "Стандартное размещение с видом на виноградники.",
            capacity: 2,
            priceUsdPerPerson: 0,
            images: [],
          },
          {
            id: "room-mendoza-single",
            name: "Одноместный номер",
            description: "Компактный номер для одного гостя.",
            capacity: 1,
            priceUsdPerPerson: 95,
            images: [],
          },
          {
            id: "room-mendoza-suite",
            name: "Люкс с террасой",
            description: "Просторный номер с частной террасой и видом на Андes.",
            capacity: 2,
            priceUsdPerPerson: 140,
            images: [],
          },
        ],
        alternatives: [],
      },
    ],
  },
};

export function getAccommodationSeedForSlug(slug: string): TourAccommodationSeed | undefined {
  return TOUR_ACCOMMODATION_SEEDS[slug];
}

export function mergeAccommodationSeedPlaces(
  slug: string,
  existingPlaces: OrganizerTourAccommodationPlace[]
): OrganizerTourAccommodationPlace[] {
  const seed = getAccommodationSeedForSlug(slug);
  if (seed?.places.length) return seed.places;
  return existingPlaces;
}
