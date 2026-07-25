/**
 * Tango phrasebook — Spanish phrase + Russian translation + context.
 * All phrases must remain in the initial HTML; the copy button is progressive
 * enhancement only (the text is fully readable without JavaScript).
 */
export type TangoPhraseGroupId =
  | "before"
  | "invite"
  | "roles"
  | "consent"
  | "watching";

export const TANGO_PHRASEBOOK_UI = {
  ariaLabel: "Фразы на испанском для первого вечера танго",
  title: "Фразы на испанском для первого вечера",
  hint: "Сохраните нужные фразы или покажите их на телефоне. Английский на милонге не гарантирован.",
  copyLabel: "Скопировать",
  copiedLabel: "Скопировано",
} as const;

export const TANGO_PHRASEBOOK_GROUP_LABELS: Record<TangoPhraseGroupId, string> = {
  before: "Перед вечером",
  invite: "Пригласить и отказаться",
  roles: "Роли и партнёр",
  consent: "Границы и согласие",
  watching: "Посмотреть и снимать",
};

export type TangoPhrase = {
  id: string;
  group: TangoPhraseGroupId;
  phrase: string;
  translation: string;
  context: string;
};

export const TANGO_PHRASEBOOK: TangoPhrase[] = [
  {
    id: "primera-vez",
    group: "before",
    phrase: "Es mi primera vez en una milonga. Soy principiante.",
    translation: "Я впервые на милонге. Я начинающий.",
    context: "Сообщить организатору или преподавателю об отсутствии опыта.",
  },
  {
    id: "clase-antes",
    group: "before",
    phrase: "¿Hay clase antes de la milonga? ¿A qué hora empieza?",
    translation: "Перед милонгой есть занятие? Во сколько начинается?",
    context: "Уточнить, есть ли вводный урок и когда он стартует.",
  },
  {
    id: "sin-pareja",
    group: "before",
    phrase: "¿Se puede venir sin pareja?",
    translation: "Можно прийти без партнёра?",
    context: "На занятия и милонги в Буэнос-Айресе часто приходят одному.",
  },
  {
    id: "bailamos",
    group: "invite",
    phrase: "¿Bailamos?",
    translation: "Потанцуем?",
    context: "Прямое словесное приглашение — уместно на уроке и неформальной милонге.",
  },
  {
    id: "esta-bien",
    group: "invite",
    phrase: "Está bien, gracias.",
    translation: "Хорошо, спасибо.",
    context: "Спокойный ответ при отказе — с обеих сторон.",
  },
  {
    id: "elegir-rol",
    group: "roles",
    phrase: "¿Se puede elegir el rol?",
    translation: "Можно выбрать роль?",
    context: "Роли ведущая/следующая не обязательно привязаны к полу.",
  },
  {
    id: "cambian-pareja",
    group: "roles",
    phrase: "¿Cambian de pareja durante la clase?",
    translation: "Во время занятия меняются партнёрами?",
    context: "Полезно узнать заранее, если для вас это важно.",
  },
  {
    id: "abrazo-abierto",
    group: "consent",
    phrase: "Prefiero un abrazo más abierto.",
    translation: "Я предпочитаю более открытое объятие.",
    context: "Любой участник может выбрать более открытую дистанцию.",
  },
  {
    id: "voy-a-descansar",
    group: "consent",
    phrase: "Gracias, prefiero descansar esta tanda.",
    translation: "Спасибо, я предпочту отдохнуть эту танду.",
    context: "Отказ или пауза не требуют объяснения.",
  },
  {
    id: "solamente-mirar",
    group: "watching",
    phrase: "¿Puedo ir solamente a mirar?",
    translation: "Можно прийти только посмотреть?",
    context: "Условия для наблюдателей отличаются от места к месту.",
  },
  {
    id: "sacar-fotos",
    group: "watching",
    phrase: "¿Se puede sacar fotos o grabar video?",
    translation: "Можно фотографировать или снимать видео?",
    context: "Спрашивайте до съёмки; не снимайте людей крупным планом без согласия.",
  },
];
