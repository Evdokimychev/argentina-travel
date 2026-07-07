/** Русские названия провинций — ключ ISO 3166-2 (AR-XX) или slug Natural Earth. */
export const PROVINCE_LABELS_RU: Record<string, { nameRu: string; macroRegionRu: string }> = {
  "AR-C": { nameRu: "Автономный город Буэнос-Айрес", macroRegionRu: "Пампа" },
  "AR-B": { nameRu: "Провинция Буэнос-Айрес", macroRegionRu: "Пампа" },
  "AR-S": { nameRu: "Провинция Санта-Фе", macroRegionRu: "Литорал" },
  "AR-E": { nameRu: "Провинция Энтре-Риос", macroRegionRu: "Литорал" },
  "AR-X": { nameRu: "Провинция Кордова", macroRegionRu: "Центр" },
  "AR-M": { nameRu: "Провинция Мендоса", macroRegionRu: "Куйо" },
  "AR-J": { nameRu: "Провинция Сан-Хуан", macroRegionRu: "Куйо" },
  "AR-D": { nameRu: "Провинция Сан-Луис", macroRegionRu: "Куйо" },
  "AR-A": { nameRu: "Провинция Сальта", macroRegionRu: "Северо-Запад" },
  "AR-Y": { nameRu: "Провинция Жужуй", macroRegionRu: "Северо-Запад" },
  "AR-T": { nameRu: "Провинция Тукуман", macroRegionRu: "Северо-Запад" },
  "AR-K": { nameRu: "Провинция Катамарка", macroRegionRu: "Северо-Запад" },
  "AR-F": { nameRu: "Провинция Ла-Риоха", macroRegionRu: "Северо-Запад" },
  "AR-G": { nameRu: "Провинция Саньяго-дель-Эстеро", macroRegionRu: "Северо-Запад" },
  "AR-N": { nameRu: "Провинция Мisiones", macroRegionRu: "Mesopotamia" },
  "AR-W": { nameRu: "Провинция Корrientes", macroRegionRu: "Mesopotamia" },
  "AR-H": { nameRu: "Провинция Чако", macroRegionRu: "Mesopotamia" },
  "AR-P": { nameRu: "Провинция Формоса", macroRegionRu: "Mesopotamia" },
  "AR-R": { nameRu: "Провинция Рио-Негро", macroRegionRu: "Патагония" },
  "AR-Q": { nameRu: "Провинция Неукен", macroRegionRu: "Патагония" },
  "AR-U": { nameRu: "Провинция Чубут", macroRegionRu: "Патагония" },
  "AR-Z": { nameRu: "Провинция Санта-Крус", macroRegionRu: "Патагония" },
  "AR-V": { nameRu: "Провинция Огненная Земля", macroRegionRu: "Патагония" },
  "AR-L": { nameRu: "Провинция Ла-Пампа", macroRegionRu: "Пампа" },
};

export function enrichProvinceProperties(properties: Record<string, unknown>): Record<string, unknown> {
  const iso = String(
    properties["ISO3166-2"] ?? properties.iso3166_2 ?? properties.iso_3166_2 ?? properties.postal ?? ""
  );
  const labels = PROVINCE_LABELS_RU[iso];
  const nameEn = String(properties.name ?? properties.gn_name ?? "");
  return {
    ...properties,
    nameRu: labels?.nameRu ?? nameEn,
    macroRegionRu: labels?.macroRegionRu ?? "",
    name: labels?.nameRu ?? nameEn,
  };
}
