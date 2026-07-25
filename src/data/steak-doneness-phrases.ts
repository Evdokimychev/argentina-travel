/**
 * Doneness phrasebook — all phrases must remain in initial HTML.
 */
export type SteakDonenessId =
  | "jugoso"
  | "entre"
  | "a-punto"
  | "tres-cuartos"
  | "bien-cocido";

export const STEAK_DONENESS_UI = {
  ariaLabel: "Словарь прожарки для заказа в parrilla",
  title: "Как сказать прожарку",
  hint: "Единого стандарта нет: дополняйте название описанием цвета центра. Красная жидкость внутри стейка — не «кровь».",
  copyLabel: "Скопировать",
  copiedLabel: "Скопировано",
} as const;

export const STEAK_DONENESS_ITEMS: Array<{
  id: SteakDonenessId;
  term: string;
  meaning: string;
  caveat: string;
  phrase: string;
  phraseRu: string;
}> = [
  {
    id: "jugoso",
    term: "Jugoso",
    meaning: "Сочный кусок с заметно розовым или красноватым центром.",
    caveat: "Толщина стейка и привычка кухни сильно влияют на результат.",
    phrase: "Lo quiero jugoso, por favor.",
    phraseRu: "Я хочу сочный стейк с розовым или красноватым центром.",
  },
  {
    id: "entre",
    term: "Entre jugoso y a punto",
    meaning: "Между сочным и средней прожаркой.",
    caveat: "Удобный компромисс, если не хотите крайностей.",
    phrase: "Entre jugoso y a punto, rosado en el centro.",
    phraseRu: "Между сочным и средней прожаркой, с розовым центром.",
  },
  {
    id: "a-punto",
    term: "A punto",
    meaning: "Средняя готовность, обычно с розовым центром.",
    caveat: "Трактовка различается: в одной parrilla будет розовее, в другой — ближе к полной прожарке.",
    phrase: "A punto, pero que quede rosado en el centro.",
    phraseRu: "Средней прожарки, но чтобы центр остался розовым.",
  },
  {
    id: "tres-cuartos",
    term: "A punto pasado / tres cuartos",
    meaning: "Почти полностью приготовлено, розового остаётся мало.",
    caveat: "Если боитесь сырого вида, но не хотите сухого мяса — уточните у официанта.",
    phrase: "A punto pasado, por favor.",
    phraseRu: "Почти полной прожарки, пожалуйста.",
  },
  {
    id: "bien-cocido",
    term: "Bien cocido",
    meaning: "Полностью приготовлено, без розового центра.",
    caveat: "Для детей и по медицинской рекомендации — предпочтительный вариант; особенно для рубленого мяса.",
    phrase: "Bien cocido, sin rosado.",
    phraseRu: "Полностью прожаренный, без розового внутри.",
  },
];
