/**
 * UI + data for steak cut selector — locale-ready copy separated from logic.
 */
export type SteakCutPreference = "tender" | "rich" | "intense" | "bone" | "sharing";

export type SteakCutOption = {
  id: string;
  name: string;
  preferences: SteakCutPreference[];
  reason: string;
  orderPhrase: string;
};

export const STEAK_CUT_SELECTOR_UI = {
  ariaLabel: "Подбор отруба по вкусу",
  title: "Выберите, что важнее",
  hint: "Можно отметить несколько предпочтений. Все варианты остаются в тексте статьи ниже.",
  empty: "Отметьте хотя бы одно предпочтение — покажем подходящие отрубы.",
  resultTitle: "Вам могут подойти",
  orderLabel: "Фраза для заказа",
  preferences: [
    { id: "tender" as const, label: "Нежнее" },
    { id: "rich" as const, label: "Жирнее и насыщеннее" },
    { id: "intense" as const, label: "Яркий вкус" },
    { id: "bone" as const, label: "На кости" },
    { id: "sharing" as const, label: "Для общего стола" },
  ],
} as const;

export const STEAK_CUT_OPTIONS: SteakCutOption[] = [
  {
    id: "lomo",
    name: "Lomo",
    preferences: ["tender"],
    reason: "Самый нежный и один из самых постных ресторанных отрубов.",
    orderPhrase: "Quiero un lomo, por favor.",
  },
  {
    id: "bife-de-chorizo",
    name: "Bife de chorizo",
    preferences: ["tender", "intense"],
    reason: "Баланс вкуса и текстуры: классический выбор для первого ужина в parrilla.",
    orderPhrase: "Quiero un bife de chorizo, por favor.",
  },
  {
    id: "ojo-de-bife",
    name: "Ojo de bife",
    preferences: ["rich", "intense"],
    reason: "Больше мраморности и насыщенности — ближе к привычному ribeye.",
    orderPhrase: "Quiero un ojo de bife, por favor.",
  },
  {
    id: "entrana",
    name: "Entraña",
    preferences: ["intense"],
    reason: "Тонкий ароматный отруб с ярким мясным вкусом; важно не пересушить.",
    orderPhrase: "Quiero entraña, jugosa, por favor.",
  },
  {
    id: "vacio",
    name: "Vacío",
    preferences: ["sharing", "intense"],
    reason: "Крупный традиционный отруб — удобен для компании и долгой parrilla.",
    orderPhrase: "Queremos vacío para compartir. ¿Cuánto pesa?",
  },
  {
    id: "asado-de-tira",
    name: "Asado de tira",
    preferences: ["bone", "sharing", "rich"],
    reason: "Поперечно распиленные рёбра с костью, жиром и узнаваемым вкусом асадо.",
    orderPhrase: "Queremos asado de tira, por favor.",
  },
  {
    id: "colita",
    name: "Colita de cuadril",
    preferences: ["sharing", "tender"],
    reason: "Сравнительно постный крупный кусок для общего стола при правильной нарезке.",
    orderPhrase: "¿Me recomienda colita de cuadril para compartir?",
  },
];
