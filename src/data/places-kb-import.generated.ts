// АВТОГЕНЕРАЦИЯ — места из базы знаний (Argentina.travel), без дублирования places-seed.
import type { PlaceDetail } from "@/types/place";
import { getPlaceCoverImage, getPlaceGallery } from "@/lib/media-resolver";

type KbImportPlace = Omit<PlaceDetail, "relatedPlaces" | "collections" | "itineraryReferences">;

function kbPlaceMedia(slug: string) {
  return { coverImage: getPlaceCoverImage(slug), gallery: getPlaceGallery(slug) };
}

export const PLACES_KB_IMPORT: KbImportPlace[] = [
  {
    id: "place-kb-parque-provincial-cordon-del-plata",
    slug: "parque-provincial-cordon-del-plata",
    name: "Провинциальный парк Кордон-дель-Плата",
    shortDescription: "Окунитесь в экстремальное приключение рядом с горным хребтом в аргентинских Андах.",
    fullDescription: "Окунитесь в экстремальное приключение рядом с горным хребтом в аргентинских Андах.\n\nПровинциальный парк Кордон-дель-Плата — одна из достопримечательностей региона Куйо (Мендоса). Материал подготовлен на основе официального портала INPROTUR (Argentina.travel) и адаптирован для пут",
    category: "national_park",
    region: "Куйо",
    province: "Мендоса",
    latitude: -32.99243896303327,
    longitude: -69.31615052597036,
    ...kbPlaceMedia("parque-provincial-cordon-del-plata"),
    tags: ["куйо"],
    source: "argentina-travel",
    popularity: 55,
    kbSlug: "parque-provincial-cordon-del-plata",
  },
  {
    id: "place-kb-resistencia",
    slug: "resistencia",
    name: "Ресистенсия",
    shortDescription: "Столица провинции Чако на реке Негро близ впадения Параны — «Национальная столица скульптур» Аргентины с сотнями работ под открытым небом, но в целом малотуристический административный центр.",
    fullDescription: "Столица провинции Чако на реке Негро близ впадения Параны — «Национальная столица скульптур» Аргентины с сотнями работ под открытым небом, но в целом малотуристический административный центр.\n\nРесистенсия — одна из достопримечательностей региона Северо-Восток (Чако). Материал под",
    category: "city",
    region: "Северо-Восток",
    province: "Чако",
    latitude: -27.4514,
    longitude: -58.9867,
    ...kbPlaceMedia("resistencia"),
    tags: ["столица","колониальная архитектура"],
    source: "argentina-travel",
    popularity: 40,
    kbSlug: "resistencia",
  },
];
