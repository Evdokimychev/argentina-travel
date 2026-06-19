import type { PlaceFaqItem } from "@/types/place";

export type PlaceEnrichment = {
  history?: string;
  interestingFacts?: string[];
  howToGetThere?: string;
  nearbyHighlights?: string[];
  faq?: PlaceFaqItem[];
};

export const PLACE_ENRICHMENTS: Record<string, PlaceEnrichment> = {
  "buenos-aires": {
    history:
      "Буэнос-Айрес основан в 1580 году на втором заходе — первое поселение у устья реки не выдержало конфликтов с коренным населением. Город рос как порт и торговый центр испанской короны, а после независимости (1816) стал политической и культурной столицей. Волны европейской иммиграции конца XIX — начала XX века сформировали архитектуру, кухню и характер porteños.",
    interestingFacts: [
      "Буэнос-Айрес — один из немногих мегаполисов мира с собственным диалектом испанского (rioplatense) и характерным произношением «sh» вместо «y».",
      "Район La Boca с домами из corrugated iron окрашивали остатками корабельной краски — отсюда традиция ярких фасадов.",
      "Кладбище Recoleta — не только некрополь, но и музей под открытым небом с мраморными склепами семей аристократии.",
    ],
    howToGetThere:
      "Международный аэропорт Ezeiza (EZE) — основные рейсы из Европы и других континентов; Aeroparque Jorge Newbery (AEP) — внутренние и некоторые региональные. Из аэропорта: такси/remis с фиксированным тарифом, приложения Cabify/Uber, автобус Tienda León до Retiro. Между EZE и AEP — около 1 часа на такси.",
    nearbyHighlights: [
      "Колония del Sacramento (Уругвай) — паром или быстрый переезд на день",
      "Tigre и дельта Paraná — полдня на поезде из Retiro",
      "Estancia в провинции Buenos Aires — asado и лошади",
    ],
    faq: [
      {
        question: "Сколько дней нужно на Буэнос-Айрес?",
        answer:
          "Минимум 3 полных дня для центра, San Telmo, Recoleta и Palermo. 5–7 дней — если добавить музеи, вечерние milongas и однодневные поездки в Tigre или Colonia.",
      },
      {
        question: "Безопасно ли гулять по городу?",
        answer:
          "В туристических районах днём — да, с обычной осторожностью. Избегайте демонстраций, не носите всё наличное, вечером в незнакомых кварталах лучше такси. Подробнее — в разделе путеводителя «Безопасность».",
      },
      {
        question: "Какой район выбрать для проживания?",
        answer:
          "Palermo — рестораны и парки; Recoleta — классика и музеи; San Telmo — атмосфера и антиквариат; Centro — бюджетнее, но шумнее. Для первого визита часто выбирают Palermo или Recoleta.",
      },
    ],
  },
  "perito-moreno-glacier": {
    history:
      "Ледник назван в честь исследователя Патагонии Франсиско Морено (Francisco Moreno), который в конце XIX века способствовал закреплению аргентинских границ в регионе. С 1937 года ледник и окрестности входят в национальный парк Los Glaciares — один из первых парков страны и объект ЮНЕСКО с 1981 года.",
    interestingFacts: [
      "Ледник Perito Moreno — одно из немногих ледяных тел в мире, остающихся в равновесии, тогда как большинство ледников Патагонии отступают.",
      "Фронт ледника высотой до 70 м периодически «перекрывает» южное плечо Lago Argentino — вода в заливе Rico поднимается и прорывает лёд с грохотом.",
      "Walkways (pasarelas) позволяют обойти ледник с нескольких уровней без специального снаряжения.",
    ],
    howToGetThere:
      "Из Эль-Калафате — 80 км по RP11 (Ruta Provincial 11), автобусы и экскурсии от всех туроператоров (45–90 мин). Вход в парк оплачивается отдельно; билеты на pasarelas — у кассы или онлайн. Mini-Trekking и Big Ice бронируют заранее в сезон.",
    nearbyHighlights: [
      "Эль-Калафате — база, рестораны и вид на Lago Argentino",
      "Круизы к ледникам Upsala и Spegazzini с порта Punta Bandera",
      "Национальный парк Los Glaciares — треккинг в El Chaltén",
    ],
    faq: [
      {
        question: "Когда лучше ехать?",
        answer:
          "Октябрь–апрель — тёплее и больше рейсов. Летом (декабрь–февраль) больше туристов; весна и осень — меньше очередей и мягкий свет для фото.",
      },
      {
        question: "Нужна ли специальная обувь для pasarelas?",
        answer:
          "Нет — обычная удобная обувь с нескользкой подошвой. Для Mini-Trekking организатор выдаёт кошки.",
      },
      {
        question: "Можно ли увидеть обрушение льда?",
        answer:
          "Да, calving происходит регулярно. Для «перелива» через ледяную дамбу нужна удача — обычно раз в несколько лет, но следят новости парка.",
      },
    ],
  },
  "iguazu-falls": {
    history:
      "Водопады известны коренным народам гуарани как «большая вода» (Iguazú). Считается, что первым из европейцев их увидел испанский конкистадор Альвар Нуньес Кабеса де Вака (Álvar Núñez Cabeza de Vaca) около 1542 года — он назвал их Saltos de Santa María; массовый туризм начался после создания национальных парков в XX веке. С 1984 года аргентинская часть — объект ЮНЕСКО.",
    interestingFacts: [
      "275 отдельных каскадов на ширине около 2,7 км — один из крупнейших водопадных комплексов мира.",
      "Garganta del Diablo («Глотка Дьявола») — U-образный разлом, куда сходится половина речного потока.",
      "На территории парка живут коати (coatis) — не кормите их и держите рюкзаки закрытыми.",
    ],
    howToGetThere:
      "Аэропорт IGR (Puerto Iguazú) — рейсы из Buenos Aires (AEP/EZE). Из города — автобус или такси до парка (~20 км). Маршрут «нижние + верхние тропы + поезд к Garganta del Diablo» занимает полный день. Бразильская сторона (Foz) — отдельный въезд; нужен загранпаспорт, а визовые правила Бразилии для граждан РФ уточняйте перед поездкой.",
    nearbyHighlights: [
      "Itaipú — одна из крупнейших ГЭС мира (экскурсии с бразильской или аргентинской стороны)",
      "Wanda — копи полудрагоценных камней на дороге из Posadas",
      "Стык трёх границ — Аргентины, Бразилии и Парагвая",
    ],
    faq: [
      {
        question: "Аргентинская или бразильская сторона?",
        answer:
          "Аргентинская — больше троп и близкий контакт с водой; бразильская — панорама всего комплекса. Идеально посетить обе: возьмите загранпаспорт, а визовые правила Бразилии для граждан РФ уточняйте перед поездкой.",
      },
      {
        question: "Сколько времени закладывать?",
        answer:
          "Минимум 1 полный день на аргентинскую часть. Второй день — Бразилия или повтор в парк в другое время суток после дождя (максимальный поток).",
      },
      {
        question: "Когда больше воды?",
        answer:
          "После дождей (обычно ноябрь–март) — мощнее, но может быть закрыт доступ к некоторым тропам. Сухой сезон — комфортнее для прогулок.",
      },
    ],
  },
  "fitz-roy": {
    history:
      "Гора Cerro Fitz Roy (Chaltén) названа в честь капитана HMS Beagle Robert FitzRoy, чья экспедиция описала Patagonia в 1830-х. Для народа tehuelche Chaltén — «курящая гора» из-за облаков на вершине. Первая восходящая — Lionel Terray и команда, 1952 год.",
    interestingFacts: [
      "Высота 3405 м — относительно невысокая, но экстремальная из-за ветра, погоды и технической сложности.",
      "Laguna de los Tres — классическая точка с отражением Fitz Roy; подъём последнего километра крутой.",
      "Погода меняется за минуты — слои одежды и ранний старт обязательны.",
    ],
    howToGetThere:
      "База — El Chaltén (автобус из El Calafate ~3 ч или свой транспорт). Трек к Laguna de los Tres — 8–10 ч туда-обратно от посёлка, без ночёвки. Для менее опытных — Laguna Capri или Mirador de los Cóndores.",
    nearbyHighlights: [
      "Laguna Torre — вид на Cerro Torre",
      "El Chaltén — craft beer и горные гиды",
      "Lago del Desierto — севернее, менее людно",
    ],
    faq: [
      {
        question: "Нужен ли гид?",
        answer:
          "Для дневных треков к Laguna de los Tres — нет, тропы маркированы. Для восхождений на вершину — только с сертифицированным гидом и альпинистским опытом.",
      },
      {
        question: "Когда вероятнее увидеть вершину?",
        answer:
          "Раннее утро и сухой сезон (ноябрь–март). Облака часто закрывают Fitz Roy после полудня.",
      },
    ],
  },
  "el-chalten": {
    history:
      "Посёлок основан в 1985 году для закрепления аргентинского присутствия в спорном районе с Chile. Сегодня это туристическая столица треккинга Patagonia с развитой инфраструктурой refugios, hostels и проката снаряжения.",
    interestingFacts: [
      "El Chaltén — один из немногих посёлков, где можно выйти из hostal и через час оказаться у подножия 3000-метровых пиков.",
      "Бесплатные тропы национального парка начинаются от края посёлка.",
      "Зимой (июнь–август) часть троп закрыта или требует снегоступов.",
    ],
    howToGetThere:
      "Автобус из El Calafate (ежедневно в сезон) или из Bariloche через Ruta 40 (долго, живописно). Ближайший аэропорт — FTE (Calafate). Из Chaltén до Fitz Roy — пешком по тропам.",
    nearbyHighlights: [
      "Fitz Roy и Laguna de los Tres",
      "Glaciar Viedma — boat tours с Estancia",
      "Reserva Los Huemules — частные тропы",
    ],
    faq: [
      {
        question: "Сколько дней остановиться?",
        answer:
          "3–4 дня: один день Fitz Roy, один Torre, один запасной из-за погоды. 5+ — multi-day treks или Viedma.",
      },
    ],
  },
  "los-glaciares-national-park": {
    history:
      "Создан в 1937 году для охраны ледников Patagonia и лесов lenga. С 1981 года — объект Всемирного наследия UNESCO. Площадь более 7000 км² — один из крупнейших парков Аргентины, объединяющий зоны Perito Moreno и El Chaltén.",
    interestingFacts: [
      "Парк содержит 47 крупных ледников, из которых Perito Moreno — самый доступный.",
      "Южная Patagonian Ice Field — третье по величине ледяное поле вне полярных регионов.",
      "В зоне Chaltén действуют правила дикого кемпинга — нельзя разводить огонь вне designated sites.",
    ],
    howToGetThere:
      "Две «входные» зоны: El Calafate (Perito Moreno, круизы) и El Chaltén (треккинг). Единый билет в парк; при переезде между зонами сохраняйте квитанцию.",
    nearbyHighlights: [
      "Perito Moreno и El Calafate",
      "El Chaltén и Fitz Roy",
      "Lago Roca — менее известная зона отдыха",
    ],
    faq: [
      {
        question: "Один билет на весь парк?",
        answer:
          "Да, срок действия уточняйте на кассе — обычно несколько дней для одной зоны; при посещении обеих зон может понадобиться продление.",
      },
    ],
  },
  "nahuel-huapi-national-park": {
    history:
      "Первый национальный парк Аргентины (1934), вдохновлённый моделью Йеллоустоуна. Озеро Nahuel Huapi и вулкан Tronador — символы района озёр (Lake District). Bariloche вырос как туристический центр вокруг парка.",
    interestingFacts: [
      "Легенда о Nahuelito — местный «loch ness» — часть фольклора региона.",
      "Circuito Chico — классический автомобильный маршрут ~60 км с остановками у viewpoints.",
      "Зимой Cerro Catedral — один из крупнейших горнолыжных курортов Южного полушария.",
    ],
    howToGetThere:
      "Аэропорт BRC (San Carlos de Bariloche). Circuito Chico — аренда авто, такси или guided tour. К Colonia Suiza и Cerro Campanario — автобусы из центра Bariloche.",
    nearbyHighlights: [
      "Bariloche — шоколад, пиво, архитектура",
      "Villa La Angostura — тихая альтернатива",
      "San Martín de los Andes — севернее, другой вход в Lake District",
    ],
    faq: [
      {
        question: "Bariloche или Villa La Angostura?",
        answer:
          "Bariloche — инфраструктура и рейсы; Villa La Angostura — спокойнее, ближе к Arrayanes. Можно совместить за 7–10 дней.",
      },
    ],
  },
  "valdes-peninsula": {
    history:
      "Полуостров Valdés — объект UNESCO с 1999 года как ключевое место размножения китов и морских птиц. С 1983 года — заповедная зона Provincia Chubut с строгими правилами приближения к wildlife.",
    interestingFacts: [
      "С июня по декабрь здесь можно увидеть southern right whales в заливе Puerto Pirámides.",
      "Orcas на пляже Punta Norte охотятся на sea lion pups — редкое зрелище (февраль–апрель).",
      "Магеллановских penguins — колонии в Punta Tombo (южнее) и на полуострове.",
    ],
    howToGetThere:
      "База — Puerto Madryn (рейсы PMY или автобус из Buenos Aires). До полуострова — ~1,5 ч на авто; экскурсии с гидом обязательны для понимания маршрутов. Puerto Pirámides — единственное поселение на полуострове.",
    nearbyHighlights: [
      "Puerto Madryn — город и пляж",
      "Punta Tombo — пингвины (сентябрь–март)",
      "Trelew — Museo Paleontológico Egidio Feruglio",
    ],
    faq: [
      {
        question: "Когда киты?",
        answer:
          "Июнь–декабрь, пик — сентябрь–ноябрь. Бронируйте whale watching заранее в высокий сезон.",
      },
    ],
  },
  ushuaia: {
    history:
      "Ушуайя основана в 1884 году как тюремное поселение для повторных преступников — сегодня это туристический город на краю света. С 1940-х развивается как порт для антарктических экспедиций; с 1960-х — как база для рыболовного флота и туризма.",
    interestingFacts: [
      "Широта 54°48′ — Ushuaia называют «самым южным городом мира» (статус оспаривает чилийский Пуэрто-Уильямс, но Ушуайя крупнее).",
      "«Поезд на край света» (Tren del Fin del Mundo) — узкоколейка в национальный парк Tierra del Fuego.",
      "Зимой дни короткие; летом — белые ночи и круизы к островам.",
    ],
    howToGetThere:
      "Аэропорт USH — рейсы из Buenos Aires (AEP/EZE). Из аэропорта — такси 10–15 мин до центра. К парку Tierra del Fuego — автобус или экскурсия. Круизы в Антарктиду отправляются из порта (бронирование за месяцы).",
    nearbyHighlights: [
      "Национальный парк Tierra del Fuego",
      "Beagle Channel — морские львов и птицы",
      "Laguna Esmeralda — треккинг",
    ],
    faq: [
      {
        question: "Нужна ли одежду для Antarctica cruise?",
        answer: "Оператор выдаёт список; базово — непродуваемая куртка, термобельё, водонепроницаемая обувь. Даже летом в канале Beagle прохладно.",
      },
    ],
  },
  "el-calafate": {
    history:
      "Посёлок вырос вокруг estancia и торговли wool в начале XX века; туристический бум начался с открытием доступа к Perito Moreno в 1960–70-х. Сегодня El Calafate — главная база Los Glaciares на южном берегу Lago Argentino.",
    interestingFacts: [
      "Название — от жёлтого цветка calafate (barberry), по легенде вернувшегося в Patagonia съевший ягоду.",
      "Glaciarium — музей ледников с баром из ледяных блоков.",
      "Зимой часть круизов к Upsala не ходит из-за льда на озере.",
    ],
    howToGetThere:
      "Аэропорт FTE — рейсы из BA, Bariloche (сезонно). Центр компактный, до Perito Moreno — автобус или тур. В высокий сезон бронируйте жильё и ледниковые активности заранее.",
    nearbyHighlights: [
      "Perito Moreno Glacier",
      "Punta Bandera — ледниковые круизы",
      "El Chaltén — 3 ч на автобусе",
    ],
    faq: [
      {
        question: "Calafate или Chaltén первым?",
        answer: "Часто Calafate → Perito Moreno → Chaltén для треккинга. Обратный порядок возможен, если прилёт поздний.",
      },
    ],
  },
  bariloche: {
    history:
      "San Carlos de Bariloche основан в 1902 году; с 1930-х — центр горнолыжного туризма и научных исследований (штамп шоколада, Centro Atómico). Архитектура alpine chalet — наследие европейской иммиграции.",
    interestingFacts: [
      "Ruta de los Siete Lagos — классический road trip к San Martín de los Andes.",
      "Cerro Catedral — один из крупнейших ski resort Южной Америки.",
      "Озеро Nahuel Huapi — легенда о lake monster Nahuelito.",
    ],
    howToGetThere:
      "Аэропорт BRC. Circuito Chico — аренда авто, такси или tour. До Villa La Angostura — 1,5 ч на автобусе. Зимой проверяйте цепи на колёсах для Catedral.",
    nearbyHighlights: [
      "Cerro Campanario",
      "Colonia Suiza",
      "Nahuel Huapi National Park",
    ],
    faq: [
      {
        question: "Bariloche зимой без лыж?",
        answer: "Да — шоколадные мастерские, пивоварни, спа; но основная зимняя причина приехать — лыжи и сноуборд на Catedral.",
      },
    ],
  },
  mendoza: {
    history:
      "Основана в 1561 году; разрушалась землетрясениями и переносилась. Современная Mendoza — capital винодельческого региона Cuyo, у подножия Cordillera de los Andes и Aconcagua.",
    interestingFacts: [
      "Malbec «приехал» из France и здесь нашёл идеальный terroir.",
      "Площад Independencia — одна из крупнейших в Latin America, с фонтанами и кафе.",
      "Harvest festival (Fiesta Nacional de la Vendimia) — в марте.",
    ],
    howToGetThere:
      "Аэропорт MDZ. Maipú — 20 мин на такси; Uco Valley — 1–1,5 ч. Bodega tours бронируйте заранее; designated driver или van tour если дегустацию.",
    nearbyHighlights: [
      "Maipú и Luján de Cuyo — bodegas",
      "Potrerillos — dam и outdoor",
      "Aconcagua Provincial Park (вид, не восхождение без подготовки)",
    ],
    faq: [
      {
        question: "Сколько bodega за день?",
        answer: "2–3 с дегустацию — комфортный темп; больше — только с трансфер и без вождения.",
      },
    ],
  },
  "puerto-madryn": {
    history:
      "Основан в 1865 году валлийскими поселенцами — один из немногих городов Patagonia с celtic roots. С 1970-х развивается whale watching и туризм на Valdes.",
    interestingFacts: [
      "Southern right whales приходят в залив для размножения — уникальная близость к берегу.",
      "Ecocentro — музей морской биологии с панорамой на океан.",
      "Пляж El Doradillo — киты иногда видны с берега.",
    ],
    howToGetThere:
      "Аэропорт PMY или автобус из Buenos Aires (~18–20 ч). Valdes Peninsula — только с авто или экскурсией; Punta Tombo — отдельный день на пингвинов.",
    nearbyHighlights: [
      "Península Valdés",
      "Punta Tombo",
      "Trelew — paleontology museum",
    ],
    faq: [
      {
        question: "Madryn или Trelew?",
        answer: "Madryn — ближе к океану и китам; Trelew — удобнее для аэропорта и музея динозавров.",
      },
    ],
  },
  salta: {
    history:
      "Salta la Linda основана в 1582 году как остановка на пути из Lima в Buenos Aires. Сохранила colonial center с pastel façades и базиликой — редкий пример intact grid в NOA.",
    interestingFacts: [
      "Teleférico San Bernardo — подъём к viewpoint над городом.",
      "Empanadas salteñas — с защипом (repulgue), отличимы от других регионов.",
      "Museum of High Altitude Archaeology (MAAM) — дети Llullaillaco.",
    ],
    howToGetThere:
      "Аэропорт SLA. Quebrada de Humahuaca — аренда авто или tour (Purmamarca, Tilcara). Tren a las Nubes — сезонный, бронь заранее.",
    nearbyHighlights: [
      "Cafayate и винодельни Torrontés",
      "Purmamarca и Cerro 7 Colores",
      "Cachi и Ruta 40",
    ],
    faq: [
      {
        question: "Salta как база на сколько дней?",
        answer: "2 дня на город + 3–5 на Humahuaca, Cafayate или Tren — типичный минимум.",
      },
    ],
  },
  purmamarca: {
    history:
      "Деревня у подножия Cerro de los Siete Colores — традиционное settlement в Quebrada de Humahuaca, включённой в UNESCO (2003). Еженедельный artisan market существует десятилетиями.",
    interestingFacts: [
      "Цвета гор — осадочные слои, усиленные минералами (красный — iron oxide).",
      "Лучший свет — раннее утро и закат.",
      "Paseo de los Colorados — троп вокруг cerro.",
    ],
    howToGetThere:
      "Из Salta ~2,5 ч на автобусе или авто по RN9. Часто совмещают с Tilcara и Humahuaca за один день — лучше ночёвка в Purmamarca для фото на рассвете.",
    nearbyHighlights: [
      "Cerro de los Siete Colores",
      "Salinas Grandes (с Altiplano tour)",
      "Tilcara и Pucará",
    ],
    faq: [
      {
        question: "Одного дня достаточно?",
        answer: "Для осмотра cerro — да; для фото без толп — ночёвка и рассвет.",
      },
    ],
  },
  "cerro-de-los-7-colores": {
    history:
      "Геологическое formation из marine и continental sediments, поднятых тектоникой Andes. Для народа omaguaca гора священна; туристическая инфраструктура развилась с ростом потока в Humahuaca.",
    interestingFacts: [
      "Высота холма ~300 м над Purmamarca — подъём 30–45 мин.",
      "После дождя цвета насыщеннее.",
      "Вход может быть платным — уточняйте на месте.",
    ],
    howToGetThere:
      "Пешком из Purmamarca; парковка у начала тропы. Комбинируйте с Salinas Grandes tour из Purmamarca.",
    nearbyHighlights: ["Purmamarca", "Salta", "Tilcara"],
    faq: [
      {
        question: "Нужен ли гид?",
        answer: "Нет для короткого подъёма; для Salinas Grandes на высоте 4000+ м — tour с acclimatization предпочтительнее.",
      },
    ],
  },
  "tren-de-las-nubes": {
    history:
      "Железная дорога Salta–Antofagasta (Chile) — инженерный подвиг начала XX века. «Поезд в облака» — tourist section с viaducts La Polvorilla; после реконструкции ходит с ограничениями по сезону.",
    interestingFacts: [
      "Максимальная высота маршрута — около 4200 м — возможна altitude sickness.",
      "La Polvorilla — viaduct в форме полукруга без прямых опор в центре.",
      "Альтернатива — bus tour по тому же маршруту, если поезд не ходит.",
    ],
    howToGetThere:
      "Станция отправления из Salta или Campo Quijano — уточняйте у оператора сезон. Бронируйте online; берите тёплую одежду и воду.",
    nearbyHighlights: ["Salta", "Cafayate", "Quebrada de las Conchas"],
    faq: [
      {
        question: "Безопасно ли на высоте?",
        answer: "Оператор даёт рекомендации; при проблемах с сердцем или лёгкими — consult doctor. Не спешите бегать на 4000 м.",
      },
    ],
  },
  "cueva-de-las-manos": {
    history:
      "Пещеры с stenciled hands и hunting scenes — 9000+ лет, культура hunter-gatherers Patagonia. Внесены в UNESCO в 1999 году вместе с другими sites в Cueva de las Manos, Río Pinturas.",
    interestingFacts: [
      "Более 800 отпечатков рук — в основном левые (правша брызгал pigment правой).",
      "Guánaco и hunting scenes — ключ к пониманию diet древних групп.",
      "Доступ только с guide в organized groups — для preservation.",
    ],
    howToGetThere:
      "Из Perito Moreno (Santa Cruz province, не ледник!) или Los Antiguos — длинный gravel RN40. Лучше combined tour из Calafate/Chaltén region или overnight в Perito Moreno town.",
    nearbyHighlights: [
      "Los Antiguos — cherry region",
      "Lago Buenos Aires",
      "Ruta 40 scenic drive",
    ],
    faq: [
      {
        question: "Путаница с Perito Moreno?",
        answer: "Да — город Perito Moreno ≠ ледник. Пещеры в другой части Santa Cruz; планируйте отдельный день или tour.",
      },
    ],
  },
  "mar-del-plata": {
    history:
      "Курорт вырос с приходом железной дороги из BA в 1880-х; «Biarritz Аргентины» для porteños. Летом — миллионы отдыхающих, зимой — спокойный приморский город.",
    interestingFacts: [
      "Playa Bristol — главный пляж; Varese и Punta Mogotes — альтернативы.",
      "Aquarium Mar del Plata — один из крупнейших в стране.",
      "Рыбный порт — свежие морепродукты на рынке.",
    ],
    howToGetThere:
      "Автобус или авто из BA (~5 ч); рейсы MDQ seasonally. Летом пробки на RN2 — выезжайте рано.",
    nearbyHighlights: [
      "Pinamar и Cariló — pinewood beaches",
      "Sierra de los Padres",
      "Buenos Aires — контраст мегаполиса",
    ],
    faq: [
      {
        question: "Когда сезон?",
        answer: "Декабрь–март — пик и цены; shoulder months — прохладнее океан, но меньше людей.",
      },
    ],
  },
  "tierra-del-fuego-national-park": {
    history:
      "Создан в 1960 году — единственный аргентинский национальный парк с морским coast и subantarctic forest. End of the World Train исторически связан с Ushuaia prison logging.",
    interestingFacts: [
      "Bay Lapataia — конец RN3, символический «fin del mundo» на дороге.",
      "Senda Costera — coastal trail 8 km к Zaratiegui.",
      "Beaver (introduced) — проблема для леса; не кормите wildlife.",
    ],
    howToGetThere:
      "Из Ushuaia — 12 km, автобус или taxi. End of the World Train — отдельный ticket. Запаситесь ветровку даже летом.",
    nearbyHighlights: ["Ushuaia", "Beagle Channel", "Emerald Lagoon trek"],
    faq: [
      {
        question: "Парк за один день?",
        answer: "Да — Senda Costera + Lapataia или train + короткие тропы. Полный день с трансфер.",
      },
    ],
  },
  cordoba: {
    history:
      "Córdoba основана в 1573 году как форпост на пути к Upper Peru. С XVII века Jesuit Block — центр образования и миссий в регионе; комплекс включён в UNESCO в 2000 году. Сегодня город — второй по численности в стране и крупный университетский центр.",
    interestingFacts: [
      "Manzana Jesuítica — единый квартал с университетом, церковью и колониальными постройками.",
      "Villa General Belgrano — немецкое по происхождению поселение, известное Oktoberfest в октябре.",
      "Alta Gracia — дом-музей Che Guevara и estancia Jesuitica.",
    ],
    howToGetThere:
      "Аэропорт COR — рейсы из Buenos Aires (~1,5 ч). Из столицы — ночной автобус или поезд (~9–10 ч). До гор в Sierras — аренда авто или экскурсии из центра.",
    nearbyHighlights: [
      "Alta Gracia и estancias",
      "Villa General Belgrano",
      "Los Gigantes — скальные formations",
    ],
    faq: [
      {
        question: "Сколько дней закладывать?",
        answer: "1–2 дня на центр и Manzana Jesuítica; +1 день на Alta Gracia или горный маршрут.",
      },
      {
        question: "Нужен ли автомобиль?",
        answer: "Для центра — нет. Для Sierras и Alta Gracia удобнее аренда или tour на день.",
      },
    ],
  },
  "estero-ibera": {
    history:
      "Влажные лодки Iberá занимают около 13 000 км² — одна из крупнейших freshwater wetland systems в мире. С 1980-х идёт программа rewilding: возвращение yaguareté, giant anteater и других видов под эгидой Fundación Rewilding Argentina.",
    interestingFacts: [
      "Capybara — самый заметный «житель» лагун; стаи часто видны с лодки.",
      "Colonia Carlos Pellegrini — главная туристическая база внутри резервата.",
      "Ночные сафари дают шанс увидеть caiman и ночных птиц.",
    ],
    howToGetThere:
      "Из Posadas (~4–5 ч) или Corrientes — наземный transfer до Pellegrini (грунтовка, лучше 4×4 в дождь). Некоторые lodges включают трансфер из аэропорта PSS.",
    nearbyHighlights: [
      "Posadas — транспортный узел",
      "San Ignacio Mini (руины Jesuit mission) — по пути из Posadas",
      "Iguazú — можно совместить в длинном маршруте по северо-востоку",
    ],
    faq: [
      {
        question: "Когда лучше ехать?",
        answer: "Апрель–октябрь — меньше дождей и комаров. Лето (декабрь–февраль) жарко и влажно.",
      },
      {
        question: "Нужен ли гид?",
        answer: "Да — самостоятельный доступ ограничен; экскурсии на лодках и пешие маршруты бронируют через lodges.",
      },
    ],
  },
  talampaya: {
    history:
      "Каньоны Talampaya сформированы эрозией реки Rio Talampaya в красных песчаниках Triassic. С 1997 года — национальный парк; с 2000 года — объект UNESCO вместе с соседним Ischigualasto (Valle de la Luna) в San Juan.",
    interestingFacts: [
      "Экскурсии по парку — только с официальными гидами на транспорте парка.",
      "Petroglyphs на скалах — следы diaguita и других культур.",
      "Высота каньонов — до 150 м; ландшафт напоминает юго-запад США.",
    ],
    howToGetThere:
      "База — город Villa Unión (La Rioja) или San Juan для связки с Ischigualasto. Из Salta/Córdoba — длинный переезд, обычно включают в tour по NOA/Cuyo.",
    nearbyHighlights: [
      "Ischigualasto (Valle de la Luna) — 63 км, UNESCO",
      "San Juan — винодельни и база для Cuyo",
      "Salta — если совмещаете с северо-западом",
    ],
    faq: [
      {
        question: "Можно ли без тура?",
        answer: "Нет — внутри парка только организованные экскурсии. Билеты лучше бронировать заранее в сезон.",
      },
      {
        question: "Сколько времени нужно?",
        answer: "Полдня на Talampaya; полный день, если добавить Ischigualasto.",
      },
    ],
  },
};

export function getPlaceEnrichment(slug: string): PlaceEnrichment | undefined {
  return PLACE_ENRICHMENTS[slug];
}
