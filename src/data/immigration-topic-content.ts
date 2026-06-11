import type {
  ImmigrationHubCard,
  ImmigrationHubChecklistItem,
  ImmigrationHubStep,
  ImmigrationHistoryEvent,
  ImmigrationResidencyGround,
  ImmigrationWasNowItem,
} from "@/types/immigration-hub";
import type { GuidePillarFaqItem, GuidePillarTable } from "@/types/guide-pillar";
import type { TravelHubArticleLink } from "@/types/guide-travel-hub";

export type ImmigrationLifeInCountryContent = {
  intro: string;
  cards: ImmigrationHubCard[];
};

export type ImmigrationProcessContent = {
  intro: string;
  touristRules: string[];
  statusChangeNote: string;
  dnuTitle: string;
  dnuChanges: string[];
  dnuNote: string;
  radexSteps: ImmigrationHubStep[];
  radexPortalUrl: string;
  documentsIntro: string;
  documentsChecklist: ImmigrationHubChecklistItem[];
  apostilleNote: string;
  entryDocsHref: string;
  entryDocsLabel: string;
};

export type ImmigrationBirthContent = {
  intro: string;
  cards: ImmigrationHubCard[];
  steps: ImmigrationHubStep[];
  note: string;
};

export type ImmigrationCitizenshipContent = {
  intro: string;
  dnuWarning: string;
  cards: ImmigrationHubCard[];
  grounds: ImmigrationHubCard[];
  groundsNote: string;
  expeditedNote: string;
  documentsIntro: string;
  documentsChecklist: ImmigrationHubChecklistItem[];
  specialDocumentsNote: string;
  pathSteps: ImmigrationHubStep[];
  submissionIntro: string;
  submissionSteps: string[];
  submissionEmail: string;
  timelinesNote: string;
  note: string;
};

export type ImmigrationResidencyContent = {
  intro: string;
  dnuWarning: string;
  types: ImmigrationHubCard[];
  grounds: ImmigrationResidencyGround[];
  pmzhIntro: string;
  pmzhGrounds: ImmigrationResidencyGround[];
  overviewHref: string;
  overviewLabel: string;
  historyTitle: string;
  historyIntro: string;
  history: ImmigrationHistoryEvent[];
  comparisonTitle: string;
  comparison: GuidePillarTable;
  statusComparisonTitle: string;
  statusComparison: GuidePillarTable;
  roadmapTitle: string;
  roadmapIntro: string;
  roadmap: ImmigrationHubStep[];
  pathToCitizenshipTitle: string;
  pathToCitizenship: ImmigrationHubStep[];
  wasNowTitle: string;
  wasNowIntro: string;
  wasNow: ImmigrationWasNowItem[];
  documentsIntro: string;
  documentsChecklist: ImmigrationHubChecklistItem[];
  documentsNote: string;
  pmzhDocumentsIntro: string;
  pmzhDocumentsChecklist: ImmigrationHubChecklistItem[];
  renewalIntro: string;
  renewalSteps: ImmigrationHubStep[];
  renewalNotes: string[];
  absenceRulesIntro: string;
  absenceRules: GuidePillarTable;
  lossOfStatusIntro: string;
  lossOfStatus: string[];
  costsIntro: string;
  costs: ImmigrationHubChecklistItem[];
  costsNote: string;
  typicalMistakesTitle: string;
  typicalMistakes: string[];
  extendedFaq: GuidePillarFaqItem[];
  crossLinks: TravelHubArticleLink[];
  note: string;
};

export type ImmigrationOpportunitiesContent = {
  intro: string;
  highlights: ImmigrationHubCard[];
  alternatives: ImmigrationHubCard[];
  diyTitle: string;
  diyBody: string;
  proTitle: string;
  proBody: string;
  contactsHref: string;
  contactsLabel: string;
};

export type ImmigrationUsefulLinksContent = {
  intro: string;
  official: TravelHubArticleLink[];
  articles: TravelHubArticleLink[];
  related: TravelHubArticleLink[];
};

export const IMMIGRATION_LIFE_IN_COUNTRY: ImmigrationLifeInCountryContent = {
  intro:
    "Аргентина — одна из самых «европейских» стран Латинской Америки для долгого проживания: развитый Буэнос-Айрес, разнообразный климат от субтропиков до Патагонии, сильная медицина и активное русскоязычное сообщество.",
  cards: [
    {
      emoji: "🏙",
      title: "Буэнос-Айрес — мегаполис",
      body: "Парки, рестораны, культурная жизнь, больницы и школы. Palermo, Recoleta, Belgrano — популярные районы среди экспатов.",
      href: "/guide/gde-zhit",
      linkLabel: "Где жить",
    },
    {
      emoji: "🌡",
      title: "Климат на любой вкус",
      body: "Страна вытянута с севера на юг: тропики Misiones, умеренный BA, горы Анд и Patagonia. Можно выбрать «свой» микроклимат.",
      href: "/guide/pogoda-i-sezonnost",
      linkLabel: "Погода и сезоны",
    },
    {
      emoji: "🥩",
      title: "Продукты и кухня",
      body: "Мясо, вино, овощи и фрукты мирового уровня. Рынки и супermercados доступны в каждом крупном городе.",
      href: "/guide/kukhnya",
      linkLabel: "Кухня",
    },
    {
      emoji: "🏥",
      title: "Медицина",
      body: "Экстренная помощь в госпиталях бесплатна для всех. Частные клиники и prepaga — для планового обслуживания.",
    },
    {
      emoji: "🏡",
      title: "Жильё",
      body: "Аренда в USD или песо, от студий до таунхаусов. Для residencia часто нужен договор аренды или собственность.",
      href: "/guide/gde-zhit",
      linkLabel: "Жильё в справочнике",
    },
    {
      emoji: "🌐",
      title: "Сообщество",
      body: "Русско- и англоязычные чаты, коворкинги, школы. Проще адаптироваться, чем в ряде соседних стран Латинской Америки.",
      href: "/guide/yazyk",
      linkLabel: "Язык",
    },
  ],
};

export const IMMIGRATION_PROCESS: ImmigrationProcessContent = {
  intro:
    "Типичный сценарий: безвизовый въезд как турист → сбор документов → подача через RADEX → precaria → residencia temporaria. Не работайте на туристическом статусе.",
  touristRules: [
    "Загранпаспорт с запасом срока (обычно 6+ месяцев)",
    "Медстраховка на весь срок — требование Decreto 366/2025; на границе декларацию пока не всегда запрашивают, но полис лучше иметь",
    "Обратный или onward билет, подтверждение жилья",
    "Средства на поездку — могут запросить выписку или карту",
    "Чёткая цель визита: туризм, если ещё не подаёте на ВНЖ",
  ],
  statusChangeNote:
    "После въезда можно сменить статус: собрать пакет по выбранному основанию, записаться в RADEX и подать на residencia temporaria, не нарушая правил пребывания.",
  dnuTitle: "DNU 366/2025 — что изменилось",
  dnuChanges: [
    "Decreto 366/2025 закрепил требование медстраховки и декларации о цели визита; порядок проверки на границе уточняйте перед поездкой",
    "Более детальная проверка цели визита, билетов и подтверждения жилья",
    "Акцент на соблюдении миграционного режима — штампы, сроки, отсутствие «фиктивного» туризма",
    "Экстренная медпомощь оказывается всем; плановая для иностранцев без ВНЖ — по страховке или за счёт пациента",
  ],
  dnuNote: "Перед вылетом сверяйтесь с migraciones.gob.ar и консульством — правила могут дополняться.",
  radexSteps: [
    { step: 1, title: "Регистрация", body: "Аккаунт на tramites.migraciones.gob.ar, подтверждение email." },
    { step: 2, title: "Выбор типа заявления", titleEs: "trámite", body: "Тип residencia по основанию — форма и список документов подтянутся автоматически." },
    { step: 3, title: "Загрузка сканов", body: "PDF/JPG в требуемом качестве; несоответствие — частая причина отказа." },
    { step: 4, title: "Оплата пошлин", body: "Онлайн через VEP или банк — сохраните квитанции." },
    { step: 5, title: "Запись на приём", titleEs: "turno", body: "Слот в офисе Migraciones; при дефиците — мониторьте портал." },
    { step: 6, title: "Приём и временное разрешение", titleEs: "precaria", body: "Оригиналы документов; precaria действует до решения по делу." },
  ],
  radexPortalUrl: "https://tramites.migraciones.gob.ar",
  documentsIntro: "Базовый список документов для временного ВНЖ (residencia temporaria). Точный перечень зависит от основания.",
  documentsChecklist: [
    {
      emoji: "🛂",
      title: "Загранпаспорт",
      description: "Действующий, копии всех страниц с отметками.",
      required: true,
    },
    {
      emoji: "📋",
      title: "Справка о несудимости",
      description: "Из страны гражданства и стран проживания, с апостилем.",
      required: true,
    },
    {
      emoji: "💵",
      title: "Подтверждение дохода",
      description: "Для rentista / кочевника — выписки, контракты за 6–12 месяцев.",
      required: true,
    },
    {
      emoji: "🏥",
      title: "Медстраховка",
      description: "Покрытие в Аргентине — для въезда и пакета ВНЖ.",
      required: true,
    },
    {
      emoji: "📜",
      title: "Свидетельства",
      description: "О рождении, браке — апостиль и перевод на испанский.",
      required: false,
    },
    {
      emoji: "📸",
      title: "Фото и формы",
      description: "По требованиям RADEX на момент подачи.",
      required: true,
    },
  ],
  apostilleNote:
    "Документы из РФ и большинства стран СНГ легализуют через апостиль и certified translation. Закладывайте 2–8 недель до истечения туристического срока.",
  entryDocsHref: "/guide/kak-dobratsya#entry-docs",
  entryDocsLabel: "Документы на границе — в путеводителе",
};

export const IMMIGRATION_BIRTH: ImmigrationBirthContent = {
  intro:
    "Аргентина применяет jus soli: ребёнок, рождённый на её территории, получает гражданство независимо от гражданства родителей. Родители могут оформить residencia по основанию padre/madre de argentino.",
  cards: [
    {
      emoji: "🇦🇷",
      title: "Гражданство ребёнку",
      body: "Свидетельство о рождении в Argentina + DNI ребёнка через Renaper. Паспорт — по желанию, когда понадобится.",
    },
    {
      emoji: "👨‍👩‍👧",
      title: "ВНЖ для родителей",
      titleEs: "residencia · padre/madre de argentino",
      body: "Основание «родитель аргентинского ребёнка» — путь к temporaria и далее permanente без ожидания 3 лет по стандартному маршруту.",
    },
    {
      emoji: "🏥",
      title: "Роды в системе здравоохранения",
      body: "Государственные и частные клиники в BA, Córdoba, Mendoza. Экстrenная помощь бесплатна; плановые роды — в частных центрах.",
    },
    {
      emoji: "📄",
      title: "Документы после рождения",
      body: "Acta de nacimiento, регистрация в Registro Civil, затем Migraciones для родителей. Переводы и апостили — по ситуации.",
    },
  ],
  steps: [
    {
      step: 1,
      title: "Выбор клиники и подготовка",
      body: "Договор с частной или план в public hospital; страховка и prenatal care.",
      duration: "За 3–9 месяцев",
    },
    {
      step: 2,
      title: "Рождение и регистрация",
      body: "Свидетельство о рождении в Registro Civil — основа для гражданства ребёнка.",
      duration: "1–2 недели",
    },
    {
      step: 3,
      title: "DNI ребёнка",
      titleEs: "Documento Nacional de Identidad",
      body: "Запись в Renaper — нужен для дальнейших заявлений семьи.",
      duration: "2–6 недель",
    },
    {
      step: 4,
      title: "ВНЖ родителей",
      titleEs: "residencia · padre/madre de argentino",
      body: "Подача в Migraciones через RADEX.",
      duration: "1–6 месяцев",
    },
  ],
  note: "Решение о родах в другой стране — личное и медицинское. Сверяйте актуальные требования Migraciones и консультацию с врачом и abogado migratorio.",
};

export const IMMIGRATION_CITIZENSHIP: ImmigrationCitizenshipContent = {
  intro:
    "Гражданство (ciudadanía) по натурализации — через федеральный суд. При подходящем основании от подачи до паспорта часто проходит около 1–2 лет, но срок рассмотрения дела законом не ограничен. Нужны 2 года непрерывной резиденции и легальный статус на момент подачи.",
  dnuWarning:
    "Decreto 366/2025 существенно изменил правила иммиграции. Регламентирующие документы по гражданству могут уточняться — сверяйте актуальность на migraciones.gob.ar и pjn.gov.ar перед подачей.",
  cards: [
    {
      emoji: "📘",
      title: "Сильный паспорт",
      body: "Безвиз или упрощённый въезд примерно в 170 направлений — Шенген, Великобритания, Япония, большинство Латинской Америки. Список меняется, проверяйте перед поездкой.",
    },
    {
      emoji: "⏱",
      title: "2 года резиденции",
      body: "Непрерывное проживание в Аргентине и легальный статус на дату подачи. Для граждан стран вне Mercosur подать на гражданство можно раньше, чем дождаться ПМЖ (обычно 3 года temporaria).",
    },
    {
      emoji: "⚖️",
      title: "Федеральный суд",
      body: "Процедура натурализации проходит в федеральном суде (Poder Judicial). Решение принимает судья; ход дела отслеживается на сайте суда.",
    },
    {
      emoji: "🗳",
      title: "Права гражданина",
      body: "Голосование, работа без ограничений по миграционному статусу, полный доступ к соцсистеме. Двойное гражданство — по законам вашей страны происхождения.",
    },
  ],
  grounds: [
    {
      emoji: "🌎",
      title: "Натурализация",
      body: "Основной путь для иммигрантов: 2 года непрерывной резиденции и легальное пребывание на момент подачи. Три основания перечислены на сайте правительства Аргентины.",
    },
    {
      emoji: "💑",
      title: "Супруг(а) аргентинца",
      body: "Муж или жена гражданина/гражданки Аргентины по рождению — без срока ожидания резиденции.",
    },
    {
      emoji: "👶",
      title: "Родитель ребёнка-аргентинца",
      body: "Родители ребёнка, рождённого в Аргентине (jus soli), могут подать на гражданство без периода ожидания.",
    },
  ],
  groundsNote:
    "С 5 марта 2021 года отменён decreto 70/2017, который требовал 2 года официальной residencia перед подачей. Практика применения упрощённых правил может отличаться по судам — уточняйте у секретаря или abogado migratorio.",
  expeditedNote:
    "Требование о сроках ожидания не распространяется на супругов аргентинцев по рождению и родителей ребёнка-аргентинца — они могут претендовать на гражданство без периода ожидания.",
  documentsIntro:
    "Базовый пакет документов одинаков независимо от основания. Дополнительные бумаги зависят от вашего случая — суд может запросить публикацию в газете или специальные запросы в госорганы.",
  documentsChecklist: [
    {
      emoji: "🪪",
      title: "Удостоверение личности",
      description:
        "Загранпаспорт или DNI с ВНЖ/ПМЖ. Перевод у официального переводчика и заверение в коллегии переводчиков в Аргентине.",
      required: true,
    },
    {
      emoji: "📄",
      title: "Свидетельство о рождении",
      description: "С апостилем, переводом и заверением перевода в Аргентине.",
      required: true,
    },
    {
      emoji: "✏️",
      title: "Документы о смене фамилии",
      description: "Если фамилия в свидетельстве о рождении отличается от паспорта — с апостилем и переводом.",
    },
    {
      emoji: "🛡",
      title: "Справка о несудимости в Аргентине",
      description: "Выдаётся в специальном отделении полиции (Policía de la Ciudad / provincial).",
      required: true,
    },
    {
      emoji: "🛡",
      title: "Справка о несудимости из страны происхождения",
      description:
        "Легализация в стране выдачи, перевод и заверение в Аргентине. Справка из консульства РФ иногда принимается, но чаще суды требуют документ из России с апостилем.",
      required: true,
    },
    {
      emoji: "🏠",
      title: "Справка о месте жительства",
      titleEs: "certificado de domicilio",
      description: "Выдаётся в ближайшем отделении полиции.",
      required: true,
    },
    {
      emoji: "💰",
      title: "Справка о доходах",
      description:
        "Документ в свободной форме — как подтверждение источника средств к существованию. Форму уточняет секретарь суда.",
      required: true,
    },
  ],
  specialDocumentsNote:
    "Суд может назначить языковой экзамен или проверку знания конституции — практика различается; часть требований оспаривается как не предусмотренная законом. Для каждого из трёх оснований натурализации нужен свой дополнительный пакет — уточняйте у секретаря назначенного суда.",
  pathSteps: [
    {
      step: 1,
      title: "2 года непрерывной резиденции",
      body: "Легальное проживание в Аргентине. На момент подачи статус должен быть действующим.",
      duration: "2 года",
    },
    {
      step: 2,
      title: "Сбор и легализация документов",
      body: "Паспорт/DNI, свидетельство о рождении, справки о несудимости (AR + страна происхождения), domicilio, подтверждение доходов.",
      duration: "1–3 мес.",
    },
    {
      step: 3,
      title: "Электронная подача в суд",
      body: "С 1 декабря 2023 года — 100 % в электронном виде на CARTADECIUDADANIA@PJN.GOV.AR: два PDF-файла с документами и заполненным заявлением.",
      duration: "1–2 нед.",
    },
    {
      step: 4,
      title: "Рассмотрение дела судом",
      body: "Суд запрашивает данные в Interpol и полиции всех 24 субъектов федерации — это чаще всего замедляет процесс. Ход дела — на сайте назначенного суда.",
      duration: "6 мес — 3 года",
    },
    {
      step: 5,
      title: "Carta de Ciudadanía → DNI и паспорт",
      body: "После положительного решения — Carta de Ciudadanía, затем очередь в RENAPER на DNI гражданина и аргентинский pasaporte.",
      duration: "2–8 нед.",
    },
  ],
  submissionIntro:
    "С 2020 года запись на подачу ведётся через электронную почту суда. После отправки придёт ответ с уточнениями или назначением суда и секретаря для предъявления оригиналов.",
  submissionSteps: [
    "Написать на CARTADECIUDADANIA@PJN.GOV.AR и приложить два PDF-файла.",
    "PDF 1: фото паспорта или DNI; certificado de domicilio; свидетельство о рождении с апостилем и переводом; документы о смене фамилии (если есть); свидетельство о рождении супруга или ребёнка-аргентинца (если есть).",
    "PDF 2: заполненное заявление о гражданстве (форма суда).",
    "Дождаться назначения суда — принести оригиналы документов секретарю.",
    "Раз в неделю проверять статус дела на сайте суда — там же появятся приглашения на личные встречи.",
  ],
  submissionEmail: "CARTADECIUDADANIA@PJN.GOV.AR",
  timelinesNote:
    "Законом срок рассмотрения не ограничен. На практике — от 6 месяцев до 3 лет и дольше. Аргентина не принимает ранее судимых; проверка по всем провинциям занимает больше всего времени. При благоприятном стечении от подачи до паспорта укладываются в 1–2 года.",
  note: "Информация справочная, не юридическая консультация. Перед подачей — abogado migratorio и сверка с pjn.gov.ar / migraciones.gob.ar. Источник практики: обновление июнь 2025.",
};

export const IMMIGRATION_RESIDENCY: ImmigrationResidencyContent = {
  intro:
    "Временный вид на жительство (residencia temporaria, ВНЖ) — до 3 лет по одной из 15 подкategorий Ley 25.871 (ст. 23). Постоянный вид (residencia permanente, ПМЖ) — по arraigo после 2–3 лет temporaria, по семейным основаниям или иным категориям ст. 22. С мая 2025 года Decreto 366/2025 ужесточил проверки, изменил precaria и правила отсутствия за границей.",
  dnuWarning:
    "Decreto 366/2025 (29 мая 2025) существенно изменил Ley 25.871 и Ley 346. Часть регламентов и сумм дохода ещё уточняется — перед подачей сверяйтесь с migraciones.gob.ar и boletín oficial.",
  types: [
    {
      emoji: "✈",
      title: "Транзитное пребывание",
      titleEs: "residencia transitoria · turista",
      body: "Штамп до 90 дней (turista). Без права на работу. Цифровой кочевник — отдельная transitoria до 180 дней (Disposición 758/2022), не путать с ВНЖ.",
      href: "/immigration/vizy-dlya-turistov",
      linkLabel: "Визы для туристов",
    },
    {
      emoji: "📄",
      title: "Временный вид на жительство (ВНЖ)",
      titleEs: "residencia temporaria",
      body: "До 3 лет по основанию: DNI, банки, аренда, работа — если категория это разрешает. Продлевается (prórroga) при сохранении основания.",
      href: "/immigration/obzor-vnzh",
      linkLabel: "Обзор оснований",
    },
    {
      emoji: "🏡",
      title: "Постоянный вид на жительство (ПМЖ)",
      titleEs: "residencia permanente",
      body: "Без ежегодного продления по тому же пункту. Нужны средства к существованию и отсутствие оснований для отказа — даже при семейных связях.",
      href: "/immigration/vnzh-i-pmzh#pmzh-grounds",
      linkLabel: "Основания ПМЖ",
    },
    {
      emoji: "⏳",
      title: "Прекария",
      titleEs: "residencia precaria",
      body: "До 90 дней, продлевается решением DNM. Даёт легальное пребывание, въезд/выезд, работу и учёбу — но не засчитывается в срок arraigo для ПМЖ и гражданства.",
    },
  ],
  grounds: [
    { num: "a", titleRu: "Наёмный работник", titleEs: "trabajador migrante", summary: "Контракт с аргентинским работодателем", duration: "До 3 лет" },
    { num: "b", titleRu: "Рантье", titleEs: "rentista", summary: "Пассивный доход из-за рубежа", duration: "До 3 лет" },
    { num: "c", titleRu: "Пенсионер", titleEs: "pensionado / jubilado", summary: "Пенсия из другой страны", duration: "До 3 лет" },
    { num: "d", titleRu: "Инвестор", titleEs: "inversor", summary: "Инвестиции в аргентинскую экономику", duration: "До 3 лет" },
    { num: "e", titleRu: "Учёный / специалист", titleEs: "científico / personal especializado", summary: "Исследования, трансферт специалистов компаний", duration: "До 3 лет" },
    { num: "f", titleRu: "Спортсмен / артист", titleEs: "deportista / artista", summary: "Контракт с аргентинским заказчиком", duration: "До 3 лет" },
    { num: "g", titleRu: "Религиозная миссия", titleEs: "religioso", summary: "Признанная религиозная организация", duration: "До 3 лет" },
    { num: "h", titleRu: "Лечение", titleEs: "paciente bajo tratamiento médico", summary: "Медицинское лечение в AR; семья — при необходимости", duration: "До 1 года" },
    { num: "i", titleRu: "Академический обмен", titleEs: "académico", summary: "Соглашение между вузами", duration: "До 1 года" },
    { num: "j", titleRu: "Студент", titleEs: "estudiante", summary: "Признанное учебное заведение", duration: "До 2 лет" },
    { num: "k", titleRu: "Беженец / убежище", titleEs: "refugiado / asilado", summary: "Международная защита", duration: "До 2 лет" },
    { num: "l", titleRu: "Гражданин Mercosur", titleEs: "nacionalidad · MERCOSUR", summary: "Граждане Mercosur, Чили и Боливии", duration: "До 2 лет" },
    { num: "m", titleRu: "Гуманитарные причины", titleEs: "razones humanitarias", summary: "Особые случаи по решению DNM", duration: "По делу" },
    { num: "n", titleRu: "Особые основания", titleEs: "especiales", summary: "Интерес страны — решение министерств", duration: "По делу" },
    {
      num: "ñ",
      titleRu: "Воссоединение семьи",
      titleEs: "reunificación familiar",
      summary: "Супруг/родитель/ребёнок гражданина AR или резидента (с 366/2025)",
      duration: "До 3 лет",
    },
  ],
  pmzhIntro:
    "ПМЖ оформляют через RADEX как смену категории (cambio de categoría). После Decreto 366/2025 заявитель обязан доказать средства к существованию и отсутствие оснований для отказа — автоматического ПМЖ «по факту» родства или учёбы больше нет.",
  pmzhGrounds: [
    { num: "1", titleRu: "Arraigo — после temporaria", titleEs: "cambio por arraigo", summary: "2 года temporaria для Mercosur/Chile/Bolivia; 3 года — для остальных. Нужно ≥50% времени в стране и отсутствие >6 мес. подряд за границей", duration: "По arraigo" },
    { num: "2", titleRu: "Супруг(а) гражданина AR", titleEs: "cónyuge de argentino", summary: "Реальная семья, доход, domicilio — проверка DNM", duration: "Без ожидания arraigo" },
    { num: "3", titleRu: "Родитель ребёнка-аргентинца", titleEs: "progenitor de argentino", summary: "Ребёнок рождён в AR (jus soli); часто сначала reunificación familiar → temporaria", duration: "Ускоренный путь" },
    { num: "4", titleRu: "Ребёнок гражданина / резидента AR", titleEs: "hijo de argentino o residente", summary: "Несовершеннолетний или с особенностями развития", duration: "По делу" },
    { num: "5", titleRu: "Ребёнок аргентинца, рождённый за рубежом", titleEs: "hijo de argentino nacido en el exterior", summary: "Признаётся residente permanente по ст. 22", duration: "Сразу ПМЖ" },
    { num: "6", titleRu: "Сотрудник миссии / международной организации", titleEs: "funcionario de misión internacional", summary: "После 3+ лет в статусе, предусмотренном законом", duration: "3+ года" },
    { num: "7", titleRu: "Беженец — особые случаи", titleEs: "refugiado", summary: "Брак, рождение ребёнка или 3+ года temporaria в AR", duration: "По основанию" },
  ],
  overviewHref: "/immigration/obzor-vnzh",
  overviewLabel: "Подробный обзор видов ВНЖ",
  historyTitle: "Как менялась миграционная политика Аргентины",
  historyIntro:
    "Аргентина традиционно привлекала иммигрантов открытой политикой, но правила периодически ужесточались и смягчались. Ниже — ключевые вехи для понимания текущего режима.",
  history: [
    {
      period: "1853–1940-е",
      title: "Волны европейской иммиграции",
      body: "Конституция и последующие законы закрепили открытость страны. Массовый приток из Италии, Испании и других стран сформировал современное общество.",
    },
    {
      period: "2004",
      title: "Ley 25.871 — современная рамка",
      body: "Принят основной закон о миграции: категории permanentes, temporarios и transitorios, 14+ оснований temporaria, принцип reunificación familiar.",
    },
    {
      period: "2017–2021",
      title: "Decreto 70/2017 и его отмена",
      body: "Попытка ужесточить доступ к гражданству через требование 2 лет официальной residencia. Decreto отменён 5 марта 2021 года — суды снова принимали заявления по Ley 346.",
    },
    {
      period: "2019",
      title: "RADEX — онлайн-подача",
      body: "Первичная подача на residencia переведена на tramites.migraciones.gob.ar: анкета, оплата, загрузка сканов, turno на приём.",
    },
    {
      period: "2022",
      title: "Nómada digital (Disposición 758/2022)",
      body: "Введена transitoria до 180 дней для удалённых работников из безвизовых стран — не заменяет temporaria и не ведёт к ПМЖ автоматически.",
    },
    {
      period: "Май 2025",
      title: "Decreto 366/2025 — реформа Milei",
      body: "Ужесточены въезд, precaria, отсутствие за границей, требования к ПМЖ; гражданство — через DNM, 2 года без выездов; отменён автоматический ПМЖ для родственников граждан AR в прежней формулировке ст. 22.",
    },
  ],
  comparisonTitle: "Temporaria и permanente — в чём разница",
  comparison: {
    headers: ["Критерий", "ВНЖ (temporaria)", "ПМЖ (permanente)"],
    rows: [
      ["Срок", "До 3 лет (зависит от основания)", "Бессрочно при соблюдении условий"],
      ["Продление", "Prórroga по тому же или новому основанию", "Не требует ежегодного продления по пункту"],
      ["DNI", "Выдаёт Renaper после одобрения", "DNI резидента permanente"],
      ["Работа", "По категории (rentista — без local employment)", "Без миграционных ограничений по статусу"],
      ["Путь к ПМЖ", "Arraigo 2–3 года temporaria", "—"],
      ["Отсутствие за границей", "Отмена при ≥6 мес. подряд (ст. 62)", "Отмена при ≥1 года (ст. 62)"],
      ["Гражданство", "2 года непрерывно без выезда (Ley 346, после 366/2025)", "Тот же критерий"],
    ],
  },
  statusComparisonTitle: "Precaria, transitoria и temporaria",
  statusComparison: {
    headers: ["Статус", "Срок", "Засчитывается в arraigo", "Типичное применение"],
    rows: [
      ["Turista / transitoria", "До 90 дней (кочевник — до 180+180)", "Нет", "Туризм, nómada digital"],
      ["Precaria", "До 90 дней, продлевается DNM", "Нет (с 366/2025)", "Ожидание решения по заявлению"],
      ["Temporaria (ВНЖ)", "1–3 года по основанию", "Да", "Долгая легализация"],
      ["Permanente (ПМЖ)", "Бессрочно", "—", "Постоянное проживание"],
    ],
  },
  roadmapTitle: "Дорожная карта: от въезда до ПМЖ",
  roadmapIntro:
    "Типичный маршрут для граждан РФ и большинства стран вне Mercosur. Сроки ориентировочные — зависят от основания, очереди RADEX и полноты пакета.",
  roadmap: [
    {
      step: 1,
      title: "Легальный въезд",
      titleEs: "ingreso regular",
      body: "Туристический штамп или transitoria. Медстраховка и обратный билет — по Decreto 366/2025. Не работать на туристическом статусе.",
      duration: "0–90 дней",
    },
    {
      step: 2,
      title: "Сбор документов",
      body: "Апостиль справки о несудимости и свидетельства о рождении; перевод у traductor público в AR; certificado de domicilio; пакет по основанию.",
      duration: "2–8 нед.",
    },
    {
      step: 3,
      title: "Подача в RADEX",
      titleEs: "trámite en línea",
      body: "Регистрация, выбор категории, оплата tasa, загрузка сканов, запись turno. После подачи — precaria на срок до 90 дней.",
      duration: "1–4 нед.",
    },
    {
      step: 4,
      title: "Приём и решение",
      titleEs: "turno · precaria",
      body: "Оригиналы на приёме. Решение — от нескольких недель до месяцев. DNI — доставка Renaper после одобрения.",
      duration: "1–6 мес.",
    },
    {
      step: 5,
      title: "Продление temporaria",
      titleEs: "prórroga",
      body: "За 2–3 месяца до истечения DNI — prórroga по тому же или новому основанию. Новая справка из РФ — если были в России.",
      duration: "Ежегодно / до 3 лет",
    },
    {
      step: 6,
      title: "ПМЖ по arraigo",
      titleEs: "cambio a permanente",
      body: "После 3 лет temporaria (2 — для Mercosur): ≥50% времени в AR, не более 6 мес. подряд за границей, подтверждение дохода.",
      duration: "3+ года в AR",
    },
  ],
  pathToCitizenshipTitle: "От ВНЖ к гражданству",
  pathToCitizenship: [
    {
      step: 1,
      title: "Legальная temporaria или permanente",
      body: "Precaria и turista не засчитываются. Нужен одобренный DNI резидента.",
      duration: "От 0",
    },
    {
      step: 2,
      title: "2 года без выезда",
      body: "Decreto 366/2025: любой выезд обнуляет срок для натурализации. Ранее практиковались послабления до 30 дней — сейчас в законе их нет.",
      duration: "2 года",
    },
    {
      step: 3,
      title: "Подача в DNM",
      titleEs: "naturalización · DNM",
      body: "С мая 2025 — административная процедура в Migraciones, не федеральный суд (для новых дел). Дела до 29.05.2025 — по старым правилам через суд.",
      duration: "По регламенту",
    },
    {
      step: 4,
      title: "Carta de ciudadanía → DNI и pasaporte",
      body: "После одобрения — DNI гражданина и аргентинский паспорт через Renaper.",
      duration: "2–8 нед.",
    },
  ],
  wasNowTitle: "Было / стало после Decreto 366/2025",
  wasNowIntro:
    "Реформа не отменила основные категории residencia, но изменила практику. Сравните ключевые пункты — не опирайтесь на статьи до мая 2025 без проверки.",
  wasNow: [
    {
      topic: "Precaria",
      before: "Временный документ на период рассмотрения; часто давал свободный въезд/выезд и засчитывался в стаж.",
      after: "Residencia precaria до 90 дней, продлевается DNM. Не засчитывается в arraigo и срок гражданства (ст. 20 Ley 25.871).",
    },
    {
      topic: "ПМЖ для родственников граждан AR",
      before: "Супруги, родители и дети граждан AR автоматически считались residentes permanentes (ст. 22 старая редакция).",
      after: "Нужна подача с доказательством дохода и отсутствия судимостей; семейные связи — через reunificación familiar (temporaria) и далее cambio de categoría.",
    },
    {
      topic: "Отсутствие за границей (ПМЖ)",
      before: "Распространённая практика — потеря статуса после 2 лет вне страны.",
      after: "Ст. 62: отмена permanente при ≥1 годе вне AR; temporaria — при ≥6 месяцах подряд (с исключениями).",
    },
    {
      topic: "Гражданство",
      before: "Федеральный суд, допускались краткие выезды, присяга у судьи.",
      after: "DNM рассматривает naturalización; 2 года строго без выезда; присяга отменена для новых дел.",
    },
    {
      topic: "Въезд",
      before: "Медстраховка рекомендовалась, проверка на границе выборочная.",
      after: "Обязательная декларация цели визита и seguro de salud в законе (ст. 34); контроль усиливается.",
    },
    {
      topic: "Порог rentista",
      before: "Фиксировался подзаконными актами (суммы в pesos менялись).",
      after: "Регламент по суммам дохода на момент подачи 366/2025 может уточняться — проверяйте RADEX.",
    },
  ],
  documentsIntro:
    "Общий пакет для первичной temporaria через RADEX. Специальные документы — по основанию (контракт, выписки rentista, справка из вуза и т.д.).",
  documentsChecklist: [
    {
      emoji: "🛂",
      title: "Загранпаспорт",
      description: "Действующий, все страницы с отметками. Перевод traductor público + legalización в коллегии.",
      required: true,
    },
    {
      emoji: "📋",
      title: "Справка о несудимости",
      description: "Из страны гражданства; для РФ — не ранее 90 дней до отъезда, с апостилем. Перевод в AR.",
      required: true,
    },
    {
      emoji: "📜",
      title: "Свидетельство о рождении",
      description: "С апостилем и переводом — для большинства оснований.",
      required: true,
    },
    {
      emoji: "🏠",
      title: "Место жительства",
      titleEs: "certificado de domicilio",
      description: "Comisaría или счёт на имя заявителя (газ, вода, интернет).",
      required: true,
    },
    {
      emoji: "🛡",
      title: "Antecedentes penales AR",
      description: "Registro Nacional de Reincidencia — часто запрашивается при prórroga; для первичной подачи DNM может запросить на turno.",
      required: false,
    },
    {
      emoji: "💵",
      title: "Подтверждение дохода / основания",
      description: "Rentista — выписки 6–12 мес.; trabajo — contrato; estudiante — matrícula.",
      required: true,
    },
    {
      emoji: "🏥",
      title: "Медстраховка",
      description: "Покрытие в Аргентине — для въезда и пакета residencia.",
      required: true,
    },
    {
      emoji: "💳",
      title: "Оплата tasa migratoria",
      description: "Через RADEX (VEP). Суммы меняются — актуальные тарифы на tramites.migraciones.gob.ar.",
      required: true,
    },
  ],
  documentsNote:
    "Перевод делают в Аргентине у traductor público nacional, затем legalización в Colegio de Traductores. Апостиль ставят в стране выдачи документа до отъезда. На turno предъявляют оригиналы.",
  pmzhDocumentsIntro: "Дополнительно к общему пакету — для cambio de categoría a permanente:",
  pmzhDocumentsChecklist: [
    {
      emoji: "📄",
      title: "Действующий DNI temporario",
      description: "И history migratorio — выписка из RADEX.",
      required: true,
    },
    {
      emoji: "💰",
      title: "Medios de subsistencia",
      description: "Подтверждение дохода или сбережений по критериям DNM на дату подачи.",
      required: true,
    },
    {
      emoji: "🛡",
      title: "Antecedentes — AR и страны проживания",
      description: "За последние 3 года — если провели в стране >1 года.",
      required: true,
    },
    {
      emoji: "👶",
      title: "Семейные документы",
      description: "Acta de nacimiento ребёнка-аргентинца, acta de matrimonio — по основанию.",
      required: false,
    },
    {
      emoji: "📊",
      title: "Acreditación de arraigo",
      description: "≥50% срока temporaria в AR; отсутствие >6 мес. подряд за границей.",
      required: true,
    },
  ],
  renewalIntro:
    "DNI temporario обычно выдают на 1 год. Prórroga — до истечения срока, через RADEX, с тем же или новым основанием.",
  renewalSteps: [
    {
      step: 1,
      title: "За 2–3 месяца до истечения",
      body: "Проверьте дату на DNI и в RADEX. Не дожидайтесь просрочки — это основание для отказа и штрафов.",
      duration: "−90 дней",
    },
    {
      step: 2,
      title: "Обновление пакета",
      body: "Domiciilio, доход, antecedentes AR. Новая справка из РФ — если выезжали в страну гражданства.",
      duration: "1–3 нед.",
    },
    {
      step: 3,
      title: "Prórroga в RADEX",
      titleEs: "prórroga de residencia temporaria",
      body: "Загрузка документов, оплата, turno. Можно сменить основание (например, с estudiante на rentista).",
      duration: "1–4 нед.",
    },
    {
      step: 4,
      title: "Новый DNI",
      body: "После одобрения prórroga — обновление DNI в Renaper.",
      duration: "2–6 нед.",
    },
  ],
  renewalNotes: [
    "После 3 лет непрерывной temporaria (2 — Mercosur) можно подать на permanente по arraigo, не дожидаясь очередного продления.",
    "Precaria при prórroga не заменяет полноценную temporaria — следите, чтобы основной статус не прерывался.",
    "Выезд из AR до turno без precaria может приостановить рассмотрение дела.",
  ],
  absenceRulesIntro:
    "Превышение сроков отсутствия — основание для cancelación residencia (ст. 62 Ley 25.871, редакция Decreto 366/2025). Исключения — по решению DNM (работа, учёба, функции AR).",
  absenceRules: {
    headers: ["Статус", "Лимит отсутствия", "Последствия"],
    rows: [
      ["Temporaria", "≥6 месяцев подряд вне AR", "Cancelación + возможная expulsión или regularización"],
      ["Permanente", "≥1 год вне AR", "Cancelación residencia (ст. 62 inc. e)"],
      ["Precaria", "По условиям DNM", "Не засчитывается в arraigo независимо от отсутствия"],
      ["Naturalización", "Любой выезд за 2 года", "Срок обнуляется (ст. 2 Ley 346, 366/2025)"],
    ],
  },
  lossOfStatusIntro: "Помимо отсутствия за границей, DNM может отменить residencia и инициировать expulsión:",
  lossOfStatus: [
    "Поддельные или фальсифицированные документы (ст. 29, 62)",
    "Работа или деятельность, не соответствующая категории migratoria",
    "Судимость за тяжкие преступления или рецидив",
    "Фиктивный брак, «turismo de natalidad» или иное злоупотребление (ст. 62)",
    "Истечение срока temporaria без prórroga — irregularidad (ст. 25, 61)",
    "Desnaturalización основания — смена целей без уведомления DNM",
  ],
  costsIntro:
    "Госпошлины индексируются. Ниже — структура платежей, не фиксированные суммы.",
  costs: [
    {
      emoji: "💳",
      title: "Tasa RADEX — первичная temporaria",
      description: "Оплата при подаче trámite en línea. Точная сумма — в калькуляторе на tramites.migraciones.gob.ar.",
      required: true,
    },
    {
      emoji: "🔄",
      title: "Prórroga temporaria",
      description: "Отдельная tasa при продлении — обычно ниже первичной.",
      required: true,
    },
    {
      emoji: "🏡",
      title: "Cambio a permanente",
      description: "Tasa смены категории — уточняйте в RADEX на дату подачи.",
      required: true,
    },
    {
      emoji: "🪪",
      title: "DNI (Renaper)",
      description: "Оплата при получении пластика — отдельно от Migraciones.",
      required: true,
    },
    {
      emoji: "📝",
      title: "Переводы и апостиль",
      description: "Traductor público, коллегия, апостиль в стране выдачи — частные расходы.",
    },
    {
      emoji: "⚖️",
      title: "Abogado migratorio",
      description: "По желанию — сопровождение turno и проверка пакета.",
    },
  ],
  costsNote:
    "Не используйте суммы из статей 2022–2023 года (6000 pesos и т.п.) — они устарели. Актуальные тарифы публикует DNM в Boletín Oficial и на портале RADEX.",
  typicalMistakesTitle: "Типичные ошибки",
  typicalMistakes: [
    "Работа на туристическом штампе — риск штрафа, expulsión и запрета въезда на 5+ лет.",
    "Подача с просроченным туристическим статусом — отказ или irregularidad.",
    "Перевод документов в России вместо traductor público в Аргентине — отказ на turno.",
    "Выезд до получения precaria или без неё — приостановка дела.",
    "Считать precaria полноценным ВНЖ или стажем для гражданства.",
    "Путать nómada digital (transitoria 180 дней) с rentista/temporaria.",
    "Игнорировать лимит 6 месяцев/1 года за границей после одобрения residencia.",
    "Указывать фиктивный domicilio — основание для cancelación (ст. 37 Ley 25.871).",
    "Не обновлять справку о несудимости после поездки в страну гражданства.",
    "Ожидать автоматический ПМЖ «по ребёнку-аргентинцу» без prórroga temporaria и проверки дохода.",
  ],
  extendedFaq: [
    {
      question: "Можно ли получить ВНЖ, приехав туристом?",
      answer:
        "Да — большинство оснований temporaria оформляют в стране через RADEX без консульской визы. Нужен легальный ingreso, действующий туристический срок на момент подачи и полный пакет по основанию.",
    },
    {
      question: "Сколько оснований для temporaria?",
      answer:
        "15 подкategorий в ст. 23 Ley 25.871 (a–ñ), включая reunificación familiar с Decreto 366/2025. Цифровой кочевник — отдельная transitoria (Disposición 758/2022), не inciso ст. 23.",
    },
    {
      question: "Чем отличается temporaria от permanente?",
      answer:
        "Temporaria — до 3 лет с prórroga по основанию. Permanente — без продления по пункту; отмена при ≥1 годе вне AR. Для ПМЖ по arraigo нужно 2–3 года temporaria, ≥50% времени в стране.",
    },
    {
      question: "Что такое precaria после 366/2025?",
      answer:
        "Residencia precaria до 90 дней, продлевается DNM. Даёт легальное пребывание, работу и учёбу, но не засчитывается в срок для ПМЖ и гражданства.",
    },
    {
      question: "Rentista — сколько нужно дохода?",
      answer:
        "Стабильный пассивный доход из-за рубежа. Конкретный порог устанавливает reglamentación DNM и меняется — проверяйте tramites.migraciones.gob.ar перед подачей, не ориентируйтесь на старые суммы в pesos.",
    },
    {
      question: "Когда можно подать на ПМЖ?",
      answer:
        "После 3 лет temporaria для граждан вне Mercosur (2 года — для Mercosur/Chile/Bolivia), при ≥50% времени в AR и отсутствии >6 мес. подряд за границей. Семейные основания — отдельно, с проверкой дохода.",
    },
    {
      question: "Потеряю ли ПМЖ при длительном отсутствии?",
      answer:
        "Да — ст. 62: permanente отменяют при ≥1 годе вне страны подряд (если нет разрешения DNM). Раньше часто ссылались на 2 года — это устарело.",
    },
    {
      question: "Можно ли получить гражданство раньше ПМЖ?",
      answer:
        "Да — для naturalización нужны 2 года непрерывного legal residence без выезда; ПМЖ не обязателен заранее, но на практике путь часто идёт через temporaria → permanente → ciudadanía.",
    },
    {
      question: "Нужно ли выезжать для продления?",
      answer:
        "Нет — prórroga через RADEX в стране. «Visa run» не заменяет легализацию и после 366/2025 повышает риск отказа на границе.",
    },
    {
      question: "Сколько ждать решения?",
      answer:
        "От 3 недель до 6+ месяцев — зависит от основания, офиса и очереди. Приоритетный turno ускоряет запись, но не гарантирует срок решения.",
    },
  ],
  crossLinks: [
    { title: "Процесс иммиграции", href: "/immigration/protsess-immigratsii", description: "RADEX, DNU 366/2025, въезд" },
    { title: "Гражданство", href: "/immigration/grazhdanstvo", description: "Naturalización, 2 года, DNM" },
    { title: "Возможности", href: "/immigration/vozmozhnosti", description: "Rentista, семья, выбор основания" },
    { title: "Роды в Аргентине", href: "/immigration/rody-v-argentine", description: "Jus soli, reunificación familiar" },
    { title: "Обзор видов ВНЖ", href: "/immigration/obzor-vnzh", description: "Краткий справочник оснований" },
    { title: "Продление туристического визита", href: "/immigration/prodlenie-turisticheskogo-vizita", description: "Лимиты turista" },
  ],
  note:
    "Материал справочный, не юридическая консультация. Перед подачей — abogado migratorio и сверка с migraciones.gob.ar. Обновлено: июнь 2026.",
};

export const IMMIGRATION_OPPORTUNITIES: ImmigrationOpportunitiesContent = {
  intro:
    "Выберите основание под ваш профиль: пассивный доход, удалённая работа, учёба, семья или инвестиции. Сравните самостоятельную подачу и сопровождение специалиста.",
  highlights: [
    {
      emoji: "💰",
      title: "Рантье — пассивный доход",
      titleEs: "rentista",
      body: "Самый популярный путь для релокантов: аренда, дивиденды, пенсия из-за рубежа.",
      href: "/immigration/obzor-vnzh",
      linkLabel: "Обзор ВНЖ",
    },
    {
      emoji: "💻",
      title: "Цифровой кочевник",
      titleEs: "nómada digital · transitoria",
      body: "Residencia transitoria до 180+180 дней (758/2022) — не temporaria. Для ПМЖ нужен переход на rentista или другое основание.",
      href: "/immigration/obzor-vnzh",
      linkLabel: "Transitoria vs ВНЖ",
    },
    {
      emoji: "👨‍💼",
      title: "Работа по контракту",
      titleEs: "trabajo",
      body: "Контракт с аргентинской компанией — работодатель часто сопровождает заявление (trámite).",
    },
    {
      emoji: "🎓",
      title: "Учёба",
      titleEs: "estudiante",
      body: "Аккредитованный вуз — основание для молодых релокантов.",
    },
    {
      emoji: "👶",
      title: "Родитель ребёнка-аргентинца",
      titleEs: "padre/madre de argentino",
      body: "Рождение ребёнка в AR — ускоренный путь к ПМЖ (permanente).",
      href: "/immigration/rody-v-argentine",
      linkLabel: "Роды в Аргентине",
    },
    {
      emoji: "🌎",
      title: "Гражданин Mercosur",
      titleEs: "mercosur",
      body: "Упрощённый режим для граждан стран Mercosur и ассоциированных.",
    },
  ],
  alternatives: [
    {
      emoji: "🇧🇷",
      title: "Бразилия",
      body: "Jus soli, сильный паспорт, альтернатива для семей с детьми. Сравните налоги и сроки.",
    },
    {
      emoji: "🇵🇾",
      title: "Парагвай",
      body: "Territorial tax, относительно простой ВНЖ — «план Б» в Латинской Америке.",
    },
    {
      emoji: "🇺🇾",
      title: "Уругвай",
      body: "Налоговые каникулы для новых резидентов, стабильная юрисдикция.",
    },
  ],
  diyTitle: "Самостоятельно",
  diyBody:
    "Подходит при свободном испанском и готовности мониторить RADEX. Экономите на гонораре, но рискуете потерять время на ошибки в формах и очереди.",
  proTitle: "С сопровождением",
  proBody:
    "Abogado migratorio проверит основание, соберёт пакет и сопроводит turno. Запросите контакты партнёров через форму — мы не оказываем юридических услуг.",
  contactsHref: "/contacts",
  contactsLabel: "Запросить контакты",
};

export const IMMIGRATION_USEFUL_LINKS: ImmigrationUsefulLinksContent = {
  intro: "Официальные источники, наши статьи и смежные разделы платформы.",
  official: [
    {
      title: "Migraciones — главный портал",
      href: "https://www.migraciones.gob.ar",
      description: "Правила, новости, контакты",
    },
    {
      title: "RADEX — trámites online",
      href: "https://tramites.migraciones.gob.ar",
      description: "Запись и подача документов",
    },
    {
      title: "Renaper — DNI",
      href: "https://www.argentina.gob.ar/interior/renaper",
      description: "Documento Nacional de Identidad",
    },
    {
      title: "Boletín Oficial",
      href: "https://www.boletinoficial.gob.ar",
      description: "Официальные декреты и нормы",
    },
  ],
  articles: [
    {
      title: "Визы для туристов",
      href: "/immigration/vizy-dlya-turistov",
      description: "Безвиз, AVE и граница",
    },
    {
      title: "Обзор видов ВНЖ",
      href: "/immigration/obzor-vnzh",
      description: "Rentista, работа, кочевник",
    },
    {
      title: "Документы для въезда",
      href: "/immigration/dokumenty-dlya-vyezda",
      description: "Список перед поездкой",
    },
    {
      title: "Продление пребывания",
      href: "/immigration/prodlenie-turisticheskogo-vizita",
      description: "Migraciones и лимиты",
    },
  ],
  related: [
    {
      title: "Как добраться — документы въезда",
      href: "/guide/kak-dobratsya#entry-docs",
      description: "Страховка, билеты, граница",
    },
    {
      title: "Экономика и деньги",
      href: "/guide/ekonomika-i-dengi",
      description: "Курсы, карты, переводы",
    },
    {
      title: "Где жить",
      href: "/guide/gde-zhit",
      description: "Районы, аренда, быт",
    },
    {
      title: "Путеводитель",
      href: "/guide",
      description: "14 тем для жизни и поездок",
    },
  ],
};
