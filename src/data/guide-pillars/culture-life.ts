import type { GuidePillarContent } from "@/types/guide-pillar";

const LANGUAGE_FAQ = [
  { question: "Какой язык в Аргентине?", answer: "Официальный — испанский с rioplatense-акцентом (BA и регион La Plata)." },
  { question: "Понимают ли английский?", answer: "В отелях 3–4* и на популярных экскурсиях — частично. В провинции — редко." },
  { question: "Что такое voseo?", answer: "Использование vos вместо tú: «¿Vos hablás inglés?» — норма в Аргентине." },
  { question: "Как сказать «сколько стоит»?", answer: "«¿Cuánto cuesta?» или «¿Cuánto sale?»" },
  { question: "Нужен ли русскоязычный гид?", answer: "Для глубокого погружения — да. На платформе фильтр туров с русским языком." },
  { question: "Где учить испанский в BA?", answer: "Языковые школы в Palermo и Recoleta — интенсивы от недели. Заявка через контакты." },
  { question: "Что значит «che»?", answer: "Обращение вроде «эй» или «слушай», дружелюбное." },
  { question: "Путают ли с испанским из Испании?", answer: "Лексика отличается: colectivo (автобус), palta (авокадо), computadora (компьютер)." },
  { question: "Работают ли переводчики offline?", answer: "Google Translate offline полезен. Скачайте испанский пакет до поездки." },
  { question: "Как заказать счёт в ресторане?", answer: "«La cuenta, por favor» — универсально." },
  { question: "Есть ли португальский на границе с Бrazil?", answer: "В Puerto Iguazú и при границе — иногда, но испанский основной." },
  { question: "Помогает ли английский в Mendoza?", answer: "В bodega для туристов — часто да. В локальных parrilla — лучше базовый испанский." },
];

export const YAZYK_PILLAR: GuidePillarContent = {
  heroSubtitle:
    "Испанский rioplatense, базовые фразы и когда нужен русскоязычный гид — для туристов и будущих резидентов",
  heroCtas: [
    { label: "Туры с русским гидом", href: "/tours?query=русский", variant: "primary" },
    { label: "Базовые фразы", href: "#yazyk-2", variant: "secondary" },
    { label: "Задать вопрос", href: "/contacts?topic=yazyk", variant: "tertiary" },
  ],
  quickFacts: [
    { label: "Язык", headline: "Испанский rioplatense", detail: "Акцент BA и La Plata — быстрая речь, voseo" },
    { label: "Особенность", headline: "Voseo, «sh» в ll/y", detail: "«¿Vos hablás inglés?» — норма, не ошибка" },
    { label: "Английский", headline: "Частично в туристических зонах", detail: "Отели 3–4*; в провинции — почти не говорят" },
    { label: "Must-know", headline: "¿Cuánto cuesta?", detail: "La cuenta, por favor — счёт и цена" },
    { label: "Русский гид", headline: "Туры на платформе", detail: "Фильтр по языку — для глубокого погружения" },
    { label: "Курсы в BA", headline: "Интенсив от 1 недели", detail: "Palermo, Recoleta — заявка через контакты" },
  ],
  sections: [
    { id: "yazyk-1", title: "Особенности rioplatense", content: "Быстрая речь, voseo, lunfardo. «Che» — дружеское обращение." },
    { id: "yazyk-2", title: "Фразы для туриста", content: "Счёт, цена, направление, бронирование — минимум для самостоятельной поездки." },
    { id: "yazyk-3", title: "Английский и русский", content: "Отели и экскурсии — английский. Русскоязычные гиды — через платформу." },
    { id: "yazyk-4", title: "Приложения и offline", content: "Google Translate, Duolingo — подготовка до поездки." },
    { id: "yazyk-5", title: "Язык для эмиграции", content: "Для резидентства и работы — B1+ испанский. DELE не обязателен, но курсы ускоряют адаптацию." },
  ],
  faq: LANGUAGE_FAQ,
  blogLinks: [
    { title: "Танго для начинающих", href: "/blog/tango-beginners-guide", description: "Milonga и этикет" },
    { title: "Культура", href: "/guide/kultura", description: "Традиции и быт" },
  ],
  partnerServices: [
    { title: "Туры с русскоязычным гидом", description: "Фильтр по языку в каталоге.", href: "/tours", ctaLabel: "Найти тур" },
    { title: "Языковые курсы", description: "Интенсив или разговорный клуб в BA.", href: "/contacts?service=language-courses", ctaLabel: "Связаться" },
  ],
};

const CULTURE_FAQ = [
  { question: "Во сколько ужинать в BA?", answer: "21:00–22:00 — норма. Рестораны открываются к 20:00, пик — после 21:30." },
  { question: "Что такое mate?", answer: "Социальный ритуал: yerba mate в calabaza, пьют через bombilla по кругу." },
  { question: "Как отказаться от mate?", answer: "Скажите «gracias» при передаче calabaza — значит «хватит»." },
  { question: "Нужно ли знать танго?", answer: "Нет, но один урок и milonga de práctica — лучший культурный опыт." },
  { question: "Что такое asado?", answer: "Барbecue-ритуал по воскресеньям — семья, мясо, вино. Длится часами." },
  { question: "Как здороваться?", answer: "Поцелуй в щёку один раз — даже при первой встрече (m/f)." },
  { question: "Можно ли фотографировать в milonga?", answer: "Спросите разрешения — flash запрещён, уважайте танцоров." },
  { question: "Насколько важен футбол?", answer: "Очень. Boca vs River — не шутите с чужой командой." },
  { question: "Есть ли siesta?", answer: "В провинции — да, магазины могут закрываться днём. В BA — реже." },
  { question: "Что такое feria?", answer: "Уличный рынок: San Telmo по воскресеньям — антиквариат и сувениры." },
  { question: "Дресс-код в parrilla?", answer: "Casual smart. В топ parrilla — не пляжная одежда." },
  { question: "Темы, которых избегают?", answer: "Dirty War, Falklands/Malvinas — деликатно с незнакомцами." },
];

export const KULTURA_PILLAR: GuidePillarContent = {
  heroSubtitle:
    "Танго, mate, asado и повседневный этикет — как не чувствовать себя чужим в ритме аргентинской жизни",
  heroCtas: [
    { label: "Культурные туры", href: "/tours?query=культура", variant: "primary" },
    { label: "Танго", href: "#kultura-1", variant: "secondary" },
    { label: "Задать вопрос", href: "/contacts?topic=kultura", variant: "tertiary" },
  ],
  quickFacts: [
    { label: "Ужин", headline: "С 21:00 — норма", detail: "Рестораны открываются к 20:00, пик после 21:30" },
    { label: "Mate", headline: "Социальный ритуал", detail: "Один calabaza на круг; «gracias» = больше не наливать" },
    { label: "Приветствие", headline: "Поцелуй в щёку ×1", detail: "Даже при первой встрече — m/f" },
    { label: "Танго", headline: "Milonga, cabeceo", detail: "Приглашение кивком; flash на танцполе — нельзя" },
    { label: "Asado", headline: "Воскресный ритуал", detail: "Медленный огонь, семья, часы за столом" },
    { label: "Fútbol", headline: "Boca, River, Racing", detail: "Не шутите с чужой командой" },
  ],
  sections: [
    { id: "kultura-1", title: "Танго и milonga", content: "Шоу-ужины для туристов, живые milonga для погружения. Cabeceo — приглашение кивком." },
    { id: "kultura-2", title: "Mate и asado", content: "Mate — круг, bombilla, yerba. Asado — медленный огонь и sociedad." },
    { id: "kultura-3", title: "Этикет и время", content: "Поздние ужины, поцелуй при встрече, уважение к фútbol." },
    { id: "kultura-4", title: "Ferias и calle", content: "San Telmo, Mataderos — рынки и уличная культура." },
    { id: "kultura-5", title: "Культура для детей", content: "Planetario, Museo de los Niños, парки Palermo — семейный BA." },
  ],
  faq: CULTURE_FAQ,
  blogLinks: [
    { title: "Танго и культура BA", href: "/guide/tango-i-kultura-ba", description: "Milonga и районы" },
    { title: "Танго для начинающих", href: "/blog/tango-beginners-guide", description: "Первые шаги" },
  ],
  partnerServices: [
    { title: "Туры по Буэнос-Айресу", description: "Milonga, San Telmo, культурные маршруты.", href: "/tours?query=Буэнос-Айрес", ctaLabel: "Каталог" },
    { title: "PDF-путеводитель BA", description: "Районы и маршруты в магазине.", href: "/shop", ctaLabel: "Открыть" },
  ],
};

const HISTORY_FAQ = [
  { question: "Когда независимость Аргентины?", answer: "1816 год — декларация независимости от Испании." },
  { question: "Кто такие Perón и Eva?", answer: "Juan Perón — президент 1940–50-х, Eva (Evita) — культовая первая леди, социальные программы." },
  { question: "Что такое Dirty War?", answer: "1976–1983 — военная диктатура, исчезновения. ESMA — мемориал в BA." },
  { question: "Где могила Evita?", answer: "Recoleta Cemetery — одна из главных точек BA." },
  { question: "Можно ли обсуждать Falklands?", answer: "Тема чувствительная (Malvinas). С местными — осторожно, в музеях — нейтральный контекст." },
  { question: "Что посмотреть из истории за 1 день?", answer: "Plaza de Mayo, Casa Rosada (экскурсия), Recoleta Cemetery, Museo Evita." },
  { question: "Влияние иммиграции?", answer: "Итальянцы и испанцы — основа BA. Кухня, язык, архитектура — европейские корни." },
  { question: "Почему инфляция в разговорах?", answer: "Экономические кризисы XX–XXI века — часть коллективной памяти и повседневности." },
  { question: "Что такое Casa Rosada?", answer: "Резиденция президента на Plaza de Mayo — розовый центр политической истории." },
  { question: "Есть ли walking tours по истории?", answer: "Да, в BA и через авторские туры на платформе." },
  { question: "Museo de Arqueología Salta?", answer: "Дети Llullaillaco — этично спорная, но важная экспозиция инкской культуры." },
  { question: "Как история связана с иммиграцией сегодня?", answer: "Современная Аргентина открыта иммигрантам — см. раздел /immigration." },
];

export const ISTORIYA_PILLAR: GuidePillarContent = {
  heroSubtitle:
    "От колонизации до Perón и современности — ключевые вехи, которые помогают понять страну и её людей",
  heroCtas: [
    { label: "Экскурсии BA", href: "/tours?query=Буэнос-Айрес", variant: "primary" },
    { label: "Ключевые вехи", href: "#istoriya-1", variant: "secondary" },
    { label: "Задать вопрос", href: "/contacts?topic=istoriya", variant: "tertiary" },
  ],
  quickFacts: [
    { label: "Независимость", headline: "1816 год", detail: "Декларация независимости от Испании" },
    { label: "Perón / Evita", headline: "1940–50-е", detail: "Культурный и политический след до сих пор" },
    { label: "Демократия с", headline: "1983", detail: "После военной диктатуры — возвращение гражданских прав" },
    { label: "Must-see", headline: "Plaza de Mayo, Recoleta", detail: "Casa Rosada и могила Evita — за один день" },
    { label: "Мемориал", headline: "ESMA", detail: "Dirty War 1976–1983 — важный контекст страны" },
    { label: "Иммиграция", headline: "Италия, Испания", detail: "Европейские корни BA — кухня, язык, архитектура" },
  ],
  sections: [
    { id: "istoriya-1", title: "Ключевые вехи", content: "Колонизация, независимость, иммиграция, перonизм, диктатуры, возвращение демократии." },
    { id: "istoriya-2", title: "Где почувствовать историю", content: "Casa Rosada, Museo Evita, Recoleta, ESMA, Cordoba Jesuit Block." },
    { id: "istoriya-3", title: "Современный контекст", content: "Экономика, инфляция, Malvinas — уважайте чувствительные темы." },
    { id: "istoriya-4", title: "Музеи и маршруты", content: "MALBA — искусство. Museo Nacional de Historia." },
    { id: "istoriya-5", title: "История и иммиграция", content: "Связь прошлого с современной миграционной политикой — /immigration." },
  ],
  faq: HISTORY_FAQ,
  blogLinks: [
    { title: "Культура", href: "/guide/kultura", description: "Традиции и быт" },
    { title: "PDF-путеводитель BA", href: "/shop", description: "Районы и маршруты" },
  ],
  partnerServices: [
    { title: "Исторические экскурсии BA", description: "Walking tours с гидом.", href: "/tours?query=Буэнос-Айрес", ctaLabel: "Смотреть туры" },
    { title: "Иммиграция", description: "Контекст для длительного пребывания.", href: "/immigration", ctaLabel: "Раздел" },
  ],
};

const KUHNYA_FAQ = [
  { question: "Что такое asado?", answer: "Барbecue на дровах: vacío, chorizo, morcilla — социальный ритуал." },
  { question: "Какие стейки заказывать?", answer: "Bife de chorizo, ojo de bife — классика. Порции большие — делитесь." },
  { question: "Что такое empanada?", answer: "Пирожок с мясом, сыром, humita — региональные вариации (Tucumán, Salta)." },
  { question: "Нужно ли бронировать Don Julio?", answer: "Да, за недели. Альтернативы — La Cabrera, El Preferido de Palermo." },
  { question: "Что такое chimichurri?", answer: "Соус из петрушки, чеснока, масла — к мясу и choripán." },
  { question: "Какое вино выбрать?", answer: "Malbec Mendoza — универсальный старт. Torrontés Salta — белое." },
  { question: "Что такое dulce de leche?", answer: "Карамельная паста — в десертах, alfajores, helado." },
  { question: "Есть ли вегетарианские опции?", answer: "В BA растёт выбор. В parrilla — ограниченно, ищите veggie-рестораны Palermo." },
  { question: "Сколько чаевых в ресторане?", answer: "10% принято, иногда включено «servicio» — проверяйте чек." },
  { question: "Что такое bodega tour?", answer: "Экскурсия на винодельню с дегустацией — полдня или день в Mendoza/Salta." },
  { question: "Безопасно ли street food?", answer: "Choripán на рынках — да, при свежей готовке. Смотрите очередь местных." },
  { question: "Можно ли привезти вино домой?", answer: "Проверьте лимиты таможни вашей страны. Duty free — часто проще." },
];

export const KUHNYA_PILLAR: GuidePillarContent = {
  heroSubtitle:
    "Asado, empanadas, malbec и гастрономические маршруты — как есть и пить как местные (и где бронировать)",
  heroCtas: [
    { label: "Гастрономические туры", href: "/tours?query=гастрономический", variant: "primary" },
    { label: "Asado", href: "#kukhnya-1", variant: "secondary" },
    { label: "Задать вопрос", href: "/contacts?topic=kukhnya", variant: "tertiary" },
  ],
  quickFacts: [
    { label: "Must-try", headline: "Asado, empanada", detail: "Dulce de leche — в десертах и alfajores" },
    { label: "Вино", headline: "Malbec, Torrontés", detail: "Mendoza — красное; Salta — белое на высоте" },
    { label: "Ужин", headline: "С 21:00", detail: "Топ parrilla — бронь за несколько дней" },
    { label: "Chimichurri", headline: "Соус к мясу", detail: "Петрушка, чеснок, масло — к asado и choripán" },
    { label: "Helado", headline: "Итальянское наследие", detail: "Порции большие — на двоих достаточно" },
    { label: "Bodega tour", headline: "Полдня–день", detail: "Mendoza или Salta — дегустация с трансфером" },
  ],
  sections: [
    { id: "kukhnya-1", title: "Asado и parrilla", content: "От neighborhood grill до Don Julio. Бронь заранее, порции на двоих." },
    { id: "kukhnya-2", title: "Empanadas и street food", content: "Choripán, empanadas tucumanas, helado." },
    { id: "kukhnya-3", title: "Вино и bodega", content: "Mendoza, Salta — туры с дегустацией. Винные бары Palermo." },
    { id: "kukhnya-4", title: "Рынки и mercado", content: "Mercado de San Telmo, Mercado de Sur — локальные продукты." },
    { id: "kukhnya-5", title: "Бюджет и чаевые", content: "Обед от $15 USD, parrilla $30–60. Чаевые 10%." },
  ],
  faq: KUHNYA_FAQ,
  blogLinks: [
    { title: "Гастрономия и asado", href: "/guide/gastronomiya-i-asado", description: "Отрубы и этикет" },
    { title: "Гид по аргентинскому стейку", href: "/blog/argentinian-steak-guide", description: "Parrilla и chimichurri" },
  ],
  partnerServices: [
    { softIntro: "Хотите asado с гидом?", title: "Гастрономические туры", description: "Asado, bodega, рынки.", href: "/tours?query=гастрономический", ctaLabel: "Смотреть туры" },
    { title: "Винные туры Mendoza", description: "Bodega с трансфером.", href: "/tours?query=Мендоса", ctaLabel: "Каталог" },
  ],
};
