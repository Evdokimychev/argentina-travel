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
  submissionLinks: { label: string; href: string }[];
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
    "Переезд начинается не с обещаний, а с выбора города, бюджета, медицины и законного миграционного статуса. Условия заметно различаются между Буэнос-Айресом, провинциями и небольшими городами.",
  cards: [
    {
      emoji: "🏙",
      title: "Город и район",
      body: "Сравните транспорт, медицину, школы, безопасность и стоимость аренды именно в выбранном районе.",
      href: "/guide/gde-zhit",
      linkLabel: "Выбрать место",
    },
    {
      emoji: "🌡",
      title: "Климат и расстояния",
      body: "Аргентина очень протяжённая: сезонность, высота и время в пути важнее общей характеристики страны.",
      href: "/guide/pogoda-i-sezonnost",
      linkLabel: "Погода и сезоны",
    },
    {
      emoji: "🏥",
      title: "Медицина",
      body: "Экстренную помощь нельзя отказать из-за миграционного статуса. Правила обычной помощи зависят от статуса и учреждения; заранее проверьте страховку и конкретную клинику.",
    },
    {
      emoji: "🏡",
      title: "Жильё",
      body: "До подписания договора проверьте валюту расчётов, индексацию, депозит, гарантию и акт состояния квартиры.",
      href: "/guide/gde-zhit",
      linkLabel: "Жильё и районы",
    },
  ],
};

export const IMMIGRATION_PROCESS: ImmigrationProcessContent = {
  intro:
    "Сначала определите подходящую миграционную категорию на официальном сайте DNM. Заявления о проживании внутри Аргентины начинаются через RADEX; требования и документы зависят от основания.",
  touristRules: [
    "Проверьте визовый режим именно для гражданства по паспорту и цели поездки.",
    "Сверьте требования к паспорту, маршруту, адресу проживания и подтверждению цели у DNM, консульства и перевозчика.",
    "Туристический статус сам по себе не разрешает оплачиваемую работу.",
    "Оформите медицинскую страховку как практическую защиту, даже если порядок её пограничной проверки ещё не введён.",
  ],
  statusChangeNote:
    "Внутри страны DNM рассматривает radicación по подходящей категории. Возможность и результат смены категории определяет DNM; туристический въезд не гарантирует ВНЖ.",
  dnuTitle: "Decreto 366/2025: что важно проверить",
  dnuChanges: [
    "Закон предусматривает декларацию цели въезда и медицинскую страховку, но их обязательная проверка связана с введением регламента по статье 123 bis.",
    "Экстренную медицинскую помощь нельзя ограничивать из-за миграционного статуса.",
    "Precaria может выдаваться на срок до 90 календарных дней и продлеваться мотивированным решением DNM.",
    "Действующая precaria разрешает пребывание, выезд и въезд, работу и учёбу, но не считается стажем для постоянного проживания и натурализации.",
  ],
  dnuNote:
    "Проверено 17.07.2026 по официальному тексту Decreto 366/2025. До поездки повторно проверьте, появился ли регламент статьи 123 bis.",
  radexSteps: [
    { step: 1, title: "Выбрать категорию", body: "Откройте раздел DNM «Residencias» и найдите основание, которое соответствует вашей ситуации." },
    { step: 2, title: "Проверить требования", body: "Используйте перечень документов именно на странице выбранной категории; не копируйте списки из форумов." },
    { step: 3, title: "Начать заявление", body: "Заявления о radicación в Аргентине запускаются через RADEX." },
    { step: 4, title: "Следовать указаниям DNM", body: "Загрузите запрошенные документы, оплатите показанные системой сборы и выполняйте уведомления по делу." },
    { step: 5, title: "Сохранить подтверждения", body: "Храните номер дела, квитанции, уведомления и актуальный документ о статусе." },
  ],
  radexPortalUrl: "https://www.migraciones.gob.ar/radex/",
  documentsIntro:
    "Единого пакета для всех категорий нет. Ниже — группы документов, которые нужно проверить на официальной странице своего основания.",
  documentsChecklist: [
    { emoji: "🛂", title: "Личность и въезд", description: "Паспорт и подтверждение законного въезда — в форме, которую требует выбранная категория.", required: true },
    { emoji: "🛡", title: "Справки о несудимости", description: "Нужность, страны выдачи и срок действия определяются категорией и историей проживания." },
    { emoji: "📄", title: "Документ по основанию", description: "Например, семейная связь, учёба, работа, доход или иной критерий из статьи 23.", required: true },
    { emoji: "🏠", title: "Адрес и контакты", description: "Указывайте только достоверные сведения и обновляйте их по правилам DNM.", required: true },
  ],
  apostilleNote:
    "Документы, выданные за пределами Аргентины, могут требовать апостиль или консульскую легализацию и перевод. Точный порядок сверяйте в карточке trámite до заказа перевода.",
  entryDocsHref: "/immigration/dokumenty-dlya-vyezda",
  entryDocsLabel: "Проверить документы для поездки",
};

export const IMMIGRATION_BIRTH: ImmigrationBirthContent = {
  intro:
    "Ребёнок, родившийся на территории Аргентины, является гражданином по рождению, кроме установленного законом исключения для детей иностранных дипломатов. Статус родителей оформляется отдельно и не возникает автоматически.",
  cards: [
    { emoji: "👶", title: "Гражданство ребёнка", body: "Принцип jus soli закреплён в статье 1 Ley 346; закон содержит дипломатическое исключение." },
    { emoji: "📄", title: "Регистрация рождения", body: "Рождение регистрируют в Registro Civil, после чего оформляют документы ребёнка по актуальным инструкциям RENAPER." },
    { emoji: "👨‍👩‍👧", title: "Статус родителей", body: "Родитель аргентинского ребёнка может подходить под временную семейную категорию статьи 23 ñ. Постоянный статус — отдельное решение DNM." },
    { emoji: "🏥", title: "Медицинский план", body: "Выберите врача и учреждение заранее и письменно уточните стоимость, покрытие страховки и перечень услуг." },
  ],
  steps: [
    { step: 1, title: "Выбрать медицинскую команду", body: "Уточнить наблюдение, роды, возможные осложнения, стоимость и правила учреждения." },
    { step: 2, title: "Зарегистрировать рождение", body: "Получить acta/partida de nacimiento по инструкции местного Registro Civil." },
    { step: 3, title: "Оформить документы ребёнка", body: "Следовать текущей процедуре RENAPER для DNI и, при необходимости, паспорта." },
    { step: 4, title: "Проверить основание родителей", body: "Открыть карточку reunificación familiar в DNM и подать отдельное заявление при соответствии условиям." },
  ],
  note:
    "Роды — медицинское решение, а миграционный статус — отдельная административная процедура. Не основывайте выбор клиники или переезд на обещании автоматического ПМЖ родителям.",
};

export const IMMIGRATION_CITIZENSHIP: ImmigrationCitizenshipContent = {
  intro:
    "По действующей редакции Ley 346 совершеннолетний иностранец может просить натурализацию после двух лет непрерывного законного проживания непосредственно перед заявлением. Непрерывность означает отсутствие выездов в течение всего периода.",
  dnuWarning:
    "Decreto 366/2025 изменил правила натурализации. С октября 2025 DNM принимает новые заявления в цифровом формате. Перед подачей проверяйте действующую процедуру DNM: формы и практика могут обновляться.",
  cards: [
    { emoji: "⏱", title: "Два года", body: "Нужны два года непрерывного и законного проживания непосредственно перед заявлением." },
    { emoji: "🧳", title: "Без выездов", body: "Любой выезд прерывает непрерывность периода по статье 2 Ley 346 в действующей редакции." },
    { emoji: "🏛", title: "Заявление в DNM", body: "Новые заявления оформляются через Dirección Nacional de Migraciones по опубликованной цифровой процедуре." },
    { emoji: "⏳", title: "Precaria не считается", body: "Decreto 366/2025 прямо исключает precaria из срока натурализации." },
  ],
  grounds: [
    { emoji: "🌎", title: "Натурализация", body: "Для совершеннолетнего иностранца — условия статьи 2 Ley 346, включая двухлетнее непрерывное законное проживание." },
    { emoji: "👶", title: "Гражданство по рождению", body: "Для рождённых в Аргентине — статья 1 Ley 346 с предусмотренным законом дипломатическим исключением." },
    { emoji: "🇦🇷", title: "Гражданство по выбору", body: "Для детей граждан Аргентины, родившихся за рубежом, действует отдельная процедура opción." },
  ],
  groundsNote:
    "Брак с гражданином Аргентины или аргентинский ребёнок важны для миграционного статуса, но сами по себе не заменяют проверку действующих условий натурализации DNM.",
  expeditedNote:
    "Не рассчитывайте на «ускоренное гражданство» без официальной карточки процедуры. Сначала подтвердите применимое основание непосредственно в DNM.",
  documentsIntro:
    "Точный цифровой пакет публикует DNM. Сначала откройте действующую процедуру, затем заказывайте справки и переводы.",
  documentsChecklist: [
    { emoji: "🪪", title: "Удостоверение личности", description: "Документ, который принимает действующая цифровая форма DNM.", required: true },
    { emoji: "📅", title: "История законного проживания", description: "Данные должны подтверждать два непрерывных года без выездов.", required: true },
    { emoji: "🛡", title: "Проверки и справки", description: "Состав и срок действия берите только из текущей инструкции DNM." },
    { emoji: "📄", title: "Документы по основанию", description: "Для рождения, opción или натурализации пакеты различаются.", required: true },
  ],
  specialDocumentsNote:
    "Не используйте старые судебные чек-листы как универсальную инструкцию: после реформы канал подачи изменился.",
  pathSteps: [
    { step: 1, title: "Проверить непрерывность", body: "Сопоставьте миграционную историю с требованием двух лет законного проживания без выездов." },
    { step: 2, title: "Открыть процедуру DNM", body: "Проверьте текущую цифровую форму, документы и сборы." },
    { step: 3, title: "Подать заявление", body: "Передайте только достоверные документы и сохраните номер trámite." },
    { step: 4, title: "Ответить на запросы", body: "Срок зависит от проверки конкретного дела; универсального обещания по сроку нет." },
  ],
  submissionIntro:
    "DNM сообщила 06.10.2025 о цифровой подаче новых заявлений на гражданство. Начинайте с актуальной официальной страницы, а не со старых инструкций о подаче в суд.",
  submissionSteps: [
    "Проверить два года непрерывного законного проживания без выездов.",
    "Сверить актуальные требования и цифровой канал на сайте DNM.",
    "Подготовить только перечисленные DNM документы и необходимые легализации.",
    "Подать заявление и отслеживать официальные уведомления по делу.",
  ],
  submissionLinks: [
    { label: "Ley 346 — актуальный текст", href: "https://www.argentina.gob.ar/normativa/nacional/ley-346-48854/actualizacion" },
    { label: "DNM — цифровая процедура", href: "https://www.argentina.gob.ar/noticias/ahora-el-tramite-de-ciudadania-argentina-se-podra-hacer-de-forma-digital-en-migraciones" },
    { label: "Decreto 366/2025", href: "https://www.argentina.gob.ar/normativa/nacional/decreto-366-2025-413297/texto" },
  ],
  timelinesNote:
    "Официальные источники не дают универсального срока для каждого дела. Не планируйте поездки, работу или отказ от другого гражданства по неофициальному прогнозу.",
  note:
    "Проверено 17.07.2026 по Ley 346, Decreto 366/2025 и сообщению DNM от 06.10.2025. Материал справочный и не заменяет консультацию по конкретному делу.",
};

export const IMMIGRATION_RESIDENCY: ImmigrationResidencyContent = {
  intro:
    "DNM различает transitoria, temporaria и permanente. В статье 23 Ley 25.871 сейчас 15 буквенных подкатегорий temporaria (a–ñ), но соответствие каждой из них и итоговый срок определяет DNM по документам заявителя.",
  dnuWarning:
    "Decreto 366/2025 изменил precaria, семейное воссоединение, постоянное проживание и правила отмены статуса. Проверено 17.07.2026; перед подачей откройте актуальную карточку trámite DNM.",
  types: [
    { emoji: "✈", title: "Временное пребывание", titleEs: "residencia transitoria", body: "Для ограниченной цели и срока; по общему правилу DNM не выдаёт DNI в этой категории." },
    { emoji: "📄", title: "Временное проживание", titleEs: "residencia temporaria", body: "До трёх лет в зависимости от подкатегории, с DNI temporario и условиями конкретного основания." },
    { emoji: "🏡", title: "Постоянное проживание", titleEs: "residencia permanente", body: "Не имеет даты окончания, но может быть отменено по основаниям статьи 62, включая длительное отсутствие." },
    { emoji: "⏳", title: "Precaria", titleEs: "residencia precaria", body: "Временный документ на период процедуры: до 90 дней, с возможным продлением по решению DNM; не гарантирует одобрение." },
  ],
  grounds: [
    { num: "a", titleRu: "Работа", titleEs: "trabajador migrante", summary: "Законная оплачиваемая деятельность по условиям категории", duration: "по решению DNM" },
    { num: "b", titleRu: "Доход из-за рубежа", titleEs: "rentista", summary: "Собственные средства из законного внешнего источника", duration: "по решению DNM" },
    { num: "c", titleRu: "Пенсия", titleEs: "pensionado", summary: "Регулярная пенсия от иностранного государства или организации", duration: "по решению DNM" },
    { num: "d", titleRu: "Инвестиции", titleEs: "inversionista", summary: "Инвестиционный проект по требованиям DNM", duration: "по решению DNM" },
    { num: "e", titleRu: "Наука и специальность", titleEs: "científico y personal especializado", summary: "Деятельность по научному или специализированному основанию", duration: "по решению DNM" },
    { num: "f", titleRu: "Спорт и искусство", titleEs: "deportistas y artistas", summary: "Деятельность по контракту и правилам категории", duration: "по решению DNM" },
    { num: "g", titleRu: "Религиозная деятельность", titleEs: "religiosos", summary: "Деятельность признанной религиозной организации", duration: "по решению DNM" },
    { num: "h", titleRu: "Медицинское лечение", titleEs: "pacientes bajo tratamientos médicos", summary: "Лечение в государственном или частном учреждении", duration: "по решению DNM" },
    { num: "i", titleRu: "Академическая деятельность", titleEs: "académicos", summary: "Программы и соглашения в установленной законом форме", duration: "по решению DNM" },
    { num: "j", titleRu: "Учёба", titleEs: "estudiantes", summary: "Обучение в признанном учреждении", duration: "по решению DNM" },
    { num: "k", titleRu: "Убежище или статус беженца", titleEs: "asilados y refugiados", summary: "Международная защита в установленном порядке", duration: "по решению DNM" },
    { num: "l", titleRu: "Гражданство государства MERCOSUR", titleEs: "nacionalidad", summary: "Категория для граждан перечисленных законом государств", duration: "по решению DNM" },
    { num: "m", titleRu: "Гуманитарные причины", titleEs: "razones humanitarias", summary: "Основание оценивается компетентными органами", duration: "по решению DNM" },
    { num: "n", titleRu: "Особые причины", titleEs: "especiales", summary: "Специальные случаи, признанные DNM", duration: "по решению DNM" },
    { num: "ñ", titleRu: "Воссоединение семьи", titleEs: "reunificación familiar", summary: "Определённые законом супруги, родители и дети граждан или резидентов", duration: "до 3 лет или срока спонсора" },
  ],
  pmzhIntro:
    "DNM публикует отдельные критерии permanente. Для перехода по сроку temporaria сейчас указаны два года для граждан MERCOSUR и три года для остальных, с пребыванием в стране более половины разрешённого срока.",
  pmzhGrounds: [
    { num: "1", titleRu: "Срок temporaria", titleEs: "arraigo", summary: "2 года для MERCOSUR или 3 года для остальных; присутствие более 50% срока", duration: "по критерию DNM" },
    { num: "2", titleRu: "Ребёнок гражданина Аргентины", titleEs: "hijo de argentino", summary: "Семейный критерий, опубликованный DNM; решение не считается автоматическим", duration: "по решению DNM" },
    { num: "3", titleRu: "Дипломатическая служба", titleEs: "funcionario diplomático", summary: "По действующей карточке DNM и подтверждённому сроку", duration: "по решению DNM" },
    { num: "4", titleRu: "Признанный беженец", titleEs: "refugiado reconocido", summary: "При выполнении опубликованных DNM условий arraigo", duration: "по решению DNM" },
    { num: "5", titleRu: "Ребёнок аргентинца, рождённый за рубежом", titleEs: "hijo de argentino nacido en el exterior", summary: "Статья 22 Ley 25.871 относит к постоянным резидентам", duration: "по статье 22" },
  ],
  overviewHref: "/immigration/obzor-vnzh",
  overviewLabel: "Краткий обзор категорий",
  historyTitle: "Как менялись правила",
  historyIntro: "Для текущего решения важна действующая норма, а не дата старой статьи или форума.",
  history: [
    { period: "2004", title: "Ley 25.871", body: "Базовый закон о миграционных категориях и полномочиях DNM." },
    { period: "2022", title: "Disposición 758/2022", body: "Введена transitoria для цифровых кочевников: до 180 дней с одной возможной prórroga." },
    { period: "2025", title: "Decreto 366/2025", body: "Изменены precaria, permanente, reunificación familiar, въезд и натурализация." },
    { period: "17.07.2026", title: "Дата проверки", body: "Сверены актуальные тексты норм и страницы DNM; перед подачей нужна повторная проверка." },
  ],
  comparisonTitle: "Категории проживания",
  comparison: {
    headers: ["Категория", "Назначение", "Ключевая оговорка"],
    rows: [
      ["Transitoria", "Ограниченная цель и срок", "Обычно без DNI"],
      ["Temporaria", "Основание статьи 23", "До 3 лет, условия зависят от подкатегории"],
      ["Permanente", "Постоянное проживание", "Может быть отменено по статье 62"],
      ["Precaria", "Документ на период дела", "Не обещает одобрение и не считается стажем"],
    ],
  },
  statusComparisonTitle: "Права зависят от категории",
  statusComparison: {
    headers: ["Вопрос", "Как проверять"],
    rows: [
      ["Работа", "Только если статус и категория её разрешают; precaria разрешает работу прямо по закону"],
      ["DNI", "DNM указывает DNI для temporaria и permanente, но не для обычной transitoria"],
      ["Плановая медицина", "Проверять статус, юрисдикцию учреждения и страховку"],
      ["Выезд и возврат", "Проверять срок документа и правила конкретной категории"],
    ],
  },
  roadmapTitle: "Безопасный порядок действий",
  roadmapIntro: "План строится от официальной категории и документов, а не от обещанного результата.",
  roadmap: [
    { step: 1, title: "Определить цель", body: "Учёба, работа, семья, доход или другая законная причина." },
    { step: 2, title: "Найти карточку DNM", body: "Проверить категорию, требования, срок и допустимые действия." },
    { step: 3, title: "Подготовить документы", body: "С учётом апостиля, легализации и перевода, если они требуются." },
    { step: 4, title: "Подать через RADEX", body: "Начать radicación и выполнять официальные уведомления по делу." },
    { step: 5, title: "Контролировать статус", body: "Продлевать документы вовремя и учитывать лимиты отсутствия." },
  ],
  pathToCitizenshipTitle: "От проживания к гражданству",
  pathToCitizenship: [
    { step: 1, title: "Получить законный статус", body: "Precaria не входит в период натурализации." },
    { step: 2, title: "Соблюсти непрерывность", body: "Для натурализации нужны два года законного проживания без выездов непосредственно перед заявлением." },
    { step: 3, title: "Подать в DNM", body: "Использовать действующую цифровую процедуру гражданства." },
  ],
  wasNowTitle: "Что изменил Decreto 366/2025",
  wasNowIntro: "Ниже только изменения, подтверждённые официальным текстом декрета.",
  wasNow: [
    { topic: "Precaria", before: "Прежняя редакция статьи 20", after: "До 90 дней; работа и учёба разрешены, но стаж для permanente и гражданства не идёт" },
    { topic: "Семья", before: "Прежнее регулирование", after: "В статью 23 добавлена отдельная temporaria reunificación familiar (ñ)" },
    { topic: "Отсутствие", before: "Более мягкие сроки в старых материалах", after: "Отмена возможна при 6 месяцах для temporaria и 1 годе для permanente" },
    { topic: "Гражданство", before: "Старые судебные инструкции", after: "Два года без выездов; новые заявления принимает DNM" },
  ],
  documentsIntro: "Документы определяет конкретная карточка DNM. Универсальный список ниже — только контрольные группы.",
  documentsChecklist: [
    { emoji: "🛂", title: "Личность и законный въезд", description: "В форме, указанной DNM для выбранной категории.", required: true },
    { emoji: "📄", title: "Подтверждение основания", description: "Документ должен соответствовать выбранной подкатегории статьи 23.", required: true },
    { emoji: "🛡", title: "Antecedentes", description: "Страны, срок и форма справок зависят от официальных требований." },
    { emoji: "🏠", title: "Достоверный адрес", description: "Ложные сведения об адресе могут повлечь отказ или отмену статуса.", required: true },
  ],
  documentsNote: "Сначала откройте карточку trámite, затем заказывайте апостиль и перевод: требования различаются по категории.",
  pmzhDocumentsIntro: "Для permanente DNM отдельно проверяет применимый критерий и документы по нему.",
  pmzhDocumentsChecklist: [
    { emoji: "🪪", title: "Действующий статус", description: "Подтверждение текущей temporaria или другого применимого критерия.", required: true },
    { emoji: "📅", title: "Миграционная история", description: "Для перехода по сроку — 2/3 года и более 50% разрешённого периода в стране.", required: true },
    { emoji: "💰", title: "Средства к существованию", description: "Статья 22 после реформы требует подтверждения достаточных средств по регламенту.", required: true },
    { emoji: "🛡", title: "Отсутствие препятствий", description: "DNM проверяет основания для отказа и уголовную историю по действующим правилам.", required: true },
  ],
  renewalIntro: "DNM рекомендует подавать prórroga в установленное окно до окончания temporaria.",
  renewalSteps: [
    { step: 1, title: "Проверить дату", body: "Начать подготовку до открытия официального окна продления." },
    { step: 2, title: "Подтвердить основание", body: "Убедиться, что критерий сохраняется, и обновить запрошенные документы." },
    { step: 3, title: "Подать prórroga", body: "Официальная страница DNM указывает окно 60 дней до окончания." },
    { step: 4, title: "Не пропустить просрочку", body: "В первые 30 дней после окончания применяется надбавка 50%; затем право на обычное продление утрачивается." },
  ],
  renewalNotes: [
    "При смене основания выбирайте процедуру, которую указывает DNM, а не обычное продление по старой категории.",
    "Precaria можно продлевать только из Аргентины; DNM предлагает начинать за 15 дней до окончания.",
    "Приоритетный turno ускоряет получение записи, но не решение по заявлению.",
  ],
  absenceRulesIntro: "Статья 62 в редакции Decreto 366/2025 предусматривает отмену статуса при указанных сроках отсутствия, если нет законного исключения или разрешения DNM.",
  absenceRules: {
    headers: ["Статус", "Порог статьи 62", "Что делать"],
    rows: [
      ["Temporaria", "6 месяцев или более вне страны", "Заранее проверить исключение или запросить разрешение DNM"],
      ["Permanente", "1 год или более вне страны", "Заранее проверить исключение или запросить разрешение DNM"],
      ["Naturalización", "Любой выезд в двухлетний период", "Период перестаёт быть непрерывным"],
    ],
  },
  lossOfStatusIntro: "DNM применяет основания статьи 62 в установленной процедуре. Среди рисков:",
  lossOfStatus: [
    "Ложные сведения или поддельные документы.",
    "Утрата или несоблюдение условий миграционной категории.",
    "Длительное отсутствие без применимого исключения или разрешения.",
    "Иные прямо предусмотренные законом основания; последствия зависят от процедуры и обстоятельств дела.",
  ],
  costsIntro: "Пошлины меняются. Надёжная сумма — та, которую показывает актуальная процедура DNM в момент подачи.",
  costs: [
    { emoji: "💳", title: "Сбор DNM", description: "Проверяйте в RADEX или официальной карточке trámite.", required: true },
    { emoji: "🪪", title: "DNI", description: "Порядок и стоимость проверяйте по текущей инструкции DNM/RENAPER." },
    { emoji: "📄", title: "Апостиль и перевод", description: "Зависят от страны выдачи и состава пакета." },
    { emoji: "⚖️", title: "Профессиональная помощь", description: "Не обязательна по умолчанию; выбирайте специалиста с понятным договором и без гарантии результата." },
  ],
  costsNote: "Не используйте старые суммы в песо и не переводите деньги посреднику за «гарантированное одобрение».",
  typicalMistakesTitle: "Что чаще всего мешает",
  typicalMistakes: [
    "Выбирать категорию по чужому кейсу вместо своей цели и документов.",
    "Считать tourist или transitoria разрешением на любую оплачиваемую работу.",
    "Принимать precaria за уже одобренную residencia или стаж для permanente/гражданства.",
    "Заказывать справки и переводы до проверки текущей карточки trámite.",
    "Пропускать срок продления или лимит отсутствия.",
    "Верить фиксированному сроку решения или гарантии результата.",
  ],
  extendedFaq: [
    { question: "Сколько подкатегорий temporaria в статье 23?", answer: "После добавления reunificación familiar (ñ) статья 23 содержит 15 буквенных подкатегорий a–ñ. Это не означает 15 гарантированных путей: DNM проверяет соответствие и документы." },
    { question: "Что даёт precaria?", answer: "Действующая precaria разрешает пребывание, выезд и въезд, работу и учёбу. Она не гарантирует одобрение и не считается стажем для permanente или натурализации." },
    { question: "Когда подавать на продление temporaria?", answer: "DNM указывает окно 60 дней до окончания. В течение 30 дней после окончания действует надбавка 50%; позже право на обычное продление утрачивается." },
    { question: "Когда возможен переход на permanente по сроку?", answer: "DNM указывает 2 года temporaria для MERCOSUR и 3 года для остальных, при пребывании в стране более 50% разрешённого срока. Всегда проверяйте карточку своего критерия." },
    { question: "Когда статус отменяют из-за отсутствия?", answer: "Статья 62 указывает 6 месяцев или более для temporaria и 1 год или более для permanente, если нет применимого исключения или разрешения DNM." },
    { question: "Сколько длится рассмотрение?", answer: "Универсального срока нет. Приоритетная запись не ускоряет решение по существу." },
  ],
  crossLinks: [
    { title: "Процесс иммиграции", href: "/immigration/protsess-immigratsii", description: "RADEX, документы и precaria" },
    { title: "Гражданство", href: "/immigration/grazhdanstvo", description: "Два года без выездов и подача в DNM" },
    { title: "Роды в Аргентине", href: "/immigration/rody-v-argentine", description: "Гражданство ребёнка и отдельный статус родителей" },
    { title: "Обзор видов ВНЖ", href: "/immigration/obzor-vnzh", description: "Короткая версия критериев" },
  ],
  note: "Проверено 17.07.2026 по Ley 25.871, Decreto 366/2025 и официальным страницам DNM. Это справочный материал, а не решение по конкретному делу.",
};

export const IMMIGRATION_OPPORTUNITIES: ImmigrationOpportunitiesContent = {
  intro: "Подходящая категория зависит от реальной цели, гражданства, документов и планируемой деятельности. Начинайте с официального перечня DNM, а не с обещания «самого простого ВНЖ».",
  highlights: [
    { emoji: "💰", title: "Доход из-за рубежа", titleEs: "rentista", body: "Подходит только при соответствии происхождения и размера дохода действующим требованиям DNM.", href: "/immigration/obzor-vnzh", linkLabel: "Сверить категории" },
    { emoji: "💻", title: "Цифровой кочевник", titleEs: "nómada digital", body: "Отдельная transitoria по Disposición 758/2022: до 180 дней и одна возможная prórroga на такой же срок; это не temporaria." },
    { emoji: "👨‍💼", title: "Работа", titleEs: "trabajador migrante", body: "Категория и документы должны разрешать конкретную оплачиваемую деятельность." },
    { emoji: "🎓", title: "Учёба", titleEs: "estudiante", body: "Проверяйте признание учреждения и требования конкретной учебной процедуры DNM." },
    { emoji: "👨‍👩‍👧", title: "Семья", titleEs: "reunificación familiar", body: "Статья 23 ñ перечисляет допустимые родственные связи; решение и срок определяет DNM." },
    { emoji: "🌎", title: "Гражданство MERCOSUR", titleEs: "nacionalidad", body: "Применимость зависит от государства гражданства, перечисленного законом и действующими соглашениями." },
  ],
  alternatives: [
    { emoji: "🇧🇷", title: "Бразилия", body: "Сравнивайте только по официальным правилам Бразилии: миграция, налоги, медицина и семейные последствия — разные системы." },
    { emoji: "🇵🇾", title: "Парагвай", body: "Не переносите аргентинские основания и сроки на Парагвай; запросите актуальный официальный перечень требований." },
    { emoji: "🇺🇾", title: "Уругвай", body: "Сопоставьте реальный срок проживания, налоги и стоимость жизни по официальным источникам Уругвая." },
  ],
  diyTitle: "Самостоятельная подача",
  diyBody: "Подходит, если вы понимаете испанский, можете проверить официальные требования и готовы самостоятельно отвечать на уведомления DNM.",
  proTitle: "Проверка специалистом",
  proBody: "Для сложной истории поездок, отказа, судимости или семейного спора разумно получить индивидуальную консультацию. Никто не может гарантировать решение DNM.",
  contactsHref: "/contacts",
  contactsLabel: "Запросить контакты",
};

export const IMMIGRATION_USEFUL_LINKS: ImmigrationUsefulLinksContent = {
  intro: "Официальные страницы ниже проверены 17.07.2026. Перед подачей открывайте их заново: формы, сборы и регламенты меняются.",
  official: [
    { title: "DNM — категории residencia", href: "https://www.argentina.gob.ar/migraciones/residencias", description: "Transitoria, temporaria, permanente и переход к trámite" },
    { title: "DNM — вопросы по residencia", href: "https://www.argentina.gob.ar/migraciones/preguntas-frecuentes-residencias", description: "RADEX, permanente, prórroga, precaria и сборы" },
    { title: "RADEX", href: "https://www.migraciones.gob.ar/radex/", description: "Официальный старт заявлений о radicación" },
    { title: "Ley 25.871 — актуальный текст", href: "https://www.argentina.gob.ar/normativa/nacional/92016/actualizacion", description: "Миграционные категории, права и отмена статуса" },
    { title: "Decreto 366/2025", href: "https://www.argentina.gob.ar/normativa/nacional/decreto-366-2025-413297/texto", description: "Изменения въезда, precaria, residencia и гражданства" },
    { title: "Ley 346 — актуальный текст", href: "https://www.argentina.gob.ar/normativa/nacional/ley-346-48854/actualizacion", description: "Гражданство по рождению и натурализация" },
    { title: "DNM — цифровая подача на гражданство", href: "https://www.argentina.gob.ar/noticias/ahora-el-tramite-de-ciudadania-argentina-se-podra-hacer-de-forma-digital-en-migraciones", description: "Официальное сообщение от 06.10.2025" },
    { title: "Disposición 758/2022", href: "https://www.argentina.gob.ar/normativa/nacional/disposici%C3%B3n-758-2022-364601/texto", description: "Transitoria для цифровых кочевников" },
    { title: "RENAPER — DNI для иностранцев", href: "https://www.argentina.gob.ar/interior/dni/extranjeros", description: "Текущая процедура документа" },
  ],
  articles: [
    { title: "Визы для туристов", href: "/immigration/vizy-dlya-turistov", description: "Как проверить правила въезда" },
    { title: "Обзор видов ВНЖ", href: "/immigration/obzor-vnzh", description: "Категории без обещаний результата" },
    { title: "Документы для поездки", href: "/immigration/dokumenty-dlya-vyezda", description: "Контрольный список перед вылетом" },
    { title: "Продление туристического пребывания", href: "/immigration/prodlenie-turisticheskogo-vizita", description: "Официальная процедура вместо visa run" },
  ],
  related: [
    { title: "Как добраться", href: "/guide/kak-dobratsya#entry-docs", description: "Маршрут и проверка документов" },
    { title: "Экономика и деньги", href: "/guide/ekonomika-i-dengi", description: "Бюджет и расчёты" },
    { title: "Где жить", href: "/guide/gde-zhit", description: "Города, районы и аренда" },
    { title: "Путеводитель", href: "/guide", description: "Практические темы поездки и жизни" },
  ],
};
