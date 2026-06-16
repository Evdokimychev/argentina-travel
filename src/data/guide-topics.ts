import type { GuideTopicPage } from "@/types/guide-topic";

export const GUIDE_INDEX_INTRO =
  "Главная страница «Об Аргентине» — география и маршруты; 14 тем — практика, сервисы и туры. Каждый раздел — отправная точка перед бронированием на платформе.";

export const GUIDE_TOPICS: Record<string, GuideTopicPage> = {
  "kak-dobratsya": {
    id: "kak-dobratsya",
    slug: "kak-dobratsya",
    title: "Как добраться",
    shortDescription: "Перелёты, аэропорты и трансферы до отеля",
    intro:
      "Большинство международных рейсов прилетает в Буэнос-Айрес. Внутри страны удобны авиалинии Aerolíneas Argentinas, Flybondi и Jetsmart — расстояния огромные, перелёт экономит дни.",
    heroImage:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=80",
    sections: [
      {
        heading: "Международные аэропорты",
        body:
          "Ezeiza (EZE) — основной международный хаб в 35 км от центра Буэнос-Айреса. Aeroparque Jorge Newbery (AEP) принимает рейсы из соседних стран и часть внутренних маршрутов. В регионах: El Calafate (FTE), Bariloche (BRC), Ushuaia (USH), Mendoza (MDZ), Salta (SLA) — удобные точки для Патагонии, винодельни и северо-запада.",
      },
      {
        heading: "Типичные маршруты",
        body:
          "Из Европы и России чаще всего летят через Стамбул, Доху или Мадрид с одной пересадкой. Из США — прямые рейсы в EZE из Майами и Нью-Йорка. Заложите минимум 2–3 часа на стыковку при багаже и таможне.",
      },
      {
        heading: "Из аэропорта в город",
        body:
          "Из EZE: официальное такси (пре-оплата на стойке), приложения Cabify/ Uber или заранее заказанный трансфер. Автобус Tienda León идёт до Retiro, но с багажом после длинного перелёта удобнее трансфер. В EZE и AEP есть банкоматы и обмен — не меняйте всю сумму сразу, курс в городе часто лучше.",
      },
    ],
    serviceCards: [
      {
        title: "Сравнить авиабилеты",
        description: "Агрегатор маршрутов в Буэнос-Айрес и региональные хабы.",
        href: "/flights?origin=MOW&destination=BUE",
        ctaLabel: "Найти рейсы",
      },
      {
        title: "Заявка на подбор перелёта",
        description: "Менеджер поможет с датами и стыковками внутри Аргентины.",
        href: "/contacts?service=flight-request",
        ctaLabel: "Оставить заявку",
      },
      {
        title: "Трансфер из аэропорта EZE",
        description: "Встреча с табличкой, фиксированная цена до отеля.",
        href: "/contacts?service=airport-transfer",
        ctaLabel: "Заказать трансфер",
      },
    ],
    tourRecommendations: [
      { label: "Туры с трансфером из аэропорта", href: "/tours?query=Буэнос-Айрес" },
      { label: "Патагония с внутренним перелётом", href: "/tours?query=Патагония" },
    ],
    relatedArticles: [
      {
        label: "Документы для въезда",
        href: "/immigration/dokumenty-dlya-vyezda",
        description: "Список перед поездкой",
      },
      {
        label: "Экономика и деньги",
        href: "/guide/ekonomika-i-dengi",
        description: "Как платить и менять валюту",
      },
    ],
    relatedDestinations: [
      { label: "Буэнос-Айрес", href: "/destinations/ba" },
      { label: "Патагония", href: "/destinations/patagonia" },
    ],
  },
  "gde-zhit": {
    id: "gde-zhit",
    slug: "gde-zhit",
    title: "Где жить",
    shortDescription: "Отели, районы BA, аренда, Patagonia и регионы — полный справочник",
    intro:
      "Подробный путеводитель по жилью в Аргентине: типы размещения (отель, хостел, апартаменты, estancia), районы Буэнос-Айреса с таблицей сравнения, Патагония, Мендоса, Сальта, Игуасу и побережье, Booking и Airbnb, депозиты и garantía, сезонность, оплата картами и типичные ошибки — от короткой поездки до цифрового кочевника и долгого проживания.",
    heroImage:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80",
    sections: [
      {
        heading: "Типы жилья и платформы",
        body:
          "Отель — для 3–14 дней. Airbnb и апартаменты — неделя+. Estancia и lodge — Mendoza и Patagonia. Booking, Airbnb, туры на платформе — разная защита и гибкость отмены.",
      },
      {
        heading: "Буэнос-Айрес: районы",
        body:
          "Palermo, Recoleta, Belgrano — для первого визита и семей. San Telmo — атмосфера. La Boca и Once — не для ночёвки. Безопасность района — /guide/bezopasnost.",
      },
      {
        heading: "Регионы и долгий срок",
        body:
          "Patagonia — бронь за 2–3 месяца. Garantía — барьер для долгой аренды без резидентства. Nomad — monthly Airbnb в Palermo с проверкой Wi‑Fi. Оплата — /guide/ekonomika-i-dengi.",
      },
    ],
    serviceCards: [
      {
        title: "Туры с проживанием",
        description: "Авторские маршруты с отелями и лоджами от организаторов.",
        href: "/tours",
        ctaLabel: "Смотреть туры",
      },
      {
        title: "Консультация по маршруту",
        description: "Подскажем базы и сроки брони под ваш план.",
        href: "/contacts?topic=gde-zhit",
        ctaLabel: "Связаться",
      },
    ],
    tourRecommendations: [
      { label: "Туры с отелями в Патагонии", href: "/tours?query=Патагония" },
      { label: "Гастрономические туры с проживанием", href: "/tours?query=Мендоса" },
    ],
    relatedArticles: [
      {
        label: "Безопасность",
        href: "/guide/bezopasnost",
        description: "Районы BA и вещи",
      },
      {
        label: "Экономика и деньги",
        href: "/guide/ekonomika-i-dengi",
        description: "Карты и песо при брони",
      },
      {
        label: "Связь",
        href: "/guide/svyaz",
        description: "Wi‑Fi для кочевник",
      },
      {
        label: "Патагония: с чего начать",
        href: "/guide/patagoniya-s-chego-nachat",
        description: "Логистика и базы",
      },
    ],
    relatedDestinations: [
      { label: "Буэнос-Айрес", href: "/destinations/ba" },
      { label: "Патагония", href: "/destinations/patagonia" },
      { label: "Мендоса", href: "/destinations/mendoza" },
    ],
  },
  transport: {
    id: "transport",
    slug: "transport",
    title: "На чём передвигаться",
    shortDescription: "Авто, автобусы, перелёты и городской транспорт",
    intro:
      "Аргентина — страна больших расстояний. Внутренние перелёты экономят время, автобусы cama (лежачие места) комфортны на ночных маршрутах, аренда авто даёт свободу в винодельнях и на северо-западе.",
    heroImage:
      "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1920&q=80",
    sections: [
      {
        heading: "Внутренние перелёты",
        body:
          "Aerolíneas Argentinas, Flybondi, Jetsmart связывают Буэнос-Айрес с Калафате, Барилоче, Ушуайей, Мендосой, Сальтой. Багаж часто оплачивается отдельно у лоукостеров — проверяйте тариф. Бронируйте заранее в высокий сезон (декабрь–февраль).",
      },
      {
        heading: "Автобусы между городами",
        body:
          "Компании Andesmar, Flecha Bus, Via Bariloche — ночные рейсы с полулежачими или лежачими местами. Из BA в Bariloche ~20 часов, в Mendoza ~12. Билеты покупайте на сайтах компаний или в кассах на Retiro.",
      },
      {
        heading: "Аренда авто и город",
        body:
          "Аренда удобна в Мендосе, Salta и для объезда озёр Patagonia. Международные права + национальные. В BA метро (Subte), автобусы и Cabify. SUBE-карта для общественного транспорта — покупается в киосках.",
      },
    ],
    serviceCards: [
      {
        title: "Трансферы в Патагонии",
        description: "Эль-Калафате, El Chaltén, Барилоче — индивидуальные и групповые.",
        href: "/contacts?service=patagonia-transfer",
        ctaLabel: "Запросить трансфер",
      },
      {
        title: "Подбор внутренних перелётов",
        description: "Поможем связать города без лишних стыковок.",
        href: "/contacts?service=flight-request",
        ctaLabel: "Оставить заявку",
      },
    ],
    tourRecommendations: [
      { label: "Автотуры по Аргентине", href: "/tours?query=автотур" },
      { label: "Туры с трансферами", href: "/tours?query=трансфер" },
    ],
    relatedArticles: [
      {
        label: "Как добраться",
        href: "/guide/kak-dobratsya",
        description: "Аэропорты и международные рейсы",
      },
      {
        label: "Что взять в Патагонию",
        href: "/blog/patagonia-packing-list",
        description: "Снаряжение для дорог",
      },
    ],
    relatedDestinations: [
      { label: "Патагония", href: "/destinations/patagonia" },
      { label: "Мендоса", href: "/destinations/mendoza" },
    ],
  },
  "turistskie-regiony": {
    id: "turistskie-regiony",
    slug: "turistskie-regiony",
    title: "Туристические регионы",
    shortDescription: "Патагония, BA, северо-запад, водопады и винодельни",
    intro:
      "Аргентина делится на несколько «миров»: ледники и треккинг на юге, танго и гастрономия в столице, виноградники на западе, красные каньоны на северо-западе и мощь Игуасу на севере.",
    heroImage:
      "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1920&q=80",
    sections: [
      {
        heading: "Патагония и Огненная Земля",
        body:
          "Эль-Калафате и ледник Перито-Морено, El Chaltén и Fitz Roy, озёра Барилоче, Ушуайя — край света. Сезон — ноябрь–март. Идеально для треккинга, круизов и экспедиций.",
      },
      {
        heading: "Центр и столица",
        body:
          "Буэнос-Айрес — культура, asado, milonga. Мендоса — malbec и Андes. Кордова и озёра в центре страны менее туристичны, но интересны для второго визита.",
      },
      {
        heading: "Север: Salta и Iguazú",
        body:
          "Сальта, Кафаяте и Quebrada de Humahuaca — высокогорье и виноградники. Национальный парк Iguazú — водопады на границе с Бразилией; комбинируют с BA за 2–3 часа перелёта.",
      },
    ],
    serviceCards: [
      {
        title: "Все направления",
        description: "8 регионов с турами, сезонами и практическими советами.",
        href: "/destinations",
        ctaLabel: "Открыть каталог",
      },
    ],
    tourRecommendations: [
      { label: "Туры в Патагонию", href: "/tours?query=Патагония" },
      { label: "Туры в Буэнос-Айрес", href: "/tours?query=Буэнос-Айрес" },
      { label: "Винные туры", href: "/tours?query=Мендоса" },
    ],
    relatedArticles: [
      {
        label: "Патагония: с чего начать",
        href: "/guide/patagoniya-s-chego-nachat",
        description: "Маршруты и снаряжение",
      },
      {
        label: "Сезоны и климат",
        href: "/guide/sezony-i-klimat",
        description: "Когда ехать в каждый регион",
      },
      {
        label: "Что взять в Патагонию",
        href: "/blog/patagonia-packing-list",
        description: "Список вещей",
      },
    ],
    relatedDestinations: [
      { label: "Патагония", href: "/destinations/patagonia" },
      { label: "Буэнос-Айрес", href: "/destinations/ba" },
      { label: "Игуасу", href: "/destinations/iguazu" },
      { label: "Сальта", href: "/destinations/salta" },
    ],
  },
  dostoprimechatelnosti: {
    id: "dostoprimechatelnosti",
    slug: "dostoprimechatelnosti",
    title: "Достопримечательности",
    shortDescription: "Must-see: ледники, водопады, города и природные парки",
    intro:
      "Классика первой поездки: Перито-Морено, Iguazú Falls, район La Boca и Recoleta в BA, винодельни Mendoza, Quebrada de Humahuaca. Многие точки удобнее с гидом или в составе тура.",
    heroImage:
      "https://images.unsplash.com/photo-1589909202800-2f2e1b8a4b8e?w=1920&q=80",
    sections: [
      {
        heading: "Природные иконы",
        body:
          "Ледник Перито-Морено (El Calafate) — пешие смотровые и лодки. Iguazú — 275 водопадов, аргентинская и бразильская стороны. Fitz Roy и Cerro Torre — из El Chaltén. Пингвины на Peninsula Valdés (сентябрь–март).",
      },
      {
        heading: "Города и культура",
        body:
          "Caminito и La Boca, кладбище Recoleta, Teatro Colón, рынок San Telmo по воскресеньям. В Cordoba — Jesuit Block. В Salta — колониальная архитектура и Museo de Arqueología.",
      },
      {
        heading: "Как посещать",
        body:
          "В высокий сезон на Перито-Морено и Iguazú берите билеты онлайн заранее. Для треккинга в Chaltén не нужен гид, но погода меняется быстро. Экскурсии с русскоязычным гидом — через каталог туров на платформе.",
      },
    ],
    tourRecommendations: [
      { label: "Экскурсии к ледникам", href: "/tours?query=Перито-Морено" },
      { label: "Туры к водопадам Игуасу", href: "/tours?query=Игуасу" },
      { label: "Городские экскурсии BA", href: "/tours?query=Буэнос-Айрес" },
    ],
    relatedArticles: [
      {
        label: "Танго и культура BA",
        href: "/guide/tango-i-kultura-ba",
        description: "Milonga и районы",
      },
      {
        label: "Туристические регионы",
        href: "/guide/turistskie-regiony",
        description: "Где что находится",
      },
    ],
    relatedDestinations: [
      { label: "Патагония", href: "/destinations/patagonia" },
      { label: "Игуасу", href: "/destinations/iguazu" },
      { label: "Буэнос-Айрес", href: "/destinations/ba" },
    ],
  },
  "pogoda-i-sezonnost": {
    id: "pogoda-i-sezonnost",
    slug: "pogoda-i-sezonnost",
    title: "Погода и сезонность",
    shortDescription: "Когда ехать в Патагонию, BA и на север",
    intro:
      "Климат сильно различается по регионам. «Лучшее время» зависит от маршрута: Патагония — лето южного полушария, BA приятен круглый год, северо-запад комфортнее весной и осенью.",
    heroImage:
      "https://images.unsplash.com/photo-1483728642387-6bc3bd38dafc?w=1920&q=80",
    sections: [
      {
        heading: "Патагония",
        body:
          "Основной сезон — ноябрь–март: длинные дни, открыты тропы. Зима (июнь–август) — закрыты многие маршруты, но Барилоче привлекает лыжников. Ветер и дождь возможны в любой месяц — закладывайте запас по дням.",
      },
      {
        heading: "Буэнос-Айрес",
        body:
          "Лето (декабрь–февраль) жарко и влажно. Осень (март–май) — один из лучших периодов. Зима мягкая, +10…+18 °C. Весна зелёная и менее многолюдная.",
      },
      {
        heading: "Северо-запад и Iguazú",
        body:
          "Salta и Кафаяте — весна и осень, избегая летней жары на высоте. Iguazú: март–май и сентябрь–ноябрь — меньше дождей; летом водопады мощнее, но влажно.",
      },
    ],
    tourRecommendations: [
      { label: "Туры в высокий сезон", href: "/tours?query=Патагония" },
      { label: "Межсезонные маршруты", href: "/tours?query=Буэнос-Айрес" },
    ],
    relatedArticles: [
      {
        label: "Сезоны и климат в Аргентине",
        href: "/guide/sezony-i-klimat",
        description: "Подробный разбор по регионам",
      },
      {
        label: "Когда лучше ехать в Аргентину",
        href: "/blog/best-time-to-visit-argentina",
        description: "Статья в блоге",
      },
    ],
    relatedDestinations: [
      { label: "Патагония", href: "/destinations/patagonia" },
      { label: "Сальта", href: "/destinations/salta" },
    ],
  },
  yazyk: {
    id: "yazyk",
    slug: "yazyk",
    title: "Язык",
    shortDescription: "Испанский, местный акцент и базовые фразы",
    intro:
      "Официальный язык — испанский с характерным rioplatense-акцентом: «ll» и «y» звучат как «sh», используется voseo (vos вместо tú). В туристических зонах частично понимают английский, но базовый испанский сильно упрощает поездку.",
    heroImage:
      "https://images.unsplash.com/photo-1546410531-bb4caa6e4248?w=1920&q=80",
    sections: [
      {
        heading: "Особенности rioplatense",
        body:
          "В Буэнос-Айресе говорят быстро, с интонацией. «Che» — обращение, «boludo/a» — между друзьями (осторожно с незнакомцами). Lunfardo — сленг из tango-культуры, встречается в быту.",
      },
      {
        heading: "Фразы для туриста",
        body:
          "«¿Cuánto cuesta?» — сколько стоит. «La cuenta, por favor» — счёт. «¿Dónde está…?» — где находится. «Quisiera reservar» — хочу забронировать. «No hablo mucho español» — объяснит, что вам нужна помощь.",
      },
      {
        heading: "Английский и русский",
        body:
          "В отелях 3–4* и на популярных экскурсиях часто есть английский. Русскоязычные гиды — через авторские туры на платформе (фильтр по языку в каталоге). Для длительного пребывания стоит записаться на курсы.",
      },
    ],
    serviceCards: [
      {
        title: "Туры с русскоязычным гидом",
        description: "Фильтр по языку в каталоге авторских маршрутов.",
        href: "/tours",
        ctaLabel: "Найти тур",
      },
      {
        title: "Запрос на языковые курсы",
        description: "Подберём интенсив или разговорный клуб в BA.",
        href: "/contacts?service=language-courses",
        ctaLabel: "Связаться",
      },
    ],
    tourRecommendations: [
      { label: "Экскурсии на русском", href: "/tours?query=русский" },
      { label: "Гастрономические туры", href: "/tours?query=гастрономический" },
    ],
    relatedArticles: [
      {
        label: "Танго для начинающих",
        href: "/blog/tango-beginners-guide",
        description: "Milonga и этикет",
      },
      {
        label: "Культура",
        href: "/guide/kultura",
        description: "Традиции и быт",
      },
    ],
  },
  kultura: {
    id: "kultura",
    slug: "kultura",
    title: "Культура",
    shortDescription: "Танго, традиции, fútbol и повседневный этикет",
    intro:
      "Аргентинская культура — смесь европейских корней и латиноамерicanской идентичности. Танго, fútbol, mate, asado и поздние ужины формируют ритм жизни, который стоит учитывать в маршруте.",
    heroImage:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1920&q=80",
    sections: [
      {
        heading: "Танго и milonga",
        body:
          "Танго зародился в BA. Для туриста — шоу-ужины и живые milonga. Начните с урока, затем milonga de práctica. Кодекс cabeceo: приглашение кивком, серии танцев (tanda).",
      },
      {
        heading: "Mate и asado",
        body:
          "Mate — социальный ритуал: пьют из одной calabaza через bombilla, передавая по кругу. Отказ может обидеть — можно сказать «gracias» при передаче, если не хотите больше. Asado по воскресеньям — семейная традиция.",
      },
      {
        heading: "Этикет и время",
        body:
          "Ужин в 21:00–22:00 — норма. Siesta в провинции возможна. Приветствие — поцелуй в щёку (один раз). Fútbol — серьёзная тема; Boca vs River — не шутите с чужой командой.",
      },
    ],
    tourRecommendations: [
      { label: "Туры по Буэнос-Айресу", href: "/tours?query=Буэнос-Айрес" },
      { label: "Культурные маршруты", href: "/tours?query=культура" },
    ],
    relatedArticles: [
      {
        label: "Танго и культура Буэнос-Айреса",
        href: "/guide/tango-i-kultura-ba",
        description: "Milonga и районы",
      },
      {
        label: "Танго для начинающих",
        href: "/blog/tango-beginners-guide",
        description: "Первые шаги",
      },
      {
        label: "Гастрономия и asado",
        href: "/guide/gastronomiya-i-asado",
        description: "Культура parrilla",
      },
    ],
    relatedDestinations: [{ label: "Буэнос-Айрес", href: "/destinations/ba" }],
  },
  istoriya: {
    id: "istoriya",
    slug: "istoriya",
    title: "История",
    shortDescription: "От колонизации до современной Аргентины",
    intro:
      "Понимание истории помогает читать город: европейская застройка BA, память о Perón и Eva, Dirty War 1970–80-х, экономические кризисы — всё это видно в музеях, памятниках и разговорах с местными.",
    heroImage:
      "https://images.unsplash.com/photo-1555881400-74d7aca2598b?w=1920&q=80",
    sections: [
      {
        heading: "Ключевые вехи",
        body:
          "Колонизация испанцами, независимость 1816 года, волны иммиграции из Италии и Испании. XX век — подъём аграрного экспорта, перонизм, военные диктатуры, возвращение демократии в 1983 году.",
      },
      {
        heading: "Где почувствовать историю",
        body:
          "Casa Rosada и Plaza de Mayo, Museo Evita в Palermo, Recoleta Cemetery (могила Eva Perón), ESMA — мемориал Dirty War. В Cordoba — колониальный центр. В Salta — Museo de Arqueología de Alta Montaña (дети Llullaillaco).",
      },
      {
        heading: "Современный контекст",
        body:
          "Экономическая нестабильность и инфляция — часть повседневных разговоров. Уважайте чувствительные темы (военная диктатура, Falklands/Malvinas). Музеи и walking tours дают нейтральный контекст.",
      },
    ],
    tourRecommendations: [
      { label: "Исторические экскурсии BA", href: "/tours?query=Буэнос-Айрес" },
    ],
    relatedArticles: [
      {
        label: "Культура",
        href: "/guide/kultura",
        description: "Традиции и быт",
      },
      {
        label: "Гид по Буэнос-Айресу (PDF)",
        href: "/shop",
        description: "Районы и маршруты",
      },
    ],
    relatedDestinations: [{ label: "Буэнос-Айрес", href: "/destinations/ba" }],
  },
  kukhnya: {
    id: "kukhnya",
    slug: "kukhnya",
    title: "Кухня",
    shortDescription: "Asado, empanadas, вино и гастрономические маршруты",
    intro:
      "Аргентинская кухня — мясо мирового уровня, empanadas, dulce de leche и вина Mendoza. Asado — социальный ритуал; в BA десятки parrilla от neighborhood до Michelin-recommended.",
    heroImage:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1920&q=80",
    sections: [
      {
        heading: "Asado и parrilla",
        body:
          "Bife de chorizo, ojo de bife, vacío — классика. Chimichurri и malbec — стандартная пара. Бронируйте популярные parrilla (Don Julio, La Cabrera) за недели. Порции большие — делитесь.",
      },
      {
        heading: "Empanadas и уличная еда",
        body:
          "Empanadas tucumanas — с мясом, сыром, humita. Choripán — сосиска в булке с chimichurri. Helado — итальянское наследие, dulce de leche — must try.",
      },
      {
        heading: "Вино",
        body:
          "Malbec из Mendoza, Torrontés из Salta. Bodega-туры с дегустацией — полдня или день. В BA винные бары в Palermo предлагают flights по регионам.",
      },
    ],
    serviceCards: [
      {
        title: "Гастрономические туры",
        description: "Asado, bodega и рынки с гидом.",
        href: "/tours?query=гастрономический",
        ctaLabel: "Смотреть туры",
      },
      {
        title: "Гид по аргентинскому стейку",
        href: "/blog/argentinian-steak-guide",
        external: false,
        description: "Статья в блоге",
        ctaLabel: "Читать",
      },
    ],
    tourRecommendations: [
      { label: "Винные туры Mendoza", href: "/tours?query=Мендоса" },
      { label: "Гастрономия BA", href: "/tours?query=asado" },
    ],
    relatedArticles: [
      {
        label: "Гастрономия и asado",
        href: "/guide/gastronomiya-i-asado",
        description: "Отрубы и этикет",
      },
      {
        label: "Гид по аргентинскому стейку",
        href: "/blog/argentinian-steak-guide",
        description: "Parrilla и chimichurri",
      },
    ],
    relatedDestinations: [
      { label: "Буэнос-Айрес", href: "/destinations/ba" },
      { label: "Мендоса", href: "/destinations/mendoza" },
    ],
  },
  svyaz: {
    id: "svyaz",
    slug: "svyaz",
    title: "Связь",
    shortDescription: "SIM, eSIM, покрытие по регионам и связь на маршруте",
    intro:
      "Полный справочник по мобильной связи и интернету в Аргентине: операторы Claro/Personal/Movistar, eSIM, покрытие от BA до Patagonia, приложения для туриста, пополнение prepago и связь с гидами после бронирования тура.",
    heroImage:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=80",
    sections: [
      {
        heading: "Операторы и SIM",
        body:
          "Prepago по паспорту в EZE, centro BA и туристических городах. Claro и Personal — для Patagonia; сравните пакеты data перед покупкой.",
      },
      {
        heading: "eSIM и роуминг",
        body:
          "Airalo/Holafly — до вылета на 1–2 недели. Роуминг из РФ дорог на длинной поездке. Telegram и WhatsApp работают через mobile data.",
      },
      {
        heading: "Patagonia и offline",
        body:
          "В Calafate и Chaltén — 4G в поселках, на тропах — нет. Offline maps, power bank и контакт гида до выхода на маршрут обязательны.",
      },
    ],
    relatedArticles: [
      {
        label: "Как добраться",
        href: "/guide/kak-dobratsya",
        description: "EZE и первый день",
      },
      {
        label: "Экономика и деньги",
        href: "/guide/ekonomika-i-dengi",
        description: "Песо на SIM",
      },
      {
        label: "Безопасность",
        href: "/guide/bezopasnost",
        description: "Телефон и карманники",
      },
    ],
  },
  "ekonomika-i-dengi": {
    id: "ekonomika-i-dengi",
    slug: "ekonomika-i-dengi",
    title: "Экономика и деньги",
    shortDescription:
      "Подробное руководство: песо, синий и официальный курс, обмен, карты, банкоматы и деньги для эмигрантов",
    intro:
      "Аргентина живёт с несколькими курсами доллара одновременно: oficial, blue, MEP и tarjeta. От выбора способа оплаты зависит, насколько выгодно ваше путешествие или переезд. Этот гид — для туристов и будущих резидентов: курс, обмен, банкоматы, инфляция, счета и 20 ответов в FAQ.",
    features: { exchangeRates: true },
    heroImage:
      "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1920&q=80",
    sections: [
      {
        heading: "Валюта",
        body:
          "Официальная валюта — аргентинский песо (ARS). USD и EUR часто принимают в туристических местах, но курс может быть невыгодным. Банкоматы выдают песо с комиссией; лимиты и комиссии зависят от вашего банка.",
      },
      {
        heading: "Как платить туристу",
        body:
          "Карты Visa/Mastercard работают, но курс конвертации может быть официальным. Многие туристы меняют USD наличными в cueva (обменник) или через Western Union для лучшего курса — только проверенные точки, не на улице. Сохраняйте мелочь для чаевых и автобусов.",
      },
      {
        heading: "Инфляция и цены",
        body:
          "Цены в песо меняются быстро — перепроверяйте перед поездкой. Рестораны и отели для туристов часто указывают USD. На платформе туры в USD — прозрачная база для сравнения.",
      },
    ],
    serviceCards: [
      {
        title: "Консультация по обмену",
        description: "Актуальные схемы и безопасные точки обмена.",
        href: "/contacts?service=currency-exchange",
        ctaLabel: "Спросить менеджера",
      },
      {
        title: "Туры с оплатой в USD",
        description: "Прозрачные цены на платформе.",
        href: "/tours",
        ctaLabel: "Каталог туров",
      },
    ],
    relatedArticles: [
      {
        label: "Бронирование и оплата",
        href: "/guide/bronirovanie-i-oplata",
        description: "Как работает платформа",
      },
      {
        label: "Как добраться",
        href: "/guide/kak-dobratsya",
        description: "Обмен в аэропорту",
      },
      {
        label: "Безопасность",
        href: "/guide/bezopasnost",
        description: "Деньги и районы BA",
      },
      {
        label: "Визы для туристов",
        href: "/immigration/vizy-dlya-turistov",
        description: "Въезд и документы",
      },
      {
        label: "Обзор ВНЖ",
        href: "/immigration/obzor-vnzh",
        description: "Для планирующих переезд",
      },
    ],
  },
  shopping: {
    id: "shopping",
    slug: "shopping",
    title: "Шопинг",
    shortDescription: "Кожа, mate, вино и tax free",
    intro:
      "Из Аргентины везут кожаные изделия, mate и bombilla, вино (с ограничениями на таможне), dulce de leche, шерстяные poncho с севера. В BA — Palermo Soho и ferias; tax free для иностранцев в крупных магазинах.",
    heroImage:
      "https://images.unsplash.com/photo-1441986300917-64676bd600d8?w=1920&q=80",
    sections: [
      {
        heading: "Что купить",
        body:
          "Кожа: куртки, ремни, сумки — Murillo и Sur. Mate calabaza и bombilla — сувенир и практика. Вино malbec — в duty free или bodega (проверьте лимиты ввоза). Alpaca-шерсть и poncho — Salta и Humahuaca.",
      },
      {
        heading: "Где покупать",
        body:
          "Palermo Soho — бутики и дизайн. San Telmo feria — воскресный рынок антиквариата. Galerías Pacífico — классический mall. Аутлеты на outskirts дешевле, но нужен транспорт.",
      },
      {
        heading: "Tax free и таможня",
        body:
          "Global Blue и аналоги в partner-магазинах — возврат IVA при вывозе. Сохраняйте чеки. Лимиты на алкоголь и табак при вылете — уточняйте у авиакомпании.",
      },
    ],
    serviceCards: [
      {
        title: "Магазин гидов",
        description: "PDF-путеводители и списки для поездки.",
        href: "/shop",
        ctaLabel: "Открыть магазин",
      },
    ],
    tourRecommendations: [
      { label: "Шопинг-туры BA", href: "/tours?query=Буэнос-Айрес" },
    ],
    relatedArticles: [
      {
        label: "Кухня",
        href: "/guide/kukhnya",
        description: "Вино и dulce de leche",
      },
    ],
    relatedDestinations: [{ label: "Буэнос-Айрес", href: "/destinations/ba" }],
  },
  bezopasnost: {
    id: "bezopasnost",
    slug: "bezopasnost",
    title: "Безопасность",
    shortDescription: "Районы BA, кражи, транспорт, «что делать если» и страховка",
    intro:
      "Полный практический справочник: безопасные районы Buenos Aires, snatch theft и карманники, такси и Subte, деньги и ATM, Patagonia и нацпарки, экстренные номера и пошаговые действия при краже телефона или паспорта.",
    heroImage:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=80",
    sections: [
      {
        heading: "Буэнос-Айрес",
        body:
          "Palermo, Recoleta, Puerto Madero — спокойнее. La Boca — только Caminito днём. Телефон не у проезжей части. Cabify/Uber ночью.",
      },
      {
        heading: "Что делать при краже",
        body:
          "Блокировка телефона и карт → denuncia в полиции → consulate при потере паспорта → страховка. Копии документов — в облаке offline.",
      },
      {
        heading: "Patagonia и природа",
        body:
          "Главный риск — погода и тропы, не преступность. Iguazú — репеллент и нескользкая обувь. Страховка с треккингом обязательна.",
      },
    ],
    serviceCards: [
      {
        title: "Туристическая страховка",
        description: "Покрытие медицины и эвакуации.",
        href: "/insurance",
        ctaLabel: "Выбрать полис",
      },
      {
        title: "Помощь с выбором полиса",
        description: "Подскажем покрытие под ваш маршрут.",
        href: "/contacts?service=insurance-request",
        ctaLabel: "Консультация",
      },
    ],
    relatedArticles: [
      {
        label: "Экономика и деньги",
        href: "/guide/ekonomika-i-dengi",
        description: "Безопасный обмен",
      },
      {
        label: "Связь",
        href: "/guide/svyaz",
        description: "Блокировка SIM",
      },
      {
        label: "Транспорт",
        href: "/guide/transport",
        description: "Такси и авто",
      },
    ],
  },
};

export const GUIDE_TOPIC_LIST: GuideTopicPage[] = Object.values(GUIDE_TOPICS);

/** Stable order for index grid and navigation. */
export const GUIDE_TOPIC_ORDER: string[] = [
  "kak-dobratsya",
  "gde-zhit",
  "transport",
  "turistskie-regiony",
  "dostoprimechatelnosti",
  "pogoda-i-sezonnost",
  "yazyk",
  "kultura",
  "istoriya",
  "kukhnya",
  "svyaz",
  "ekonomika-i-dengi",
  "shopping",
  "bezopasnost",
];

export function getOrderedGuideTopics(): GuideTopicPage[] {
  return GUIDE_TOPIC_ORDER.map((slug) => GUIDE_TOPICS[slug]).filter(Boolean);
}
