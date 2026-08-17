import type { BlogPost } from "@/types";
import { formatBlogReadTime } from "@/lib/blog-utils";
import { resolveBlogPostCardImage } from "@/lib/media-resolver";
import { BLOG_EDITORIAL } from "@/data/blog-author";
import { BLOG_START_HERE_SLUGS } from "@/data/blog-canonical-map";
import { getBlogTourEmbeds } from "@/data/blog-tour-embeds";
import { getPublishedPlanPosts } from "@/lib/blog-from-plan";
import { manualPostsFromMd, REPLACED_MANUAL_SLUGS } from "@/data/blog-manual-from-md";
import { BEST_TIME_TO_VISIT_ARGENTINA_POST } from "@/data/blog-best-time-to-visit-argentina";
import { ARGENTINIAN_STEAK_GUIDE_POST } from "@/data/blog-argentinian-steak-guide";
import { PATAGONIA_PACKING_LIST_POST } from "@/data/blog-patagonia-packing-list";
import { TANGO_BEGINNERS_GUIDE_POST } from "@/data/blog-tango-beginners-guide";
import { EL_CHALTEN_I_FITTS_ROY_POST } from "@/data/blog-el-chalten-i-fitts-roy";
import { SALTA_I_SEVERO_ZAPAD_MARSHRUT_POST } from "@/data/blog-salta-i-severo-zapad-marshrut";
import { ARGENTINA_TOURIST_VISA_2026_POST } from "@/data/blog-argentina-tourist-visa-2026";
import { PATAGONIYA_MARSHRUT_14_DNEY_POST } from "@/data/blog-patagoniya-marshrut-14-dney";
import { ITINERARY_ZA_14_DNEY_POST } from "@/data/blog-itinerary-za-14-dney";
import { ITINERARY_ZA_10_DNEY_POST } from "@/data/blog-itinerary-za-10-dney";
import { ITINERARY_CHEK_LIST_POST } from "@/data/blog-itinerary-chek-list";
import { ITINERARY_OSHIBKI_POST } from "@/data/blog-itinerary-oshibki";
import { IGUAZU_ZA_3_DNYA_POST } from "@/data/blog-iguazu-za-3-dnya";
import { PATAGONIA_AVIABILETY_POST } from "@/data/blog-patagonia-aviabilety";
import { PATAGONIA_PENGUINS_POST } from "@/data/blog-patagonia-penguins";
import { IGUAZU_GARGANTA_DEL_DIABLO_POST } from "@/data/blog-iguazu-garganta-del-diablo";
import { PATAGONIA_WHALE_WATCHING_POST } from "@/data/blog-patagonia-whale-watching";
import { UCO_VALLEY_VINO_I_GORY_POST } from "@/data/blog-uco-valley-vino-i-gory";
import { WILDLIFE_S_GIDOM_POST } from "@/data/blog-wildlife-s-gidom";

const rt = (minutes: number) => formatBlogReadTime(minutes);

const editorialAuthor = BLOG_EDITORIAL.name;
const editorialBio = BLOG_EDITORIAL.bio;

const legacyManualBlogPosts: BlogPost[] = [
  {
    ...BEST_TIME_TO_VISIT_ARGENTINA_POST,
    content: "",
    image: "",
  },
  {
    ...ARGENTINIAN_STEAK_GUIDE_POST,
    content: "",
    image: "",
  },
  {
    ...TANGO_BEGINNERS_GUIDE_POST,
    content: "",
    image: "",
  },
  {
    ...PATAGONIA_PACKING_LIST_POST,
    content: "",
    image: "",
  },
  {
    ...EL_CHALTEN_I_FITTS_ROY_POST,
    content: "",
    image: "",
  },
  {
    ...SALTA_I_SEVERO_ZAPAD_MARSHRUT_POST,
    content: "",
    image: "",
  },
  {
    ...ARGENTINA_TOURIST_VISA_2026_POST,
    content: "",
    image: "",
  },
  {
    ...PATAGONIYA_MARSHRUT_14_DNEY_POST,
    content: "",
    image: "",
  },
  {
    ...PATAGONIA_AVIABILETY_POST,
    content: "",
    image: "",
  },
  {
    ...PATAGONIA_PENGUINS_POST,
    content: "",
    image: "",
  },
  {
    ...IGUAZU_GARGANTA_DEL_DIABLO_POST,
    content: "",
    image: "",
  },
  {
    ...IGUAZU_ZA_3_DNYA_POST,
    content: "",
    image: "",
  },
  {
    ...PATAGONIA_WHALE_WATCHING_POST,
    content: "",
    image: "",
  },
  {
    id: "5",
    slug: "blue-dollar-argentina-2026",
    title: "Синий доллар и оплата в Аргентине: что нужно знать туристу",
    seoTitle: "Синий доллар и оплата в Аргентине: что нужно знать туристу",
    excerpt:
      "Разберёмся, что такое dólar blue, стоит ли менять наличные и как сейчас выгоднее платить в Аргентине.",
    sections: [
      {
        title: "Введение",
        body:
          "Если вы читали старые путеводители по Аргентине, то наверняка встречали советы вроде:\n\n* «Везите только наличные доллары»;\n* «Меняйте деньги на улице Флорида»;\n* «Никогда не платите картой».\n\nВалютные правила и разница между курсами меняются, поэтому универсальный совет быстро устаревает. Перед поездкой и крупной оплатой сравните актуальный курс вашего банка, официальный ориентир и доступный легальный обмен.\n\nРазберёмся, что такое dólar blue и как выбрать способ оплаты без обещания фиксированной выгоды.",
      },
      {
        title: "Что такое синий доллар (Dólar Blue)",
        body:
          "Синий доллар — это неофициальный рыночный курс обмена долларов США на аргентинские песо.\n\nОн появился из-за многолетних валютных ограничений и высокой инфляции. Когда официальный курс сильно отличался от реального рыночного курса, возник параллельный рынок обмена валют. (Википедия)\n\nИменно этот курс аргентинцы называют:\n\nDólar Blue\n\nили\n\nСиний доллар.",
      },
      {
        title: "Почему раньше все говорили про синий доллар",
        body:
          "До реформ последних лет разница между официальным курсом и курсом dólar blue могла достигать 50–100% и даже больше.\n\nПоэтому туристы:\n\n* привозили наличные доллары;\n* меняли их через обменные пункты или посредников;\n* получали значительно больше песо, чем при оплате картой. (Buenos Aires Times)\n\nФактически это была одна из главных туристических хитростей в Аргентине.",
      },
      {
        title: "Что изменилось сейчас",
        body:
          "Валютная система Аргентины меняется, а разница между способами оплаты не является постоянной. Иностранная карта может получить специальный карточный курс, но итог зависит от платёжной системы, банка-эмитента, комиссии и даты расчёта. Сравнивайте сумму списания перед подтверждением операции; старые проценты из путеводителей нельзя использовать как текущую гарантию.",
      },
      {
        title: "Что такое курс MEP",
        body:
          "MEP — рыночный механизм обмена валюты. Для некоторых операций по иностранным Visa и Mastercard платёжные системы используют специальный порядок конвертации, но конкретный курс и комиссия определяются правилами системы и банка. Проверьте расчёт у своего эмитента; близость к dólar blue не гарантируется.",
      },
      {
        title: "Что выгоднее: карта или наличные",
        body:
          "Короткий ответ:\n\nДля большинства туристов удобнее и безопаснее платить картой.",
      },
      {
        title: "Карта",
        body:
          "Плюсы:\n\n* безопасно;\n* удобно;\n* не нужно носить большие суммы;\n* хороший курс MEP;\n* принимается почти везде. (Biker Street Buenos Aires Bike Tours)\n\nМинусы:\n\n* иногда терминалы не работают;\n* небольшие магазины могут принимать только наличные.",
      },
      {
        title: "Наличные доллары",
        body:
          "Плюсы:\n\n* иногда можно получить немного лучший курс;\n* полезны как резерв;\n* нужны в некоторых небольших городах. (solsalute.com)\n\nМинусы:\n\n* риск потери или кражи;\n* необходимость искать обмен;\n* не всегда удобно носить крупные суммы.",
      },
      {
        title: "Нужно ли везти доллары",
        body:
          "Да, но уже не в тех объёмах, как раньше.\n\nОптимальный вариант:\n\n* основная часть расходов — картой;\n* небольшой запас долларов — на случай непредвиденных ситуаций. (Asadoadventure)\n\nОсобенно это актуально для поездок в:\n\n* Патагонию;\n* небольшие города;\n* удалённые национальные парки.",
      },
      {
        title: "Какие карты работают лучше всего",
        body:
          "Международные Visa и Mastercard обычно принимаются в туристических местах, но поддержка зависит от конкретной карты, банка и терминала. Карты, выпущенные российскими банками, за рубежом обычно не обслуживаются международными платёжными системами; заранее подготовьте другой законный способ оплаты. American Express принимают реже. До поездки уточните условия и комиссии у банка-эмитента.",
      },
      {
        title: "В какой валюте платить",
        body:
          "Если терминал предлагает выбор:\n\n* USD;\n* ARS.\n\nВсегда выбирайте:\n\nARS (аргентинские песо).\n\nЭто позволит вашему банку применить собственную конвертацию и избежать невыгодного курса терминала.",
      },
      {
        title: "Нужен ли Western Union",
        body:
          "Western Union остаётся популярным способом получения наличных песо.\n\nПреимущества:\n\n* хороший курс;\n* возможность получить наличные без банковского счёта в Аргентине. (Biker Street Buenos Aires Bike Tours)\n\nНедостатки:\n\n* очереди;\n* некоторые отделения могут временно оставаться без наличных. (Biker Street Buenos Aires Bike Tours)\n\nДля большинства туристов сегодня Western Union уже не является обязательным инструментом.",
      },
      {
        title: "Где наличные всё ещё полезны",
        body:
          "Даже в 2026 году наличные пригодятся:\n\n* для чаевых;\n* на рынках;\n* у небольших продавцов;\n* в некоторых такси;\n* в небольших населённых пунктах;\n* при покупке сувениров. (Asadoadventure)",
      },
      {
        title: "Типичные ошибки туристов",
        body:
          "Везти только наличные\n\nСейчас это уже не даёт такого преимущества, как раньше.\n\n⸻\n\nВезти только карту\n\nНебольшой запас наличных всё ещё нужен.\n\n⸻\n\nПользоваться банкоматами без необходимости\n\nБанкоматы часто берут высокие комиссии и редко являются лучшим способом получения песо. (Biker Street Buenos Aires Bike Tours)\n\n⸻\n\nПлатить в долларах вместо песо\n\nВ большинстве случаев это приводит к менее выгодной конвертации.",
      },
      {
        title: "Часто задаваемые вопросы",
        body:
          "Существует ли синий доллар? Параллельный рынок известен под этим названием, но его спред меняется. Что выгоднее: карта или наличные? Сравните курс и комиссии в день операции; карта часто удобнее, но не гарантирует лучшую цену. Можно ли ехать только с картой? Не стоит: терминал или связь могут не работать, поэтому нужен законный резервный способ оплаты. Работают ли карты российских банков? На международное обслуживание таких карт рассчитывать нельзя; уточняйте статус у эмитента и подготовьте альтернативу. Сколько наличных брать? Оцените несколько дней обязательных расходов без универсальной суммы.",
      },
      {
        title: "Итог",
        body:
          "Не опирайтесь на фиксированную разницу курсов из статьи: она меняется. Практичная стратегия — заранее проверить условия своей иностранной карты, сравнивать сумму перед оплатой и иметь законный резерв на случай недоступности терминала. Официальные ориентиры: материалы BCRA о валютном режиме и правила конвертации вашей платёжной системы; дата этой редакционной проверки указана в карточке статьи.",
      },
    ],
    content: "",
    author: editorialAuthor,
    authorBio: editorialBio,
    date: "2026-06-01",
    dateModified: "2026-07-15",
    image: "",
    category: "Путеводитель",
    readTimeMinutes: 12,
    readTime: rt(12),
    tags: ["деньги", "dólar blue", "обмен", "карты", "ARS", "MEP"],
    editorialReviewed: true,
    cardVariant: "standard",
    relatedResources: [
      { label: "Оплата картой", href: "/blog/money-карты", type: "blog" },
      { label: "Наличные в Аргентине", href: "/blog/money-наличные", type: "blog" },
      { label: "Деньги: советы новичкам", href: "/blog/money-советы-новичкам", type: "blog" },
      { label: "Чек-лист перед поездкой", href: "/blog/itinerary-чек-лист", type: "blog" },
      { label: "Экономика и деньги", href: "/guide/ekonomika-i-dengi", type: "guide" },
    ],
  },
  {
    ...UCO_VALLEY_VINO_I_GORY_POST,
    content: "",
    image: "",
  },
  {
    ...ITINERARY_OSHIBKI_POST,
    content: "",
    image: "",
  },
  {
    ...ITINERARY_ZA_10_DNEY_POST,
    content: "",
    image: "",
  },
  {
    ...ITINERARY_ZA_14_DNEY_POST,
    content: "",
    image: "",
  },
  {
    ...ITINERARY_CHEK_LIST_POST,
    content: "",
    image: "",
  },
  {
    id: "blog-tierra-del-fuego-np",
    slug: "natsionalnyy-park-tierra-del-fuego",
    title: "Национальный парк Огненная Земля: Ушуайя и край света (гид 2026)",
    seoTitle: "Парк Огненная Земля: Ушуайя и край света — гид 2026",
    excerpt:
      "Подробный гид по национальному парку Огненная Земля: Ушуайя, поезд на край света, залив Лапатайя, тропы, цены на билеты 2026, как добраться и когда ехать.",
    sections: [],
    content: "",
    author: editorialAuthor,
    authorBio: editorialBio,
    date: "2026-06-20",
    dateModified: "2026-06-21",
    image: "/media/places/tierra-del-fuego-national-park/hero.jpg",
    category: "Национальные парки",
    readTimeMinutes: 18,
    readTime: rt(18),
    tags: [
      "Огненная Земля",
      "Ушуайя",
      "нацпарки",
      "Патагония",
      "треккинг",
      "край света",
      "Лапатайя",
    ],
    featured: true,
    cardVariant: "featured",
    editorialReviewed: true,
    richArticleId: "tierra-del-fuego-national-park",
    relatedResources: [
      {
        label: "Парк Огненная Земля",
        href: "/places/tierra-del-fuego-national-park",
        type: "guide",
      },
      { label: "Ушуайя", href: "/places/ushuaia", type: "guide" },
      {
        label: "Лос-Гласьярес",
        href: "/places/los-glaciares-national-park",
        type: "guide",
      },
      {
        label: "Науэль-Уапи",
        href: "/places/nahuel-huapi-national-park",
        type: "guide",
      },
    ],
    tourEmbeds: [
      {
        id: "patagonia-ushuaia-featured",
        variant: "featured",
        title: "Туры в Патагонию и Ушуайю",
        subtitle: "Край света, ледники и пролив Бигль — с гидом и логистикой",
        limit: 3,
        source: { kind: "query", query: "Ushuaia Patagonia" },
        catalogHref: "/tours?query=Patagonia",
        catalogLabel: "Туры в Патагонию",
        tone: "inline",
      },
    ],
  },
  {
    id: "blog-nahuel-huapi-np",
    slug: "natsionalnyy-park-nauel-uapi",
    title: "Национальный парк Науэль-Уапи: Барилоче, озёра и горы (гид 2026)",
    seoTitle: "Парк Науэль-Уапи: Барилоче, озёра и горы — гид 2026",
    excerpt:
      "Подробный гид по национальному парку Науэль-Уапи: Барилоче, Серро-Тронадор, Малый круг, остров Виктория, треккинг, цены на билеты 2026, как добраться и когда ехать.",
    sections: [],
    content: "",
    author: editorialAuthor,
    authorBio: editorialBio,
    date: "2026-06-20",
    dateModified: "2026-06-21",
    image: "/media/places/nahuel-huapi-national-park/hero.jpg",
    category: "Национальные парки",
    readTimeMinutes: 20,
    readTime: rt(20),
    tags: [
      "Науэль-Уапи",
      "Барилоче",
      "нацпарки",
      "Патагония",
      "треккинг",
      "озёра",
      "Серро-Тронадор",
    ],
    featured: true,
    cardVariant: "featured",
    editorialReviewed: true,
    richArticleId: "nahuel-huapi-national-park",
    relatedResources: [
      {
        label: "Парк Науэль-Уапи",
        href: "/places/nahuel-huapi-national-park",
        type: "guide",
      },
      { label: "Барилоче", href: "/places/bariloche", type: "guide" },
      {
        label: "Лос-Гласьярес",
        href: "/places/los-glaciares-national-park",
        type: "guide",
      },
      {
        label: "Огненная Земля",
        href: "/blog/natsionalnyy-park-tierra-del-fuego",
        type: "guide",
      },
      { label: "Игуасу", href: "/places/iguazu-falls", type: "guide" },
    ],
    tourEmbeds: [
      {
        id: "bariloche-nahuel-huapi-featured",
        variant: "featured",
        title: "Туры в Барилоче и Науэль-Уапи",
        subtitle: "Озёра, горы и Малый круг — с гидом и логистикой",
        limit: 3,
        source: { kind: "query", query: "Bariloche Nahuel Huapi" },
        catalogHref: "/tours?query=Bariloche",
        catalogLabel: "Туры в Барилоче",
        tone: "inline",
      },
    ],
  },
  {
    id: "blog-los-glaciares-np",
    slug: "natsionalnyy-park-los-glasiares",
    title: "Национальный парк Лос-Гласьярес: ледник Перито-Морено и Фицрой (гид 2026)",
    seoTitle: "Парк Лос-Гласьярес: Перито-Морено и Фицрой, гид 2026",
    excerpt:
      "Гид по парку Лос-Гласьярес 2026: ледник Перито-Морено, треккинг к Фицрою, цены на билеты, как добраться, когда ехать и практические советы.",
    sections: [],
    content: "",
    author: editorialAuthor,
    authorBio: editorialBio,
    date: "2026-06-20",
    dateModified: "2026-06-21",
    image: "/media/places/los-glaciares-national-park/hero.jpg",
    category: "Национальные парки",
    readTimeMinutes: 22,
    readTime: rt(22),
    tags: [
      "Лос-Гласьярес",
      "Перито-Морено",
      "Эль-Калафате",
      "Эль-Чальтен",
      "Фицрой",
      "нацпарки",
      "Патагония",
      "треккинг",
    ],
    featured: true,
    cardVariant: "featured",
    editorialReviewed: true,
    richArticleId: "los-glaciares-national-park",
    relatedResources: [
      {
        label: "Парк Лос-Гласьярес",
        href: "/places/los-glaciares-national-park",
        type: "guide",
      },
      { label: "Эль-Калафате", href: "/places/el-calafate", type: "guide" },
      { label: "Эль-Чальтен", href: "/places/el-chalten", type: "guide" },
      {
        label: "Ледник Перито-Морено",
        href: "/places/perito-moreno-glacier",
        type: "guide",
      },
      {
        label: "Науэль-Уапи",
        href: "/blog/natsionalnyy-park-nauel-uapi",
        type: "guide",
      },
      {
        label: "Огненная Земля",
        href: "/blog/natsionalnyy-park-tierra-del-fuego",
        type: "guide",
      },
    ],
    tourEmbeds: [
      {
        id: "calafate-perito-moreno-featured",
        variant: "featured",
        title: "Туры в Эль-Калафате и к леднику",
        subtitle: "Перито-Морено, катера и ледники — с гидом и логистикой",
        limit: 3,
        source: { kind: "query", query: "El Calafate Perito Moreno" },
        catalogHref: "/tours?query=Calafate",
        catalogLabel: "Туры в Эль-Калафате",
        tone: "inline",
      },
    ],
  },
  {
    id: "blog-iguazu-np",
    slug: "natsionalnyy-park-iguasu",
    title: "Национальный парк Игуасу: полный гид по водопадам Аргентины (2026)",
    seoTitle: "Национальный парк Игуасу: гид 2026, водопады и цены",
    excerpt:
      "Полный гид по парку Игуасу 2026: водопады, маршруты, цены на билеты, как добраться из Буэнос-Айреса, когда ехать и практические советы.",
    sections: [],
    content: "",
    author: editorialAuthor,
    authorBio: editorialBio,
    date: "2026-06-20",
    dateModified: "2026-06-21",
    image: "/media/places/iguazu-falls/hero.jpg",
    category: "Национальные парки",
    readTimeMinutes: 21,
    readTime: rt(21),
    tags: [
      "Игуасу",
      "водопады",
      "Пуэрто-Игуасу",
      "Глотка Дьявола",
      "нацпарки",
      "Мисьонес",
      "сельва",
    ],
    featured: true,
    cardVariant: "featured",
    editorialReviewed: true,
    richArticleId: "iguazu-national-park",
    relatedResources: [
      { label: "Водопады Игуасу", href: "/places/iguazu-falls", type: "guide" },
      {
        label: "Лос-Гласьярес",
        href: "/blog/natsionalnyy-park-los-glasiares",
        type: "guide",
      },
      {
        label: "Науэль-Уапи",
        href: "/blog/natsionalnyy-park-nauel-uapi",
        type: "guide",
      },
      {
        label: "Огненная Земля",
        href: "/blog/natsionalnyy-park-tierra-del-fuego",
        type: "guide",
      },
    ],
    tourEmbeds: [
      {
        id: "iguazu-falls-featured",
        variant: "featured",
        title: "Экскурсии к водопадам Игуасу",
        subtitle: "Глотка Дьявола, маршруты по парку — с гидом и трансфером",
        limit: 3,
        source: { kind: "query", query: "Iguazu falls" },
        catalogHref: "/tours?query=Iguazu",
        catalogLabel: "Туры в Игуасу",
        tone: "inline",
      },
    ],
  },
  {
    id: "blog-valdes-np",
    slug: "natsionalnyy-park-poluostrov-valdes",
    title: "Национальный парк Полуостров Вальдес: киты, пингвины и морская природа (гид 2026)",
    seoTitle: "Полуостров Вальдес: киты, пингвины и wildlife — гид 2026",
    excerpt:
      "Гид по полуострову Valdés 2026: southern right whales, пингвины, Punta Norte, Puerto Madryn, сезоны, цены и как добраться. UNESCO и Reserva Faunística Chubut.",
    sections: [],
    content: "",
    author: editorialAuthor,
    authorBio: editorialBio,
    date: "2026-06-21",
    dateModified: "2026-06-21",
    image: "",
    category: "Национальные парки",
    readTimeMinutes: 18,
    readTime: rt(18),
    tags: [
      "Вальдес",
      "Puerto Madryn",
      "киты",
      "пингвины",
      "wildlife",
      "UNESCO",
      "Патагония",
    ],
    featured: true,
    cardVariant: "featured",
    editorialReviewed: true,
    richArticleId: "valdes-peninsula-national-park",
    relatedResources: [
      { label: "Полуостров Вальдес", href: "/places/valdes-peninsula", type: "guide" },
      { label: "Puerto Madryn", href: "/places/puerto-madryn", type: "guide" },
      { label: "Los Glaciares", href: "/blog/natsionalnyy-park-los-glasiares", type: "guide" },
      { label: "Все нацпарки", href: "/blog/natsionalnye-parki-argentiny", type: "guide" },
    ],
    tourEmbeds: [
      {
        id: "valdes-whale-featured",
        variant: "featured",
        title: "Наблюдение за китами на Вальдесе",
        subtitle: "Киты, пингвины и морские экскурсии из Puerto Madryn",
        limit: 3,
        source: { kind: "query", query: "Valdes whale Puerto Madryn" },
        catalogHref: "/tours?query=Valdes",
        catalogLabel: "Туры на Вальдес",
        tone: "inline",
      },
    ],
  },
  {
    id: "blog-all-argentina-nps",
    slug: "natsionalnye-parki-argentiny",
    title: "Все национальные парки Аргентины: полный список и гид (2026)",
    seoTitle: "Все национальные парки Аргентины: список и гид 2026",
    excerpt:
      "Все национальные парки Аргентины 2026: полный список из ~39 парков по регионам, сравнительная таблица, объекты ЮНЕСКО, цены и как выбрать парк.",
    sections: [],
    content: "",
    author: editorialAuthor,
    authorBio: editorialBio,
    date: "2026-06-21",
    dateModified: "2026-06-21",
    image: "",
    category: "Национальные парки",
    readTimeMinutes: 16,
    readTime: rt(16),
    tags: ["нацпарки", "обзор", "ЮНЕСКО", "APN", "список парков", "Аргентина"],
    featured: true,
    cardVariant: "featured",
    editorialReviewed: true,
    richArticleId: "all-argentina-national-parks",
    relatedResources: [
      { label: "Игуасу", href: "/blog/natsionalnyy-park-iguasu", type: "guide" },
      { label: "Лос-Гласьярес", href: "/blog/natsionalnyy-park-los-glasiares", type: "guide" },
      { label: "Науэль-Уапи", href: "/blog/natsionalnyy-park-nauel-uapi", type: "guide" },
      { label: "Огненная Земля", href: "/blog/natsionalnyy-park-tierra-del-fuego", type: "guide" },
    ],
  },
  {
    id: "blog-ibera-np",
    slug: "natsionalnyy-park-ibera",
    title: "Национальный парк Ибера: болота Корриентеса и возвращение ягуаров (гид 2026)",
    seoTitle: "Парк Ибера: болота Корриентеса и ягуары — гид 2026",
    excerpt:
      "Гид по парку Ибера 2026: болота Эстерос-дель-Ибера, сафари, ягуары и рейуайлдинг, порталы, цены, как добраться и когда ехать в Корриентес.",
    sections: [],
    content: "",
    author: editorialAuthor,
    authorBio: editorialBio,
    date: "2026-06-21",
    dateModified: "2026-06-21",
    image: "",
    category: "Национальные парки",
    readTimeMinutes: 19,
    readTime: rt(19),
    tags: ["Ибера", "Корриентес", "нацпарки", "болота", "ягуар", "рейуайлдинг", "сафари"],
    featured: true,
    cardVariant: "featured",
    editorialReviewed: true,
    richArticleId: "ibera-national-park",
    relatedResources: [
      { label: "Игуасу", href: "/blog/natsionalnyy-park-iguasu", type: "guide" },
      { label: "Все нацпарки", href: "/blog/natsionalnye-parki-argentiny", type: "guide" },
    ],
  },
  {
    id: "blog-lanin-np",
    slug: "natsionalnyy-park-lanin",
    title: "Национальный парк Ланин: вулкан, араукарии и озёра Неукена (гид 2026)",
    seoTitle: "Парк Ланин: вулкан, араукарии и озёра — гид 2026",
    excerpt:
      "Гид по парку Ланин 2026: вулкан Ланин, араукарии-пеуэн, озёра Неукена, восхождение, рыбалка, цены, как добраться и когда ехать в Патагонию.",
    sections: [],
    content: "",
    author: editorialAuthor,
    authorBio: editorialBio,
    date: "2026-06-21",
    dateModified: "2026-06-21",
    image: "",
    category: "Национальные парки",
    readTimeMinutes: 20,
    readTime: rt(20),
    tags: ["Ланин", "Неукен", "нацпарки", "Патагония", "вулкан", "араукария", "треккинг"],
    featured: true,
    cardVariant: "featured",
    editorialReviewed: true,
    richArticleId: "lanin-national-park",
    relatedResources: [
      { label: "Науэль-Уапи", href: "/blog/natsionalnyy-park-nauel-uapi", type: "guide" },
      { label: "Барилоче", href: "/places/bariloche", type: "guide" },
      { label: "Лос-Алерсес", href: "/blog/natsionalnyy-park-los-alerses", type: "guide" },
    ],
  },
  {
    id: "blog-los-alerces-np",
    slug: "natsionalnyy-park-los-alerses",
    title: "Национальный парк Лос-Алерсес: тысячелетние деревья и озёра Чубута (гид 2026)",
    seoTitle: "Парк Лос-Алерсес: тысячелетние деревья — гид 2026",
    excerpt:
      "Гид по парку Лос-Алерсес 2026: тысячелетние деревья-алерсе, озёра Чубута, лодка к Эль-Абуэло, цены, как добраться и когда ехать. Объект ЮНЕСКО.",
    sections: [],
    content: "",
    author: editorialAuthor,
    authorBio: editorialBio,
    date: "2026-06-21",
    dateModified: "2026-06-21",
    image: "",
    category: "Национальные парки",
    readTimeMinutes: 19,
    readTime: rt(19),
    tags: ["Лос-Алерсес", "Чубут", "нацпарки", "ЮНЕСКО", "алерсе", "Эскель", "леса"],
    featured: true,
    cardVariant: "featured",
    editorialReviewed: true,
    richArticleId: "los-alerces-national-park",
    relatedResources: [
      { label: "Ланин", href: "/blog/natsionalnyy-park-lanin", type: "guide" },
      { label: "Лос-Гласьярес", href: "/blog/natsionalnyy-park-los-glasiares", type: "guide" },
      { label: "Науэль-Уапи", href: "/blog/natsionalnyy-park-nauel-uapi", type: "guide" },
    ],
  },
  {
    id: "blog-los-cardones-np",
    slug: "natsionalnyy-park-los-cardones",
    title: "Национальный парк Лос-Кардонес: гигантские кактусы и высокогорная пустыня Сальты (гид 2026)",
    seoTitle: "Парк Лос-Кардонес: кактусы и пустыня Сальты — гид 2026",
    excerpt:
      "Гид по парку Лос-Кардонес 2026: гигантские кактусы-кардоны, Куэста-дель-Обиспо, Прямая Тин-Тин, следы динозавров, бесплатный вход и как добраться.",
    sections: [],
    content: "",
    author: editorialAuthor,
    authorBio: editorialBio,
    date: "2026-06-21",
    dateModified: "2026-06-21",
    image: "",
    category: "Национальные парки",
    readTimeMinutes: 18,
    readTime: rt(18),
    tags: ["Лос-Кардонес", "Сальта", "нацпарки", "кактусы", "северо-запад", "Куэста-дель-Обиспо"],
    featured: true,
    cardVariant: "featured",
    editorialReviewed: true,
    richArticleId: "los-cardones-national-park",
    relatedResources: [
      { label: "Сальта", href: "/places/salta", type: "guide" },
      { label: "Талампая", href: "/blog/natsionalnyy-park-talampaya", type: "guide" },
      { label: "Все нацпарки", href: "/blog/natsionalnye-parki-argentiny", type: "guide" },
    ],
  },
  {
    id: "blog-patagonia-np",
    slug: "natsionalnyy-park-patagonia",
    title: "Национальный парк Патагония: дикие плато и степь Санта-Круса (гид 2026)",
    seoTitle: "Парк Патагония: плато, степь и кондоры — гид 2026",
    excerpt:
      "Гид по Национальному парку Патагония 2026: плато Санта-Круса, озеро Буэнос-Айрес, маса тобиано, тропы, бесплатный вход и как добраться по Руте 40.",
    sections: [],
    content: "",
    author: editorialAuthor,
    authorBio: editorialBio,
    date: "2026-06-21",
    dateModified: "2026-06-21",
    image: "",
    category: "Национальные парки",
    readTimeMinutes: 18,
    readTime: rt(18),
    tags: ["Патагония", "Санта-Крус", "нацпарки", "степь", "кондор", "Рута 40"],
    featured: true,
    cardVariant: "featured",
    editorialReviewed: true,
    richArticleId: "patagonia-national-park",
    relatedResources: [
      { label: "Лос-Гласьярес", href: "/blog/natsionalnyy-park-los-glasiares", type: "guide" },
      { label: "Эль-Калафате", href: "/places/el-calafate", type: "guide" },
      { label: "Огненная Земля", href: "/blog/natsionalnyy-park-tierra-del-fuego", type: "guide" },
    ],
  },
  {
    id: "blog-talampaya-np",
    slug: "natsionalnyy-park-talampaya",
    title: "Национальный парк Талампая: красный каньон и динозавры Ла-Риохи (гид 2026)",
    seoTitle: "Парк Талампая: красный каньон Ла-Риохи — гид 2026",
    excerpt:
      "Гид по парку Талампая 2026: красные каньоны Ла-Риохи, динозавры триаса, петроглифы, цены, экскурсии и как добраться. Объект ЮНЕСКО в Аргентине.",
    sections: [],
    content: "",
    author: editorialAuthor,
    authorBio: editorialBio,
    date: "2026-06-21",
    dateModified: "2026-06-21",
    image: "",
    category: "Национальные парки",
    readTimeMinutes: 19,
    readTime: rt(19),
    tags: ["Талампая", "Ла-Риоха", "нацпарки", "ЮНЕСКО", "каньон", "динозавры"],
    featured: true,
    cardVariant: "featured",
    editorialReviewed: true,
    richArticleId: "talampaya-national-park",
    relatedResources: [
      { label: "Лос-Кардонес", href: "/blog/natsionalnyy-park-los-cardones", type: "guide" },
      { label: "Сальта", href: "/places/salta", type: "guide" },
      { label: "Игуасу", href: "/blog/natsionalnyy-park-iguasu", type: "guide" },
    ],
  },
  {
    ...WILDLIFE_S_GIDOM_POST,
    content: "",
    image: "",
  },
  {
    id: "blog-banado-la-estrella",
    slug: "banado-la-estrella",
    title: "Баньядо-ла-Эстрелья: призрачные болота Формосы (гид 2026)",
    seoTitle: "Баньядо-ла-Эстрелья: призрачные болота Формосы 2026",
    excerpt:
      "Гид по Баньядо-ла-Эстрелья 2026: призрачный затопленный лес Формосы, кайманы и птицы, сафари, как добраться и когда ехать. Не нацпарк, а резерват.",
    sections: [],
    content: "",
    author: editorialAuthor,
    authorBio: editorialBio,
    date: "2026-06-21",
    dateModified: "2026-06-21",
    image: "",
    category: "Национальные парки",
    readTimeMinutes: 18,
    readTime: rt(18),
    tags: ["Баньядо-ла-Эстрелья", "Формоса", "болота", "champales", "сафари", "Гран-Чако"],
    featured: false,
    cardVariant: "standard",
    editorialReviewed: true,
    richArticleId: "banado-la-estrella",
    relatedResources: [
      { label: "Ибера", href: "/blog/natsionalnyy-park-ibera", type: "guide" },
      { label: "Игуасу", href: "/blog/natsionalnyy-park-iguasu", type: "guide" },
      { label: "Все нацпарки", href: "/blog/natsionalnye-parki-argentiny", type: "guide" },
    ],
  },
  {
    id: "blog-ischigualasto",
    slug: "ischigualasto-valle-de-la-luna",
    title: "Исчигуаласто (Долина Луны): полный гид по парку (2026)",
    seoTitle: "Исчигуаласто (Долина Луны): гид по парку 2026",
    excerpt:
      "Гид по Исчигуаласто 2026: Долина Луны, триасовые динозавры, автоколонна, цены, сезоны и связка с Талампаей. UNESCO вместе с Талампаей.",
    sections: [],
    content: "",
    author: editorialAuthor,
    authorBio: editorialBio,
    date: "2026-06-21",
    dateModified: "2026-06-21",
    image: "",
    category: "Национальные парки",
    readTimeMinutes: 18,
    readTime: rt(18),
    tags: ["Исчигуаласто", "Долина Луны", "Талампая", "Сан-Хуан", "UNESCO", "динозавры"],
    featured: false,
    cardVariant: "standard",
    editorialReviewed: true,
    richArticleId: "ischigualasto-valley-of-the-moon",
    relatedResources: [
      { label: "Талампая", href: "/blog/natsionalnyy-park-talampaya", type: "guide" },
      { label: "Лос-Кардонес", href: "/blog/natsionalnyy-park-los-cardones", type: "guide" },
      { label: "Все нацпарки", href: "/blog/natsionalnye-parki-argentiny", type: "guide" },
    ],
  },
];

const quarantinedLegacyManualSlugs = new Set<string>([
  // Валютная статья не отражает безопасно весь режим BCRA после изменений 2025 года.
  "blue-dollar-argentina-2026",
]);

const legacyManualOfficialSources: Record<string, string> = {
};

const legacyManualExcerptOverrides: Record<string, string> = {
};

const legacyManualReplacementSections: Record<
  string,
  Array<{ title: string; body: string }>
> = {
};

const legacyManualSectionOverrides: Record<string, Record<string, string>> = {
};

const legacyManualRemovedSections: Record<string, string[]> = {
};

const legacyPseudoCitationPattern =
  /\s*\((?:turismo\.buenosaires\.gob\.ar|Turismo Buenos Aires|Tango\.ORG|Tripadvisor|Viator|BailaBA|Т—Ж|Trailo|Reddit|iguazufalls\.com|Википедия)\)/giu;

function applyLegacyManualEditorialAudit(post: BlogPost): BlogPost {
  if (quarantinedLegacyManualSlugs.has(post.slug)) {
    return { ...post, noIndex: true, dateModified: "2026-07-17" };
  }

  const sourceBody = legacyManualOfficialSources[post.slug];
  if (!sourceBody) return post;

  const replacementSections = legacyManualReplacementSections[post.slug];
  const overrides = legacyManualSectionOverrides[post.slug] ?? {};
  const removedSections = legacyManualRemovedSections[post.slug] ?? [];
  const sections = replacementSections
    ? replacementSections
    : (post.sections ?? [])
        .filter(
          (section) =>
            section.title !== "Источники и дата проверки" &&
            !removedSections.includes(section.title),
        )
        .map((section) => ({
          ...section,
          body: (overrides[section.title] ?? section.body).replace(legacyPseudoCitationPattern, ""),
        }));

  return {
    ...post,
    excerpt: legacyManualExcerptOverrides[post.slug] ?? post.excerpt,
    sections: [...sections, { title: "Источники и дата проверки", body: sourceBody }],
    dateModified: "2026-07-17",
    readTimeMinutes: post.readTimeMinutes,
    readTime: post.readTime,
  };
}

const manualBlogPosts: BlogPost[] = [
  ...legacyManualBlogPosts
    .filter((post) => !REPLACED_MANUAL_SLUGS.has(post.slug))
    .map(applyLegacyManualEditorialAudit),
  ...manualPostsFromMd.map((post) => ({
    ...post,
    author: editorialAuthor,
    authorBio: editorialBio,
    readTime: rt(post.readTimeMinutes),
  })),
];

// Заполняем content из секций
for (const post of manualBlogPosts) {
  if (post.sections?.length) {
    post.content = post.sections.map((s) => s.body).join("\n\n");
  }
}

const manualSlugs = new Set(manualBlogPosts.map((p) => p.slug));
const planPosts = getPublishedPlanPosts(manualSlugs);

const blogPostsBySlug = new Map<string, BlogPost>();

export const blogPosts: BlogPost[] = [...manualBlogPosts, ...planPosts].map((post) => {
  const resolved: BlogPost = {
    ...post,
    image: resolveBlogPostCardImage(post),
    tourEmbeds: post.tourEmbeds?.length ? post.tourEmbeds : getBlogTourEmbeds(post.slug),
  };
  blogPostsBySlug.set(resolved.slug, resolved);
  return resolved;
});

export function getEditorialBlogPosts(): BlogPost[] {
  return manualBlogPosts
    .map((post) => blogPostsBySlug.get(post.slug))
    .filter((post): post is BlogPost => Boolean(post));
}

/** Фиксированная подборка «С чего начать» — 8 секционных pillar без rich-нацпарков. */
export function getBlogStartHerePosts(): BlogPost[] {
  return BLOG_START_HERE_SLUGS.map((slug) => blogPostsBySlug.get(slug)).filter(
    (post): post is BlogPost => Boolean(post),
  );
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

function parseBlogDisplayDate(dateStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(`${dateStr}T12:00:00.000Z`);
  }
  return new Date(dateStr);
}

export function formatDate(dateStr: string): string {
  const parsed = parseBlogDisplayDate(dateStr);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(parsed);
}

export { getBlogCategories, getBlogCategoriesWithCounts, getBlogTags, getTopBlogTags, filterBlogPosts, sortBlogPostsByDate, sortBlogPostsByUpdated, computeBlogStats, formatBlogReadTime, formatBlogUpdatedLabel, pluralizeArticles, buildBlogQuickFacts } from "@/lib/blog-utils";
