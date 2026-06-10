import type { ImmigrationHubContent } from "@/types/immigration-hub";

const FAQ: ImmigrationHubContent["faq"] = [
  {
    question: "Можно ли получить ВНЖ в Аргентине, приехав как турист?",
    answer:
      "Да — большинство оснований для residencia temporaria оформляют уже в стране через RADEX, без консульской визы. Важно легально въехать, не нарушать срок туристического пребывания и собрать пакет по выбранному основанию.",
  },
  {
    question: "Сколько оснований для ВНЖ существует в Аргентине?",
    answer:
      "Закон предусматривает 14 категорий residencia temporaria — от rentista и цифрового кочевника до работы, учёбы, инвестиций и семейных оснований. Актуальный список публикует Dirección Nacional de Migraciones.",
  },
  {
    question: "Через сколько лет можно получить гражданство?",
    answer:
      "При непрерывном легальном проживании — обычно 2 года с момента одобрения permanente (или с даты въезда по некоторым основаниям). Нужны испанский язык, экзамен «Conocer Argentina», отсутствие судимостей.",
  },
  {
    question: "Чем отличается temporaria от permanente?",
    answer:
      "Temporaria выдаётся на срок до 3 лет по конкретному основанию. Permanente — после 3 лет непрерывной temporaria или по особым основаниям (например, родитель аргентинского ребёнка). Permanente не требует ежегодного продления по тому же пункту.",
  },
  {
    question: "Что такое DNU 366/2025 и как он влияет на въезд?",
    answer:
      "Декрет ужесточил требования к туристическому въезду: обязательная медстраховка на весь срок, более строгая проверка документов и цели визита. На residencia напрямую не распространяется, но первый контакт с Migraciones проходит по новым правилам.",
  },
  {
    question: "Нужна ли медстраховка для въезда?",
    answer:
      "С 2025 года — да, для туристов: полис или travel assistance с покрытием на всей территории Аргентины на весь заявленный срок. Для подачи на ВНЖ страховка также часто входит в пакет документов.",
  },
  {
    question: "Что такое RADEX и как им пользоваться?",
    answer:
      "RADEX — онлайн-портал Migraciones для записи на приём, подачи заявлений на residencia, precaria и продлений. Нужна регистрация, загрузка сканов и оплата пошлин. Слоты на запись бывают дефицитными.",
  },
  {
    question: "Даёт ли рождение ребёнка в Аргентине гражданство?",
    answer:
      "Да — по принципу jus soli ребёнок, рождённый на территории Аргентины, получает гражданство. Родители могут оформить residencia по основанию padre/madre de argentino — это одно из популярных семейных оснований.",
  },
  {
    question: "Можно ли работать на туристическом статусе?",
    answer:
      "Нет. Туристический штамп не даёт права на оплачиваемую работу. Для легальной занятости нужен соответствующий тип residencia или разрешение через работодателя.",
  },
  {
    question: "Что такое precaria?",
    answer:
      "Временное разрешение на пребывание после подачи на residencia, пока рассматривается заявление. Даёт право легально находиться в стране; условия зависят от типа дела.",
  },
  {
    question: "Подходит ли Аргентина цифровым кочевникам?",
    answer:
      "Да, есть отдельное основание для remote workers с подтверждённым доходом из-за рубежа. Требования включают контракт или справку о работе, минимальный доход и страховку.",
  },
  {
    question: "Rentista — сколько нужно дохода?",
    answer:
      "Требуется доказать стабильный пассивный доход из-за рубежа (аренда, дивиденды, пенсия). Порог устанавливает Migraciones и пересматривается — сверяйте актуальную сумму на момент подачи.",
  },
  {
    question: "Даёт ли аргентинский паспорт безвизовый режим?",
    answer:
      "Да — паспорт Аргентины открывает безвиз или visa on arrival примерно в 170 стран, включая Шенген, Великобританию, Японию и большинство Латинской Америки.",
  },
  {
    question: "Нужен ли DNI и как его получить?",
    answer:
      "DNI выдаёт Renaper после одобрения residencia. Нужен для банков, аренды, медицины и контрактов. Запись — через портал Renaper, отдельно от Migraciones.",
  },
  {
    question: "Где проверить актуальные правила?",
    answer:
      "Официально: migraciones.gob.ar, tramites.migraciones.gob.ar, boletín oficial, консульство Аргентины. Наш справочник не заменяет юриста — перед решениями сверяйтесь с первоисточниками.",
  },
];

export const IMMIGRATION_HUB: ImmigrationHubContent = {
  heroTitle: "Иммиграция в Аргентину",
  heroSubtitle:
    "Жизнь в стране, ВНЖ и ПМЖ, гражданство, роды и правила въезда — справочно, без юридических гарантий.",
  heroImage: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920&q=80",
  heroCtas: [
    { label: "🏠 Жизнь в стране", href: "#life-in-country", variant: "primary" },
    { label: "📋 ВНЖ и ПМЖ", href: "#residency", variant: "secondary" },
    { label: "🇦🇷 Гражданство", href: "#citizenship", variant: "secondary" },
    { label: "👶 Роды", href: "#birth", variant: "tertiary" },
  ],
  quickFacts30: [
    { emoji: "🌎", label: "Открытая страна", value: "14 оснований для ВНЖ" },
    { emoji: "⏱", label: "Путь к гражданству", value: "~2 года после permanente" },
    { emoji: "🛂", label: "Турист → резидент", value: "Смена статуса в стране" },
    { emoji: "📘", label: "Паспорт AR", value: "Безвиз ~170 стран" },
    { emoji: "💻", label: "Digital nomad", value: "Отдельное основание ВНЖ" },
    { emoji: "👶", label: "Jus soli", value: "Гражданство ребёнку при рождении" },
    { emoji: "⚠️", label: "DNU 366/2025", value: "Страховка и контроль въезда" },
    { emoji: "🏥", label: "Медицина", value: "Экстренная помощь бесплатна" },
  ],
  toc: [
    { id: "quick-30", label: "Кратко за 30 секунд" },
    { id: "hub-overview", label: "Разделы справочника" },
    { id: "life-in-country", label: "Жизнь в стране" },
    { id: "immigration-process", label: "Процесс иммиграции" },
    { id: "birth", label: "Роды в Аргентине" },
    { id: "citizenship", label: "Гражданство" },
    { id: "residency", label: "ВНЖ и ПМЖ" },
    { id: "opportunities", label: "Возможности" },
    { id: "useful-links", label: "Полезные ссылки" },
    { id: "faq", label: "FAQ" },
  ],
  hubTopics: [
    {
      id: "life-in-country",
      emoji: "🏠",
      title: "Жизнь в стране",
      description: "Климат, медицина, жильё, продукты и сообщество экспатов",
      href: "#life-in-country",
    },
    {
      id: "immigration-process",
      emoji: "🛂",
      title: "Процесс иммиграции",
      description: "Въезд, DNU 366/2025, RADEX и документы",
      href: "#immigration-process",
    },
    {
      id: "birth",
      emoji: "👶",
      title: "Роды в Аргентине",
      description: "Jus soli, гражданство ребёнку и residencia родителям",
      href: "#birth",
    },
    {
      id: "citizenship",
      emoji: "🇦🇷",
      title: "Гражданство",
      description: "Паспорт, экзамены, сроки и безвизовый режим",
      href: "#citizenship",
    },
    {
      id: "residency",
      emoji: "📋",
      title: "ВНЖ и ПМЖ",
      description: "Temporaria, permanente и 14 оснований",
      href: "#residency",
    },
    {
      id: "opportunities",
      emoji: "💡",
      title: "Возможности",
      description: "Rentista, nomad, DIY и сопровождение",
      href: "#opportunities",
    },
    {
      id: "useful-links",
      emoji: "🔗",
      title: "Полезные ссылки",
      description: "Migraciones, статьи и смежные разделы",
      href: "#useful-links",
    },
  ],
  lifeInCountry: {
    intro:
      "Аргентина — одна из самых «европейских» стран LatAm для долгого проживания: развитый Буэнос-Айрес, разнообразный климат от субтропиков до Патагонии, сильная медицина и активное русскоязычное сообщество.",
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
        body: "Аренда в USD или pesos, от студий до таунхаусов. Для residencia часто нужен договор аренды или собственность.",
        href: "/guide/gde-zhit",
        linkLabel: "Жильё в справочнике",
      },
      {
        emoji: "🌐",
        title: "Сообщество",
        body: "Русско- и англоязычные чаты, коворкинги, школы. Проще адаптироваться, чем в ряде соседних стран LatAm.",
        href: "/guide/yazyk",
        linkLabel: "Язык",
      },
    ],
  },
  immigrationProcess: {
    intro:
      "Типичный сценарий: безвизовый въезд как турист → сбор документов → подача через RADEX → precaria → residencia temporaria. Не работайте на туристическом статусе.",
    touristRules: [
      "Загранпаспорт с запасом срока (обычно 6+ месяцев)",
      "Медстраховка на весь срок — обязательна с 2025 года (DNU 366/2025)",
      "Обратный или onward билет, подтверждение жилья",
      "Средства на поездку — могут запросить выписку или карту",
      "Чёткая цель визита: туризм, если ещё не подаёте на ВНЖ",
    ],
    statusChangeNote:
      "После въезда можно сменить статус: собрать пакет по выбранному основанию, записаться в RADEX и подать на residencia temporaria, не нарушая правил пребывания.",
    dnuTitle: "DNU 366/2025 — что изменилось",
    dnuChanges: [
      "Обязательная медстраховка или travel assistance на весь срок в Аргентине",
      "Более детальная проверка цели визита, билетов и подтверждения жилья",
      "Акцент на соблюдении миграционного режима — штампы, сроки, отсутствие «фиктивного» туризма",
      "Экстренная медпомощь в госпиталях остаётся бесплатной для всех",
    ],
    dnuNote: "Перед вылетом сверяйтесь с migraciones.gob.ar и консульством — правила могут дополняться.",
    radexSteps: [
      { step: 1, title: "Регистрация", body: "Аккаунт на tramites.migraciones.gob.ar, подтверждение email." },
      { step: 2, title: "Выбор trámite", body: "Тип residencia по основанию — форма и чеклист подтянутся автоматически." },
      { step: 3, title: "Загрузка сканов", body: "PDF/JPG в требуемом качестве; несоответствие — частая причина отказа." },
      { step: 4, title: "Оплата пошлин", body: "Онлайн через VEP или банк — сохраните квитанции." },
      { step: 5, title: "Turno (запись)", body: "Слот в офисе Migraciones; при дефиците — мониторьте портал." },
      { step: 6, title: "Приём и precaria", body: "Оригиналы документов, precaria до решения по делу." },
    ],
    radexPortalUrl: "https://tramites.migraciones.gob.ar",
    documentsIntro: "Базовый чеклист для residencia temporaria. Точный список зависит от основания.",
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
        description: "Для rentista / nomad — выписки, контракты за 6–12 месяцев.",
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
  },
  birthInArgentina: {
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
        title: "Residencia родителям",
        body: "Основание «padre/madre de argentino» — путь к temporaria и далее permanente без ожидания 3 лет по стандартному маршруту.",
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
        body: "Запись в Renaper — нужен для дальнейших trámites семьи.",
        duration: "2–6 недель",
      },
      {
        step: 4,
        title: "Residencia родителей",
        body: "Подача в Migraciones по padre/madre de argentino через RADEX.",
        duration: "1–6 месяцев",
      },
    ],
    note: "Решение о родах в другой стране — личное и медицинское. Сверяйте актуальные требования Migraciones и консультацию с врачом и abogado migratorio.",
  },
  citizenship: {
    intro:
      "Гражданство (ciudadanía) — финальный этап: паспорт Аргентины с безвизом ~170 стран. Требует легального непрерывного проживания, экзаменов и отсутствия непогашенных судимостей.",
    cards: [
      {
        emoji: "📘",
        title: "Сильный паспорт",
        body: "Шенген, Великобритания, Япония, большинство LatAm — безвиз или упрощённый въезд. Список меняется — проверяйте актуальность.",
      },
      {
        emoji: "⏱",
        title: "Срок — около 2 лет",
        body: "После получения permanente при непрерывном легальном проживании. Семейные основания могут отличаться.",
      },
      {
        emoji: "📝",
        title: "Экзамены",
        body: "Испанский язык + «Conocer Argentina» (история, культура, конституция). Подготовка — 3–12 месяцев.",
      },
      {
        emoji: "🗳",
        title: "Права гражданина",
        body: "Голосование, работа без ограничений, полный доступ к соцсистеме. Двойное гражданство — по законам вашей страны.",
      },
    ],
    pathSteps: [
      {
        step: 1,
        title: "Residencia temporaria",
        body: "Легальный статус минимум 3 года (или ускоренные основания).",
        duration: "До 3 лет",
      },
      {
        step: 2,
        title: "Residencia permanente",
        body: "Подтверждение непрерывного проживания и соблюдения условий.",
        duration: "2+ года",
      },
      {
        step: 3,
        title: "Подготовка к экзаменам",
        body: "Курсы испанского, материалы «Conocer Argentina».",
        duration: "3–12 мес.",
      },
      {
        step: 4,
        title: "Подача на ciudadanía",
        body: "Через суд или Migraciones — зависит от основания и региона.",
        duration: "6–18 мес.",
      },
      {
        step: 5,
        title: "Паспорт AR",
        body: "Registro Nacional de las Personas — DNI и pasaporte argentino.",
        duration: "2–8 недель",
      },
    ],
    note: "Сроки ориентировочные. Перед подачей — консультация с abogado migratorio и сверка с migraciones.gob.ar.",
  },
  residency: {
    intro:
      "Residencia temporaria (ВНЖ) — на срок до 3 лет по одному из 14 оснований. После 3 лет непрерывной temporaria — residencia permanente (ПМЖ).",
    types: [
      {
        emoji: "✈",
        title: "Turista",
        body: "Штамп до 90 дней. Без права на работу. Смена статуса — через Migraciones.",
      },
      {
        emoji: "📄",
        title: "Residencia temporaria",
        body: "ВНЖ до 3 лет: DNI, банки, аренда, легальная работа (если основание позволяет).",
      },
      {
        emoji: "🏡",
        title: "Residencia permanente",
        body: "ПМЖ после 3 лет temporaria или по особым основаниям (родитель argentino).",
      },
      {
        emoji: "⏳",
        title: "Precaria",
        body: "Временное разрешение на пребывание, пока рассматривается заявление на residencia.",
      },
    ],
    groundsTable: {
      headers: ["№", "Основание", "Кратко", "Типичный срок"],
      rows: [
        ["1", "Rentista", "Пассивный доход из-за рубежа", "До 3 лет"],
        ["2", "Jubilado / pensionado", "Пенсия из другой страны", "До 3 лет"],
        ["3", "Trabajo", "Контракт с аргентинским работодателем", "По контракту"],
        ["4", "Nómada digital", "Remote work, доход из-за рубежа", "До 3 лет"],
        ["5", "Estudiante", "Учёба в аккредитованном учреждении", "По периоду учёбы"],
        ["6", "Inversor", "Инвестиции в аргентинскую экономику", "По проекту"],
        ["7", "Reagrupación familiar", "Воссоединение с резидентом/гражданином", "Связано с спонсором"],
        ["8", "Padre/madre de argentino", "Родитель ребёнка, рождённого в AR", "Путь к permanente"],
        ["9", "Refugiado / asilo", "Международная защита", "Особый порядок"],
        ["10", "Mercosur", "Граждане стран Mercosur", "Упрощённый режим"],
        ["11", "Científico / investigador", "Исследовательская деятельность", "По проекту"],
        ["12", "Artista / deportista", "Культурные или спортивные контракты", "По контракту"],
        ["13", "Religioso", "Религиозная миссия", "По соглашению"],
        ["14", "Humanitario / tratamiento", "Лечение или гуманитарные причины", "По мед. основанию"],
      ],
    },
    overviewHref: "/immigration/obzor-vnzh",
    overviewLabel: "Подробный обзор видов ВНЖ",
  },
  opportunities: {
    intro:
      "Выберите основание под ваш профиль: пассивный доход, удалённая работа, учёба, семья или инвестиции. Сравните DIY и сопровождение специалиста.",
    highlights: [
      {
        emoji: "💰",
        title: "Rentista",
        body: "Самый популярный путь для релокантов с пассивным доходом: аренда, дивиденды, пенсия из-за рубежа.",
        href: "/immigration/obzor-vnzh",
        linkLabel: "Обзор ВНЖ",
      },
      {
        emoji: "💻",
        title: "Nómada digital",
        body: "Remote work на иностранного работодателя с подтверждённым доходом и страховкой.",
        href: "/immigration/obzor-vnzh",
        linkLabel: "Требования",
      },
      {
        emoji: "👨‍💼",
        title: "Trabajo",
        body: "Контракт с аргентинской компанией — работодатель часто сопровождает trámite.",
      },
      {
        emoji: "🎓",
        title: "Estudiante",
        body: "Учёба в аккредитованном вузе — основание для молодых релокантов.",
      },
      {
        emoji: "👶",
        title: "Padre de argentino",
        body: "Рождение ребёнка в AR — семейное основание с ускоренным путём к permanente.",
        href: "#birth",
        linkLabel: "Роды в Аргентине",
      },
      {
        emoji: "🌎",
        title: "Mercosur",
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
        body: "Territorial tax, относительно простой ВНЖ — «план Б» в LatAm.",
      },
      {
        emoji: "🇺🇾",
        title: "Уругвай",
        body: "Налоговые каникулы для новых резидентов, стабильная юрисдикция.",
      },
    ],
    diyTitle: "Самостоятельно (DIY)",
    diyBody:
      "Подходит при fluent испанском и готовности мониторить RADEX. Экономите на fee, но рискуете потерять время на ошибки в формах и очереди.",
    proTitle: "С сопровождением",
    proBody:
      "Abogado migratorio проверит основание, соберёт пакет и сопроводит turno. Запросите контакты партнёров через форму — мы не оказываем юридических услуг.",
    contactsHref: "/contacts",
    contactsLabel: "Запросить контакты",
  },
  usefulLinks: {
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
        description: "Rentista, работа, nomad",
      },
      {
        title: "Документы для въезда",
        href: "/immigration/dokumenty-dlya-vyezda",
        description: "Чеклист перед поездкой",
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
  },
  warnings: [
    "Материалы не являются юридической консультацией — перед подачей проконсультируйтесь с licensed abogado migratorio.",
    "Не работайте на туристическом статусе — штрафы и депортация.",
    "Следите за сроком туристического штампа: просрочка осложняет легализацию.",
    "Правила Migraciones и DNU меняются — проверяйте migraciones.gob.ar перед каждым этапом.",
  ],
  faq: FAQ,
  disclaimer:
    "Справочник «Пора в Аргентину» носит информационный характер. Решения принимает Dirección Nacional de Migraciones и судебная система Аргентины.",
};
