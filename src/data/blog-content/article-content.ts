import type { BlogContentCategory } from "@/data/blog-content-plan";
import { getTopicLabel } from "@/data/blog-content/topic-labels";

export type RichSection = {
  title: string;
  paragraphs: string[];
};

type RegionContext = {
  name: string;
  focus: string;
  places: string;
  seasonPeak: string;
  seasonLow: string;
  hubCity: string;
  budgetDaily: string;
};

const REGION: Record<BlogContentCategory, RegionContext> = {
  travel: {
    name: "Аргентина",
    focus: "комбинированный маршрут по нескольким регионам",
    places: "Buenos Aires, Patagonia, Iguazú или северо-запад",
    seasonPeak: "декабрь–февраль",
    seasonLow: "июнь–август",
    hubCity: "Buenos Aires",
    budgetDaily: "80–150 USD на человека в mid-range",
  },
  "buenos-aires": {
    name: "Буэнос-Айрес",
    focus: "столицу с районами Palermo, Recoleta, San Telmo и Puerto Madero",
    places: "Centro, La Boca (днём), Costanera, парки Palermo",
    seasonPeak: "март–май и сентябрь–ноябрь",
    seasonLow: "июль (прохладно, но мало туристов)",
    hubCity: "Buenos Aires",
    budgetDaily: "60–120 USD на человека",
  },
  patagonia: {
    name: "Патагония",
    focus: "ледники Los Glaciares, треккинг у Fitz Roy и край света в Ushuaia",
    places: "El Calafate, Perito Moreno, El Chaltén, Ushuaia",
    seasonPeak: "ноябрь–март",
    seasonLow: "июнь–август (часть активностей закрыта)",
    hubCity: "El Calafate или El Chaltén",
    budgetDaily: "100–180 USD — логистика дороже, чем в столице",
  },
  north: {
    name: "Северо-запад",
    focus: "Salta, Quebrada de Humahuaca, Purmamarca и винные долины Cafayate",
    places: "Salta, Purmamarca, Cerro de los 7 Colores, Salinas Grandes",
    seasonPeak: "апрель–май и сентябрь–октябрь",
    seasonLow: "январь–февраль (жара в долинах)",
    hubCity: "Salta",
    budgetDaily: "50–90 USD",
  },
  iguazu: {
    name: "Игуасу",
    focus: "национальный парк Iguazú и водопады с аргентинской и бразильской сторон",
    places: "Puerto Iguazú, Garganta del Diablo, мини-треккинг, Bird Park",
    seasonPeak: "март–май (полноводность после дождей)",
    seasonLow: "август–сентябрь (сухо, меньше воды)",
    hubCity: "Puerto Iguazú",
    budgetDaily: "70–130 USD",
  },
  "national-parks": {
    name: "национальные парки",
    focus: "Los Glaciares, Nahuel Huapi, Iguazú и правила посещения",
    places: "Perito Moreno, Bariloche, Circuito Chico, ледниковые круизы",
    seasonPeak: "зависит от парка; Patagonia — лето южного полушария",
    seasonLow: "зима на юге — часть троп закрыта",
    hubCity: "ближайший город у парка",
    budgetDaily: "80–140 USD с учётом билетов в парк",
  },
  trekking: {
    name: "треккинг",
    focus: "горные маршруты Patagonia — Laguna de los Tres, Fitz Roy, ледники",
    places: "El Chaltén, Laguna de los Tres, Lago Torre, Perito Moreno mini-trekking",
    seasonPeak: "ноябрь–март",
    seasonLow: "июнь–август — снег и короткий световой день",
    hubCity: "El Chaltén",
    budgetDaily: "70–120 USD (hostel + еда)",
  },
  wineries: {
    name: "Мендоса",
    focus: "винодельни Maipú, Luján de Cuyo и Valle de Uco",
    places: "Mendoza, bodegas, Aconcagua viewpoint, Potrerillos",
    seasonPeak: "март–апрель (vendimia), январь–февраль (дегустации)",
    seasonLow: "июнь–июль (холодные ночи)",
    hubCity: "Mendoza",
    budgetDaily: "70–150 USD с дегустациями",
  },
  wildlife: {
    name: "дикая природа",
    focus: "китов Valdés, пингвинов Patagonia, condor и guanaco",
    places: "Puerto Madryn, Península Valdés, Punta Tombo, Ushuaia",
    seasonPeak: "июнь–декабрь (киты), сентябрь–март (пингвины)",
    seasonLow: "зависит от вида — сверяйте календарь",
    hubCity: "Puerto Madryn или Ushuaia",
    budgetDaily: "90–160 USD с экскурсиями",
  },
  food: {
    name: "аргентинская кухня",
    focus: "asado, empanadas, mate и винные пары",
    places: "parrilla в BA, рынки, Mendoza, региональные винодельни",
    seasonPeak: "круглый год",
    seasonLow: "—",
    hubCity: "Buenos Aires или Mendoza",
    budgetDaily: "40–100 USD на питание",
  },
  transport: {
    name: "транспорт",
    focus: "перелёты, автобусы, поезда и аренду авто по стране",
    places: "EZE/AEP, автовокзалы Retiro, региональные аэропорты",
    seasonPeak: "январь–февраль и праздники — бронируйте заранее",
    seasonLow: "май–август — проще найти места",
    hubCity: "Buenos Aires",
    budgetDaily: "зависит от маршрута",
  },
  safety: {
    name: "безопасность",
    focus: "поведение в BA, регионах и на природе",
    places: "туристические районы BA, автобусные вокзалы, парки",
    seasonPeak: "—",
    seasonLow: "—",
    hubCity: "Buenos Aires",
    budgetDaily: "—",
  },
  money: {
    name: "деньги",
    focus: "курс песо, обмен, карты и бюджет",
    places: "официальные обменники, банкоматы, Western Union",
    seasonPeak: "—",
    seasonLow: "—",
    hubCity: "Buenos Aires",
    budgetDaily: "см. путеводитель «Экономика и деньги»",
  },
  internet: {
    name: "связь",
    focus: "SIM, eSIM и Wi‑Fi для туриста",
    places: "салоны Claro, Personal, Movistar",
    seasonPeak: "—",
    seasonLow: "—",
    hubCity: "Buenos Aires",
    budgetDaily: "5–15 USD на связь",
  },
  "ba-neighborhoods": {
    name: "районы Buenos Aires",
    focus: "Palermo, Recoleta, San Telmo, Microcentro и Puerto Madero",
    places: "Parque Tres de Febrero, Recoleta Cemetery, San Telmo Market",
    seasonPeak: "март–май, сентябрь–ноябрь",
    seasonLow: "июль",
    hubCity: "Buenos Aires",
    budgetDaily: "60–130 USD на жильё и еду",
  },
  relocation: {
    name: "релокация",
    focus: "въезд, 90 дней, страховка, жильё и продление",
    places: "Migraciones, районы для аренды, банки",
    seasonPeak: "—",
    seasonLow: "—",
    hubCity: "Buenos Aires",
    budgetDaily: "800–1500 USD/мес на проживание",
  },
};

function joinParagraphs(...parts: string[]): string[] {
  return parts.filter(Boolean);
}

function seasonParagraphs(region: RegionContext, topic: string): string[] {
  const season =
    topic === "зимой"
      ? "зимой (июнь–август в южном полушарии)"
      : topic === "летом"
        ? "летом (декабрь–февраль)"
        : topic === "весной"
          ? "весной (сентябрь–ноябрь)"
          : "осенью (март–май)";

  return joinParagraphs(
    `${region.name} ${season} имеет свои плюсы и ограничения. Пик сезона здесь — ${region.seasonPeak}; низкий — ${region.seasonLow}.`,
    `Для ${region.focus} заранее проверьте часы работы парков, расписание автобусов и погоду на 7–10 дней вперёд — в Патагонии и на высоте прогноз меняется быстро.`,
    `Одежда по слоям обязательна: даже летом у ледника или на треке ветер и +5 °C возможны. Солнцезащита (SPF 50, очки, бальзам для губ) нужна круглый год — озоновая дыра над южными широтами не миф маркетинга.`,
    `Бронируйте жильё и внутренние перелёты раньше, если попадаете в ${region.seasonPeak}: цены растут, а лучшие хостелы и бутик-отели разбирают за 2–3 месяца.`,
  );
}

function durationParagraphs(region: RegionContext, topic: string): string[] {
  const days = topic.replace("за-", "").replace("-дней", "").replace("-дня", " дня");
  return joinParagraphs(
    `Маршрут по ${region.name} ${topic.includes("3") ? "за 3 дня" : topic.includes("5") ? "за 5 дней" : topic.includes("7") ? "за 7 дней" : topic.includes("10") ? "за 10 дней" : "за 14 дней"} — это реалистичный план без спешки, если не пытаться объять всю страну.`,
    `День 1–2: прилёт в ${region.hubCity}, акклиматизация, ключевые точки в городе — ${region.places.split(",")[0]?.trim() ?? region.hubCity}. Закладывайте полдня на jet lag при межконтинентальном перелёте.`,
    `Середина маршрута: основная активность региона — ${region.focus}. Не ставьте две дальние точки в один день: расстояния в Аргентине большие, а дороги в горах медленные.`,
    `Финал: запасной день на погоду или повтор лучшей локации. Для ${days} в одном регионе это особенно важно в Patagonia и на Игуасу, где дождь перекрывает тропы.`,
    `Бюджет ориентир: ${region.budgetDaily} без международных перелётов. Экономия — на автобусах вместо лишних перелётов, на обедах set menú и на бронировании жилья с кухней.`,
  );
}

function noviceParagraphs(region: RegionContext): string[] {
  return joinParagraphs(
    `Первая поездка в ${region.name} пугает масштабом страны и разбросом климатов — это нормально. Начните с одного региона и 7–10 дней: ${region.focus}.`,
    `Документы: действующий загранпаспорт (лучше 6+ месяцев запаса), обратный билет или продолжение маршрута, иногда — подтверждение жилья и медстраховка. На границе могут спросить, где остановитесь — сохраните PDF брони.`,
    `Деньги: имейте небольшую сумму USD/EUR в новых купюрах и карту иностранного банка. Не меняйте у «улицы» — только офисы, банки или проверенные casa de cambio. Подробности — в путеводителе «Экономика и деньги».`,
    `Транспорт: внутренние рейсы Aerolíneas, Flybondi, JetSMART; между городами — автобусы cama (спальное кресло). Приложения такси работают в крупных городах; наличные мелочью — для автобуса.`,
    `Главные точки для старта: ${region.places}. Не планируйте больше двух «якорей» за короткую поездку — лучше глубже, чем галочки.`,
  );
}

function budgetParagraphs(region: RegionContext): string[] {
  return joinParagraphs(
    `Бюджет поездки в ${region.name} складывается из перелётов, жилья, питания, транспорта и экскурсий. Ориентир mid-range: ${region.budgetDaily}.`,
    `Жильё: hostels от 15–25 USD, отели 3* — 50–90 USD, Airbnb выгоден на 5+ ночей. В ${region.seasonPeak} цены выше на 20–40 %.`,
    `Еда: обед menú del día 8–15 USD, parrilla 25–50 USD, кофе и medialunas — копейки. Вино в супермаркете дешевле, чем в ресторане — для Mendoza закладывайте дегустацию от 15 USD.`,
    `Активности: билет в парк Iguazú, ледниковый круиз, whale watching — от 30–80 USD. Бронируйте официально; «дешёвые» уличные предложения часто без страховки.`,
    `Резерв 10–15 % на задержки рейсов, допбагаж и один «лишний» трансфер — особенно в Patagonia.`,
  );
}

function mistakesParagraphs(region: RegionContext): string[] {
  return joinParagraphs(
    `Ошибка 1: пытаться объехать всю Аргентину за две недели. Лучше два региона глубоко, чем пять на галочку.`,
    `Ошибка 2: недооценить ветер и холод в ${region.name} даже «летом». Слои, ветровка и перчатки обязательны для Патагонии и треккинга.`,
    `Ошибка 3: менять деньги у неофициалов. Риск подделок и проблем на границе при выезде.`,
    `Ошибка 4: не бронировать Perito Moreno, популярные bodega и whale watching в пик — sold out за недели.`,
    `Ошибка 5: показывать телефон на улице в толпе в Microcentro или Retiro — используйте карман и дневные маршруты в безопасных районах.`,
    `Ошибка 6: игнорировать высоту на северо-западе — Salinas Grandes и Tren de las Nubes требуют акклиматизации.`,
  );
}

function topicSpecificParagraphs(
  category: BlogContentCategory,
  topic: string,
  region: RegionContext,
): Partial<Record<string, string[]>> {
  const label = getTopicLabel(topic);

  if (topic === "garganta-del-diablo") {
    return {
      sights: joinParagraphs(
        "Garganta del Diablo — главный каскад парка Iguazú: 80 метров падения, площадки с обеих сторон аргентинской тропы. Добираются на Ecological Jungle Train + 15–20 минут пешком по настилу.",
        "Лучшее время — утро (меньше людей) или конец дня (мягкий свет для фото). После дождя воды больше, но настил скользкий — обувь с хорошим grip.",
        "Coatís и agouti встречаются на тропах — не кормите, держите рюкзак закрытым. Дождевик или poncho дешевле в городе, чем в парке.",
      ),
    };
  }

  if (topic === "laguna-de-los-tres") {
    return {
      sights: joinParagraphs(
        "Laguna de los Tres — классический трек из El Chaltén: 20–22 км туда-обратно, набор высоты ~750 м, 8–10 часов. Старт рано — до рассвета, чтобы вернуться до ветра.",
        "На развилке к Laguna Capri можно сократить маршрут для менее подготовленных. Вода, перекус, слои одежды обязательны; тропа маркирована, но без связи.",
        "Погода меняется за минуты — Fitz Roy может скрыться в облаке. Запасной день в El Chaltén повышает шанс увидеть пик.",
      ),
    };
  }

  if (topic === "whale-watching") {
    return {
      sights: joinParagraphs(
        "Southern right whales приходят к Península Valdés с июня по декабрь; пик — сентябрь–ноябрь. База — Puerto Madryn или Puerto Pirámides.",
        "Бронируйте утренние рейсы: море спокойнее. Китов иногда видно с берега El Doradillo — бесплатная альтернатива лодке.",
        "Orcas на Punta Norte (охота на sea lions) — февраль–апрель, мест мало, нужен гид и терпение.",
      ),
    };
  }

  if (topic === "malbec" || topic === "bodega-tour") {
    return {
      sights: joinParagraphs(
        "Malbec — визитная карточка Mendoza: высота 800–1200 м, различие между Maipú (ближе к городу), Luján (классика) и Uco Valley (премиум).",
        "Дегустацию обычно 3–5 вин + вода и хлеб; premium tour включает сыр и olive oil. Designated driver или van tour — если планируете несколько bodega.",
        "Бронируйте онлайн: Catena, Salentein, Trapiche, семейные boutique. Vendimia в марте — пик цен и sold out.",
      ),
    };
  }

  if (topic === "asado") {
    return {
      sights: joinParagraphs(
        "Asado — медленное приготовление на углях: vacío, bife de chorizo, molleja. В ресторане заказывают porción на человека или plato para dos.",
        "Don Julio, La Cabrera, El Pobre Luis — легенды BA; бронь за 2–4 недели. Обед дешевле ужина.",
        "Chimichurri подают отдельно; вино malbec — стандартное сочетание. Не торопите официанта — мясо готовят долго.",
      ),
    };
  }

  if (topic === "visa-free" || topic === "90-дней") {
    return {
      brief: joinParagraphs(
        "Граждане России и многих стран СНГ въезжают в Аргентину без визы на туристический срок — обычно до 90 дней. Штамп ставят в паспорт на пограничном контроле.",
        "Нужны: действующий загранпаспорт, обратный билет или билет в третью страну, иногда — подтверждение жилья и медстраховка. Правила ужесточались — сверяйтесь с migraciones.gob.ar перед вылетом.",
        "90 дней — не гарантия автоматического продления. Для длительного пребывания смотрите раздел иммиграции, не полагайтесь на форумные советы 2020 года.",
      ),
    };
  }

  if (topic === "sim-карта") {
    return {
      brief: joinParagraphs(
        "SIM Claro, Personal или Movistar продают в салонах и киосках — нужен паспорт. Пакет 3–5 GB на 7–15 дней — ориентир 5–10 USD.",
        "eSIM через Airalo/Holafly удобна до landing. Wi‑Fi в отелях и кафе есть, но для maps и такси лучше мобильные данные.",
        "В Patagonia покрытие пропадает на тропах — скачайте offline maps заранее.",
      ),
    };
  }

  if (topic === "наличные" || topic === "карты") {
    return {
      brief: joinParagraphs(
        "В Аргентине несколько курсов peso; туристу важно понимать, когда выгоднее карта иностранного банка (часто близко к MEP), а когда — небольшая сумма USD/EUR в легальном обменнике.",
        "Не меняйте у calle — риск подделок. Western Union и crypto — тема для резидентов, не обязательный путь туристу.",
        "Мелкие peso для автобуса, tips и рынков; крупные покупки — картой с уведомлением банка о поездке.",
      ),
    };
  }

  const districts = ["palermo", "recoleta", "san-telmo", "microcentro", "puerto-madero"];
  if (districts.includes(topic)) {
    const districtInfo: Record<string, string> = {
      palermo: "Palermo (SoHo, Hollywood, Bosques) — кафе, nightlife, парки. Безопаснее днём и вечером в людных местах; жильё mid-range и premium.",
      recoleta: "Recoleta — кладбище, музеи, спокойные улицы. Подходит для первого визита; цены выше среднего.",
      "san-telmo": "San Telmo — танго, воскресный рынок, антиквариат. Днём ок, вечером — не flaunt вещи; метро и bus.",
      microcentro: "Microcentro — деловой центр, Obelisco, театр Colón. Оживлён днём, вечером пустеет; осторожность с телефоном.",
      "puerto-madero": "Puerto Madero — набережная, современные башни, дорогие рестораны. Спокойнее, но менее «локально».",
    };
    return {
      sights: joinParagraphs(
        districtInfo[topic] ?? `Район ${label} в Buenos Aires.`,
        "Снимайте жильё ближе к subte, если без авто. Uber/Cabify работают; наличные для bus SUBE.",
        "Сочетайте район с соседним за один день: Palermo + Recoleta пешком через парки.",
      ),
    };
  }

  return {};
}

export function buildArticleSections(
  category: BlogContentCategory,
  topic: string,
): RichSection[] {
  const region = REGION[category];
  const label = getTopicLabel(topic);
  const specific = topicSpecificParagraphs(category, topic, region);

  const brief =
    specific.brief ??
    (["зимой", "весной", "летом", "осенью"].includes(topic)
      ? seasonParagraphs(region, topic)
      : topic.startsWith("за-")
        ? durationParagraphs(region, topic)
        : topic === "советы-новичкам"
          ? noviceParagraphs(region)
          : topic === "бюджет"
            ? budgetParagraphs(region)
            : topic === "ошибки"
              ? mistakesParagraphs(region)
              : joinParagraphs(
                  `Эта статья — подробный практический гид по теме «${label}» в контексте ${region.name}. Материал для русскоязычных путешественников: без воды, с акцентом на логистику, сезон и реальные цены 2025–2026 годов.`,
                  `Мы ориентируемся на ${region.focus}. Ключевые точки: ${region.places}. Перед поездкой сверьте актуальные правила парков, авиакомпаний и migraciones — они меняются быстрее, чем в Европе.`,
                  `Ниже — когда ехать, как добраться, что включить в маршрут, бюджет и ответы на частые вопросы. Ссылки на путеводитель и карточки мест — в конце статьи.`,
                ));

  const when =
    specific.when ??
    (["зимой", "весной", "летом", "осенью"].includes(topic)
      ? seasonParagraphs(region, topic)
      : joinParagraphs(
          `Оптимальное время для «${label}» в ${region.name}: пик — ${region.seasonPeak}, межсезонье часто даёт баланс цены и погоды.`,
          `Праздники (Рождество, январь, карнавал, Semana Santa) — переполненные автобусы и отели. Бронируйте заранее.`,
          topic.includes("дожд") || topic === "сезон-дождей"
            ? "Сезон дождей: полноводнее водопады и зелень, но скользкие тропы и отмены рейсов в Patagonia."
            : "Следите за прогнозом Windy/Meteoblue для Patagonia и севера — дождь и ветер перестраивают план на день.",
        ));

  const transport =
    specific.transport ??
    joinParagraphs(
      category === "transport" || topic === "авиабилеты" || topic === "автобусы"
        ? "Международные рейсы — в EZE (Ezeiza) или AEP (Aeroparque). Между EZE и городом — такси фикс, трансфер или shuttle; ночью только официальные."
        : `Базовый hub — ${region.hubCity}. Внутренние рейсы экономят дни на длинных плечах; автобусы cama — ночью между BA и Mendoza, Salta, Bariloche.`,
      topic === "аренда-авто"
        ? "Аренда авто: международные права, полная страховка, gravel на south — не берите слишком низкую машину. Заправки и расстояния большие."
        : topic === "поезда"
          ? "Поез Tren de las Nubes (Salta) и End of the World (Ushuaia) — сезонные, билеты заранее. Tren Patagónico ограничен."
          : "Сохраняйте PDF билетов и брони жилья — могут спросить на границе или при посадке.",
      "SUBE-карта в BA для bus/subte; в регионах — наличные peso для мелких перевозчиков.",
    );

  const sights =
    specific.sights ??
    joinParagraphs(
      `Что включить по теме «${label}»: ${region.places}.`,
      "Утро — для парков и смотровых; обеденный зной — музеи, кафе, siesta в северных регионах.",
      topic === "с-ребёнком"
        ? "С ребёнком: короткие переезды, парки, boat trips с спасжилетами; на Игуасу — коляску лучше не брать на тропы."
        : topic === "фото" || topic === "рассвет" || topic === "закат"
          ? "Золотой час у Fitz Roy, Perito Moreno и у озёр Palermo — планируйте локацию и выезд заранее."
          : "Оставьте 20 % времени без плана — лучшие моменты часто вне расписания.",
    );

  const budget =
    specific.budget ??
    (topic === "бюджет"
      ? budgetParagraphs(region)
      : joinParagraphs(
          `Бюджет для «${label}»: ориентир ${region.budgetDaily}.`,
          "Экономия: menú del día, автобус вместо лишнего перелёта, жильё с кухней, один платный тур вместо трёх «на бегу».",
          "Страховка, SIM и трансфер из аэропорта — заложите отдельно; не оставляйте последнюю ночь без peso на такси.",
        ));

  const faq =
    specific.faq ??
    joinParagraphs(
      `Нужен ли гид для «${label}»? На популярных тропах (Iguazú, Perito Moreno pasarelas) — можно самому. На Laguna de los Tres, Salinas Grandes, whale watching — гид повышает безопасность и экономит время.`,
      `Сколько дней минимум? Для одной темы в ${region.name} — 2–4 дня; для региона целиком — 5–10. Не смешивайте Patagonia и север без перелёта через BA.`,
      "Безопасность: не носите всё наличные, копии паспорта в облаке, официальные taxi/apps. Ночью — в людных районах или трансфер.",
      "Актуальность: проверяйте migraciones, parquesnacionales.gob.ar и сайты авиакомпаний за 2 недели до вылета.",
    );

  return [
    { title: "Кратко", paragraphs: brief },
    { title: "Когда ехать", paragraphs: when },
    { title: "Как добраться", paragraphs: transport },
    { title: "Что посмотреть", paragraphs: sights },
    { title: "Бюджет", paragraphs: budget },
    { title: "FAQ", paragraphs: faq },
  ];
}

export function sectionsToContent(sections: RichSection[]): string {
  return sections.flatMap((s) => s.paragraphs).join(" ");
}

export function sectionsToBlogPostSections(sections: RichSection[]): { title: string; body: string }[] {
  return sections.map((s) => ({
    title: s.title,
    body: s.paragraphs.join(" "),
  }));
}
