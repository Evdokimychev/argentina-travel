import type { GuidePillarContent } from "@/types/guide-pillar";

const SVYAZ_FAQ = [
  {
    question: "Какой оператор лучше для туриста?",
    answer:
      "Claro и Personal чаще рекомендуют для Patagonia и юга; Movistar силён в BA и центре. Сравните пакеты data в салоне или киоске — разница в покрытии на вашем маршруте важнее бренда.",
  },
  {
    question: "Нужен ли паспорт для SIM?",
    answer:
      "Да. Регистрация prepago по паспорту обязательна (AFIP/Enacom). Без регистрации линию могут заблокировать.",
  },
  {
    question: "eSIM или физическая SIM?",
    answer:
      "eSIM (Airalo, Holafly, Nomad) — до вылета, без очереди, удобно на 7–14 дней. Локальная SIM Claro/Personal — дешевле на 2+ недели и даёт аргентинский номер для Cabify и местных сервисов.",
  },
  {
    question: "Где купить SIM в аэропорту EZE?",
    answer:
      "В терминалах A и B есть киоски операторов и resellers. Удобно для первого дня, но пакеты часто дороже, чем в centro. Имейте паспорт и песо или USD на оплату.",
  },
  {
    question: "Работает ли WhatsApp?",
    answer:
      "Да — основной канал связи с гидами, отелями, организаторами туров и менялами. Аргентинский номер не обязателен: достаточно интернета.",
  },
  {
    question: "Работает ли Telegram в Аргентине?",
    answer:
      "Да, без блокировок. Российские туристы часто пишут домой в Telegram; для местных контактов всё равно чаще WhatsApp.",
  },
  {
    question: "Есть ли связь в El Chaltén?",
    answer:
      "В деревне — 4G нестабильно, но есть. На тропах Fitz Roy, Laguna de los Tres, Torre — связи нет. Скачайте offline-карты и сообщите маршрут до выхода.",
  },
  {
    question: "Есть ли интернет в нацпарке Iguazú?",
    answer:
      "У visitor center и отелей Puerto Iguazú — да. На тропах у водопадов и в лесу — слабо или нет. Не рассчитывайте на live-навигацию в парке.",
  },
  {
    question: "Personal или Claro в Patagonia?",
    answer:
      "Оба покрывают Calafate, Ushuaia и Chaltén лучше, чем Movistar. Между городами по Ruta 40 связь пропадает. На треккинг-турах с гидом координация идёт через организатора.",
  },
  {
    question: "Нужен ли VPN?",
    answer:
      "На публичном Wi‑Fi в кафе и аэропортах — желательно. Для обычного мобильного интернета и WhatsApp VPN не обязателен. Для удалённой работы — по политике работодателя.",
  },
  {
    question: "Сколько GB нужно на 2 недели?",
    answer:
      "Ориентир: 5–10 GB при активной навигации и мессенджерах; 15–20 GB если много видео и hotspot. Offline-карты сильно экономят трафик в Patagonia.",
  },
  {
    question: "Как пополнить prepago без местной карты?",
    answer:
      "Kiosco (locutorio), Rapipago, Pago Fácil — наличные песо. В приложении оператора иногда проходит иностранная карта, но надёжнее kiosco. Сохраните чек.",
  },
  {
    question: "Работает ли роуминг из России?",
    answer:
      "МТС, Beeline, Tele2, MegaFon — пакеты или pay-as-you-go часто в разы дороже локальной SIM. Оставьте роуминг для SMS в первый день, data — eSIM или Claro prepago.",
  },
  {
    question: "Можно ли использовать hotspot с локальной SIM?",
    answer:
      "Да, prepago data обычно разрешает tethering для ноутбука. Проверьте лимит пакета — видеозвонки быстро съедают GB.",
  },
  {
    question: "eSIM и локальная SIM одновременно?",
    answer:
      "На dual-SIM телефоне — да: eSIM для data, физическая — для местного номера. Настройте линию по умолчанию для mobile data.",
  },
  {
    question: "Есть ли Wi‑Fi в отелях и автобусах?",
    answer:
      "В отелях BA и туристических городах — обычно да, скорость разная. В междугородних автобусах Wi‑Fi редко стабилен — не планируйте созвоны в пути.",
  },
  {
    question: "Нужен ли местный номер для Cabify/Uber?",
    answer:
      "Регистрация часто принимает иностранный номер с SMS, но аргентинский упрощает повторные поездки. WhatsApp для уточнения адреса — норма.",
  },
  {
    question: "Как связаться с организатором тура на платформе?",
    answer:
      "После бронирования — WhatsApp или сообщения в личном кабинете. Сохраните подтверждение offline. На Patagonia-турах гид сообщает время сбора заранее.",
  },
  {
    question: "Starlink и спутниковый интернет?",
    answer:
      "Starlink появляется в Patagonia (estancia, удалённые лоджи). Для обычного туриста не нужен; цифровые кочевники уточняют наличие у арендодателя. На тропах — только без связи.",
  },
  {
    question: "Как позвонить в Россию?",
    answer:
      "WhatsApp/Telegram/FaceTime через Wi‑Fi или mobile data — бесплатно. Международные звонки с локальной SIM — отдельный тариф; проще IP-телефония.",
  },
];

export const SVYAZ_PILLAR: GuidePillarContent = {
  metadataTitle: "Связь и интернет в Аргентине — SIM, eSIM, покрытие и приложения",
  heroSubtitle:
    "SIM и eSIM, покрытие по регионам, Patagonia offline, приложения для туриста и связь с гидами — от первого дня в EZE до треккинга",
  heroCtas: [
    { label: "Операторы и SIM", href: "#svyaz-1", variant: "primary" },
    { label: "Покрытие по регионам", href: "#svyaz-3", variant: "secondary" },
    { label: "Задать вопрос", href: "/contacts?topic=svyaz", variant: "tertiary" },
  ],
  quickFacts: [
    { label: "Операторы", headline: "Claro, Personal, Movistar", detail: "Prepago по паспорту — киоски в EZE, centro BA и Calafate" },
    { label: "eSIM", headline: "Airalo, Holafly", detail: "Активируйте до вылета — без очереди, удобно на 7–14 дней" },
    { label: "4G в городах", headline: "BA, Córdoba, Mendoza, Iguazú", detail: "Стабильный LTE; в метро BA и на трассах — пробелы" },
    { label: "Patagonia тропы", headline: "Связи нет на маршруте", detail: "Offline maps, power bank и сообщите план до выхода" },
    { label: "Мессенджер", headline: "WhatsApp — основной", detail: "Гиды, отели, такси; аргентинский номер не обязателен" },
    { label: "Пополнение", headline: "Kiosco, Rapipago", detail: "Наличные песо — без местной банковской карты" },
  ],
  practicalTips: {
    do: [
      "Активируйте eSIM или купите SIM в первые 24 часа — в EZE или centro BA",
      "Скачайте Google Maps / Maps.me offline для Patagonia, Iguazú и Salta",
      "Сохраните подтверждения туров и контакт гида в offline-доступе",
      "Держите WhatsApp для связи с организатором после бронирования на платформе",
      "Возьмите power bank 10 000+ mAh на треккинг и длинные автобусы",
    ],
    consider: [
      "Локальная SIM выгоднее eSIM от 2–3 недель; eSIM удобна на короткий trip",
      "Claro/Personal сильнее в Patagonia, чем Movistar — сверьте с маршрутом",
      "VPN на публичном Wi‑Fi; для работы — проверьте скорость upload в коворкинге",
      "Dual SIM: eSIM для data + физическая линия для местного номера",
      "Пополняйте prepago небольшими суммами — тарифы в песо меняются из-за инфляции",
    ],
    avoid: [
      "Не покупайте SIM у перекупщиков без регистрации на ваш паспорт",
      "Не полагайтесь на связь на тропах Fitz Roy, W и в глубине Iguazú",
      "Не вводите банковские данные в открытых Wi‑Fi без VPN",
      "Не используйте только роуминг из РФ/СНГ на всю поездку — переплата",
      "Не откладывайте offline-карты «на потом» — в Chaltén интернет может не потянуть загрузку",
    ],
  },
  sections: [
    {
      id: "svyaz-1",
      title: "Операторы и покупка SIM иностранцу",
      content:
        "Три крупных оператора — Claro, Personal и Movistar. Туристам подходит prepago: пакет минут не нужен, берите «solo datos» или combo с WhatsApp. Регистрация только по паспорту.",
      subsections: [
        {
          title: "Где купить",
          body:
            "EZE и AEP — киоски в зале прилёта: быстро, но дороже. Centro BA (Florida, Microcentro), Palermo — салоны операторов и locutorios. Calafate, Ushuaia, Puerto Iguazú, Mendoza — салоны в центре. Возьмите паспорт, песо или USD; иностранная карта не всегда проходит.",
        },
        {
          title: "Пошагово: первый день",
          body:
            "1) Отключите домашний роуминг data. 2) Купите SIM или активируйте eSIM. 3) Активируйте пакет data в салоне или через *611 / приложение. 4) Проверьте скорость и WhatsApp. 5) Сохраните номер для Cabify и гида.",
        },
        {
          title: "Без испанского",
          body:
            "В EZE часто есть базовый English. Фразы: «Prepago solo datos, turista, pasaporte» + покажите паспорт. Сфотографируйте тарифный плакат. Попросите «activar ahora» — активация сразу.",
        },
      ],
      table: {
        headers: ["Оператор", "Покрытие Patagonia", "Где купить", "Для кого"],
        rows: [
          ["Claro", "Сильное (Calafate, Ushuaia, Chaltén)", "Салоны, kiosco, EZE", "Треккинг, юг, длинные маршруты"],
          ["Personal", "Сильное, часто лучший 4G в Chaltén", "Салоны, kiosco", "Patagonia, combo WhatsApp"],
          ["Movistar", "Среднее на юге, хорошо в BA/NOA", "Салоны, kiosco", "Короткая поездка в BA + Iguazú"],
        ],
      },
      infoBoxes: [
        {
          variant: "tip",
          title: "Сколько GB закладывать",
          body:
            "1 неделя активного туризма — 5–8 GB (навигация + мессенджеры). 2 недели — 10–15 GB. Patagonia с offline-картами — ближе к нижней границе. Hotspot для ноутбука — +5–10 GB.",
        },
        {
          variant: "warning",
          title: "Цены в песо меняются",
          body:
            "Конкретные суммы ARS в статьях устаревают за месяцы. Сверяйте пакет на месте и пересчитывайте через синий курс из раздела «Экономика и деньги».",
        },
      ],
    },
    {
      id: "svyaz-2",
      title: "eSIM, роуминг и прилёт из России/СНГ",
      content:
        "Три сценария data: eSIM до вылета, локальная SIM на месте, роуминг домашнего оператора. Для поездки 1–2 недели eSIM часто оптимальна; для месяца и дольше — локальный prepago.",
      subsections: [
        {
          title: "eSIM (Airalo, Holafly, Nomad и др.)",
          body:
            "Покупка онлайн, QR-код до вылета. Плюсы: без очереди, работает сразу после посадки. Минусы: нет локального номера, иногда дороже за GB. Проверьте поддержку eSIM телефоном.",
        },
        {
          title: "Роуминг МТС, Beeline, Tele2, MegaFon",
          body:
            "Пакеты «мир» или pay-as-you-go — удобны первые часы, но на 7+ дней выходят в $30–80+ против $10–20 локальной SIM. Оставьте линию для входящих SMS (банк, 2FA). Data — выключите или купите локально.",
        },
        {
          title: "Telegram, банки и VPN",
          body:
            "Telegram в AR не блокируется. Российские банковские приложения могут требовать SMS на домашний номер — не отключайте SIM дома. VPN полезен для публичного Wi‑Fi и привычных сервисов.",
        },
      ],
      table: {
        headers: ["Сценарий", "Срок", "Плюсы", "Минусы"],
        rows: [
          ["eSIM", "3–14 дней", "Без салона, быстрый старт", "Нет AR-номера, цена за GB"],
          ["Локальная SIM", "2+ недели", "Дёшево, местный номер", "Нужен паспорт, очередь"],
          ["Роуминг", "1–3 дня", "Нулевая настройка", "Дорого, лимиты"],
          ["Dual: eSIM + prepago", "Любой", "Гибкость", "Настройка dual-SIM"],
        ],
      },
      infoBoxes: [
        {
          variant: "info",
          title: "До вылета из РФ",
          body:
            "Купите eSIM, скачайте offline-карты Argentina, WhatsApp/Telegram, Cabify, Google Translate (испанский offline). Проверьте, что домашний банк не блокирует карту в AR.",
        },
      ],
    },
    {
      id: "svyaz-3",
      title: "Покрытие по регионам",
      content:
        "4G/LTE в крупных городах и туристических центрах — стабильно. Между городами, в нацпарках и на тропах — пробелы нормальны. Планируйте offline, а не «найду сеть на месте».",
      table: {
        headers: ["Регион", "4G в городах", "Трассы / природа", "Комментарий"],
        rows: [
          ["Buenos Aires", "Отлично", "N/A", "5G в центре растёт; метро — мёртвые зоны"],
          ["Patagonia (Calafate, Ushuaia, Chaltén)", "Хорошо в поселках", "Слабо / нет на Ruta 40", "На тропах — offline"],
          ["Iguazú / Misiones", "Хорошо в Puerto Iguazú", "Слабо в парке", "Visitor center — точка связи"],
          ["Mendoza / вино", "Хорошо", "Средне в горах", "Bodega — Wi‑Fi отеля или тура"],
          ["Salta / NOA", "Хорошо в Salta", "Пропадки в Quebrada", "Humahuaca — нестабильно"],
          ["Bariloche / Lake District", "Хорошо", "Средне к границе с Chile", "Cerro Catedral — переменно"],
        ],
      },
      subsections: [
        {
          title: "Национальные парки",
          body:
            "Los Glaciares (Perito Moreno, El Chaltén) — связь в Calafate/Chaltén, не на леднике. Iguazú — у входа и catwalks местами ловит, в джунглях нет. Tierra del Fuego — Ushuaia ok, треккинги ограничены. Talampaya, Iberá — offline + power bank.",
        },
        {
          title: "Междугородние автобусы",
          body:
            "Wi‑Fi в автобусах Sem/Todo Turismo/Chevallier — редко надёжен. Скачайте фильмы и карты заранее. USB-зарядка есть не везде — power bank обязателен.",
        },
      ],
      infoBoxes: [
        {
          variant: "warning",
          title: "Карта покрытия ≠ тропа",
          body:
            "Операторские карты оптимистичны. Fitz Roy, W-trek (сторона AR), маршруты к ледникам — реально без связи. Сообщите близким маршрут и ETA до выхода.",
        },
      ],
    },
    {
      id: "svyaz-4",
      title: "Patagonia, треккинг и offline",
      content:
        "Patagonia — главный сценарий, где связь ломает планы. Подготовка до выхода на тропу важнее выбора оператора.",
      subsections: [
        {
          title: "El Chaltén и Fitz Roy",
          body:
            "В деревне — кафе с Wi‑Fi, 4G утром/вечером лучше. Laguna de los Tres, Loma del Pliegue — без связи 8–10 часов. Скачайте Maps.me или OsmAnd, GPX от гида, offline переводчик.",
        },
        {
          title: "Calafate, Perito Moreno, Ushuaia",
          body:
            "Города связаны хорошо. На леднике и в прогулке к леднику — не рассчитывайте на стрим. Туры на платформе: гид координирует через WhatsApp накануне.",
        },
        {
          title: "Estancia и Starlink",
          body:
            "Удалённые estancia и premium lodges в Patagonia всё чаще с Starlink — уточняйте при бронировании, если нужен созвон. Обычный турист: offline + сообщение «буду без связи до …».",
        },
      ],
      infoBoxes: [
        {
          variant: "tip",
          title: "Список для Patagonia trek",
          body:
            "Offline maps ✓ · GPX маршрута ✓ · Power bank ✓ · Сообщил маршрут ✓ · Контакт гида сохранён ✓ · Фото документов в облаке ✓ · Наличные на refugio.",
        },
      ],
    },
    {
      id: "svyaz-5",
      title: "Пополнение prepago и тарифы",
      content:
        "Prepago пополняется наличными песо без банковского счёта AR. Из-за инфляции пакеты пересматривают — смотрите актуальное меню в приложении или *611.",
      subsections: [
        {
          title: "Способы пополнения",
          body:
            "Kiosco / locutorio — назовите номер и сумму, получите чек. Rapipago, Pago Fácil — терминалы в супермаркете (Coto, Carrefour). Приложения Mi Claro, Personal Flow, Movistar — с иностранной картой иногда работает. Автопродление отключите перед отъездом.",
        },
        {
          title: "Связь с оплатой в песо",
          body:
            "SIM и пополнение — в песо по местным ценам. Пересчитывайте через синий курс (/guide/ekonomika-i-dengi). USD в kiosco не всегда принимают — имейте песо после обмена.",
        },
        {
          title: "Долгое проживание (1–3 месяца)",
          body:
            "Prepago с ежемесячным пакетом 20–40 GB обычно достаточно. Контракт с DNI — для резидентов; турист на паспорту остаётся на prepago. Подробнее — /immigration.",
        },
      ],
      infoBoxes: [
        {
          variant: "info",
          title: "USSD-команды",
          body:
            "*611 — меню оператора. Приложение или *100# — остаток data. Сохраните скриншот инструкции из салона — пригодится при пополнении.",
        },
      ],
    },
    {
      id: "svyaz-6",
      title: "Wi‑Fi, VPN и безопасность в сети",
      content:
        "Wi‑Fi в отелях, кафе Palermo, coworking BA — рабочий вариант для созвонов. Публичные сети — с осторожностью.",
      subsections: [
        {
          title: "Где Wi‑Fi надёжен",
          body:
            "Отели 3–4*, coworking (Palermo, Microcentro), кафе с laptop-толпой. Аэропорт EZE — есть, но не для банка. Hostel — переменно; уточняйте скорость для remote work.",
        },
        {
          title: "VPN и банк",
          body:
            "VPN на публичном Wi‑Fi — да. Домашний банк РФ через мобильный интернет AR обычно работает без VPN. Не вводите CVV в подозрительных captive portal.",
        },
        {
          title: "Телефон и snatch theft",
          body:
            "SIM привязана к паспорту — при краже заблокируйте линию в салоне оператора с копией паспорта. Не демонстрируйте телефон у проезжей части в BA — см. /guide/bezopasnost.",
        },
      ],
    },
    {
      id: "svyaz-7",
      title: "Приложения и цифровые сервисы",
      content:
        "Без набора приложений BA и регионы неудобны. Часть работает только с интернетом; SUBE и Cabify проще с местной SIM.",
      subsections: [
        {
          title: "Must-have для туриста",
          body:
            "Google Maps (+ offline) · WhatsApp · Cabify / Uber · Google Translate (offline ES) · Aerolíneas / airline app · Подтверждения брони offline · Windy для Patagonia.",
        },
        {
          title: "Buenos Aires",
          body:
            "SUBE — карта метро/автобус (пополнение в kiosco). BA Cómo Llego / Moovit — транспорт. PedidosYa / Rappi — доставка. Mercado Pago — для locals; туристу чаще наличные.",
        },
        {
          title: "Без испанского",
          body:
            "Translate camera mode для меню и тарифов SIM. DeepL для переписки с гидом. Шаблон WhatsApp: «Hola, soy turista, reserva #…».",
        },
      ],
      table: {
        headers: ["Приложение", "Зачем", "Нужен AR-номер?"],
        rows: [
          ["WhatsApp", "Гиды, отели, такси", "Нет, нужен интернет"],
          ["Cabify / Uber", "Такси", "SMS при регистрации"],
          ["Google Maps offline", "Patagonia, Iguazú", "Нет"],
          ["Windy", "Ветер Patagonia", "Нет"],
          ["SUBE / Cómo Llego", "Метро BA", "Нет для карты SUBE"],
        ],
      },
    },
    {
      id: "svyaz-8",
      title: "Связь с гидами, платформой и удалённая работа",
      content:
        "На «Пора в Аргентину» бронирование и связь с организатором идут через WhatsApp и подтверждения в личном кабинете.",
      subsections: [
        {
          title: "После бронирования тура",
          body:
            "Сохраните PDF/скрин с датой, местом сбора и телефоном гида. Напишите в WhatsApp за 24–48 ч до старта. На Patagonia-турах точка сбора может зависеть от погоды.",
        },
        {
          title: "Если связь пропала на туре",
          body:
            "Организованные туры с гидом не требуют вашей связи на тропе — гид отвечает за группу. Самостоятельный треккинг — offline maps и регистрация в refugio.",
        },
        {
          title: "Цифровой кочевник light",
          body:
            "BA (Palermo, Belgrano) — coworking 20–50 Mbps часто достаточно для Zoom. Patagonia — не место для daily standup. Проверьте upload на speedtest до оплаты жилья.",
        },
      ],
      infoBoxes: [
        {
          variant: "tip",
          title: "Связка с другими разделами",
          body:
            "Деньги на SIM — /guide/ekonomika-i-dengi · Документы и аэропорт — /guide/kak-dobratsya · Безопасность телефона — /guide/bezopasnost · Жильё с Wi‑Fi — /guide/gde-zhit.",
        },
      ],
    },
  ],
  faq: SVYAZ_FAQ,
  recommendIntro:
    "Нужен PDF-список по связи под ваш маршрут или тур с гидом, который координирует логистику в Patagonia?",
  blogLinks: [
    { title: "Как добраться", href: "/guide/kak-dobratsya", description: "EZE, документы, первый день" },
    { title: "Экономика и деньги", href: "/guide/ekonomika-i-dengi", description: "Песо на SIM и пополнение" },
    { title: "Безопасность", href: "/guide/bezopasnost", description: "Телефон и карманники" },
    { title: "Что взять в Patagonia", href: "/blog/patagonia-packing-list", description: "Power bank и offline" },
  ],
  partnerServices: [
    {
      title: "Туры с гидом в Patagonia",
      description: "Гид на связи до и после треккинга — логистика без сюрпризов.",
      href: "/tours?region=Patagonia",
      ctaLabel: "Смотреть туры",
    },
    {
      title: "PDF-списки в магазине",
      description: "Списки для поездки, включая связь и offline-подготовку.",
      href: "/shop",
      ctaLabel: "Магазин",
    },
    {
      title: "Консультация по маршруту",
      description: "Подскажем, где будет связь на вашем маршруте.",
      href: "/contacts?topic=svyaz",
      ctaLabel: "Связаться",
    },
  ],
};
