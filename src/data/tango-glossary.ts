/**
 * Tango glossary — Spanish term + Russian explanation.
 * Every definition must stay in the initial HTML (no JS required to read it).
 * `id` values are stable anchors so the article and TOC can deep-link a term.
 */
export type TangoGlossaryTerm = {
  id: string;
  term: string;
  short: string;
  description: string;
};

export const TANGO_GLOSSARY_UI = {
  ariaLabel: "Словарь основных слов танго и милонги",
  title: "Словарь: главные слова милонги",
  hint: "Испанский термин и короткое объяснение. Полные определения есть и в тексте статьи.",
} as const;

export const TANGO_GLOSSARY_TERMS: TangoGlossaryTerm[] = [
  {
    id: "glossary-abrazo",
    term: "Abrazo",
    short: "объятие пары",
    description:
      "Объятие или танцевальная рамка пары. Может быть более открытым или более близким и меняться во время танца. Комфортная дистанция согласуется, а не навязывается.",
  },
  {
    id: "glossary-pista",
    term: "Pista",
    short: "танцпол",
    description: "Танцпол — общая площадка, по которой движутся пары.",
  },
  {
    id: "glossary-ronda",
    term: "Ronda",
    short: "поток пар против часовой стрелки",
    description:
      "Общий поток пар, движущийся по площадке против часовой стрелки. На заполненном танцполе пары идут по условным дорожкам и сохраняют дистанцию.",
  },
  {
    id: "glossary-tanda",
    term: "Tanda",
    short: "блок из нескольких композиций",
    description:
      "Блок из нескольких композиций одного характера или оркестра. Обычно с одним партнёром танцуют всю танду — но это ориентир, а не обязанность терпеть дискомфорт.",
  },
  {
    id: "glossary-cortina",
    term: "Cortina",
    short: "музыкальная вставка между тандами",
    description:
      "Короткая музыкальная вставка между тандами. Пары расходятся, участники возвращаются к столам и начинается новый цикл приглашений. Обычно не предназначена для танца.",
  },
  {
    id: "glossary-mirada",
    term: "Mirada",
    short: "приглашающий взгляд",
    description:
      "Визуальный контакт, с которого может начаться приглашение на танец.",
  },
  {
    id: "glossary-cabeceo",
    term: "Cabeceo",
    short: "приглашение жестом головы",
    description:
      "Небольшой жест головой после установления визуального контакта. Позволяет пригласить на расстоянии, не вынуждая человека публично отказывать.",
  },
  {
    id: "glossary-practica",
    term: "Práctica",
    short: "формат для тренировки",
    description:
      "Формат свободнее милонги: можно останавливаться, повторять движение и задавать вопросы. Удобный промежуточный вариант после занятия.",
  },
  {
    id: "glossary-musicalizador",
    term: "Musicalizador / DJ",
    short: "ведущий музыки вечера",
    description:
      "Человек, который выстраивает последовательность танд и кортин в течение вечера.",
  },
];
