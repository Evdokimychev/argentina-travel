import type { GuidePillarContent, GuidePillarSection } from "@/types/guide-pillar";
import {
  IMMIGRATION_BIRTH,
  IMMIGRATION_CITIZENSHIP,
  IMMIGRATION_LIFE_IN_COUNTRY,
  IMMIGRATION_OPPORTUNITIES,
  IMMIGRATION_PROCESS,
  IMMIGRATION_RESIDENCY,
  IMMIGRATION_USEFUL_LINKS,
} from "@/data/immigration-topic-content";

function topicHref(slug: string) {
  return `/immigration/${slug}`;
}

function hubCta(label: string, href: string) {
  return { label, href, variant: "secondary" as const };
}

function sourceSection(...sources: string[]): GuidePillarSection {
  return {
    id: "official-sources",
    title: "Официальные источники и дата проверки",
    content: `Проверено 17.07.2026. ${sources.join(" · ")}`,
    infoBoxes: [
      {
        variant: "warning",
        title: "Проверьте ещё раз перед действием",
        body: "Формы, сборы и регламенты меняются. Этот материал помогает подготовиться, но не заменяет решение DNM или консультацию по конкретному делу.",
      },
    ],
  };
}

const RESIDENCIAS =
  "DNM, Residencias: https://www.argentina.gob.ar/migraciones/residencias";
const RESIDENCIAS_FAQ =
  "DNM, preguntas frecuentes: https://www.argentina.gob.ar/migraciones/preguntas-frecuentes-residencias";
const LEY_MIGRACIONES =
  "Ley 25.871, texto actualizado: https://www.argentina.gob.ar/normativa/nacional/92016/actualizacion";
const DNU_366 =
  "Decreto 366/2025: https://www.argentina.gob.ar/normativa/nacional/decreto-366-2025-413297/texto";
const LEY_CIUDADANIA =
  "Ley 346, texto actualizado: https://www.argentina.gob.ar/normativa/nacional/ley-346-48854/actualizacion";
const CIUDADANIA_DNM =
  "DNM, procedimiento digital (06.10.2025): https://www.argentina.gob.ar/noticias/ahora-el-tramite-de-ciudadania-argentina-se-podra-hacer-de-forma-digital-en-migraciones";
const NOMADA =
  "Disposición 758/2022: https://www.argentina.gob.ar/normativa/nacional/disposici%C3%B3n-758-2022-364601/texto";

export const IMMIGRATION_PILLARS: Record<string, GuidePillarContent> = {
  "zhizn-v-strane": {
    heroTitle: "Жизнь в Аргентине",
    heroSubtitle: IMMIGRATION_LIFE_IN_COUNTRY.intro,
    heroCtas: [
      { label: "Где жить", href: "/guide/gde-zhit", variant: "primary" },
      hubCta("Процесс иммиграции", topicHref("protsess-immigratsii")),
      { label: "Иммиграционный справочник", href: "/immigration", variant: "tertiary" },
    ],
    quickFacts: [
      { emoji: "🏙", label: "Выбор города", headline: "Сравнивайте районы", detail: "Транспорт, медицина, школы, безопасность и аренда" },
      { emoji: "🌡", label: "Климат", headline: "Большие различия по регионам", detail: "Сезонность и высота влияют на повседневную жизнь" },
      { emoji: "🏥", label: "Экстренная помощь", headline: "Отказать из-за статуса нельзя", detail: "Для обычной помощи проверьте статус, учреждение и страховку" },
      { emoji: "🪪", label: "Документы", headline: "DNI следует за residencia", detail: "Категорию проживания сначала одобряет DNM" },
    ],
    sections: [
      { id: "overview", title: "Что проверить до переезда", content: IMMIGRATION_LIFE_IN_COUNTRY.intro },
      sourceSection(DNU_366, RESIDENCIAS),
    ],
    faq: [
      {
        question: "Гарантирует ли residencia доступ ко всем услугам?",
        answer:
          "Нет. Права зависят от категории и конкретной услуги. Для медицины дополнительно важны юрисдикция учреждения и страховка.",
      },
      {
        question: "Когда оформляют DNI иностранца?",
        answer:
          "DNM указывает DNI для temporaria и permanente. После одобрения следуйте актуальной инструкции DNM/RENAPER; transitoria обычно DNI не предусматривает.",
      },
    ],
    partnerServices: [],
    blogLinks: [
      { title: "Где жить", href: "/guide/gde-zhit", description: "Города, районы и аренда" },
      { title: "Погода и сезоны", href: "/guide/pogoda-i-sezonnost" },
      { title: "Экономика и деньги", href: "/guide/ekonomika-i-dengi" },
    ],
  },

  "protsess-immigratsii": {
    heroTitle: "Процесс иммиграции",
    heroSubtitle: IMMIGRATION_PROCESS.intro,
    heroCtas: [
      { label: "Открыть RADEX", href: IMMIGRATION_PROCESS.radexPortalUrl, variant: "primary", external: true },
      hubCta("ВНЖ и ПМЖ", topicHref("vnzh-i-pmzh")),
      { label: "Документы для поездки", href: "/immigration/dokumenty-dlya-vyezda", variant: "tertiary" },
    ],
    quickFacts: [
      { emoji: "📋", label: "RADEX", headline: "Старт radicación в стране", detail: "Заявление начинается через официальный портал DNM" },
      { emoji: "⚠️", label: "Результат", headline: "Не гарантирован", detail: "DNM проверяет категорию, документы и обстоятельства" },
      { emoji: "⏳", label: "Precaria", headline: "До 90 дней", detail: "Может продлеваться, но не считается стажем" },
      { emoji: "🏥", label: "Страховка", headline: "Практически необходима", detail: "Пограничная обязательность зависит от введения регламента" },
    ],
    sections: [
      { id: "overview", title: "Порядок без обещаний", content: IMMIGRATION_PROCESS.intro },
      sourceSection(RESIDENCIAS, RESIDENCIAS_FAQ, DNU_366, LEY_MIGRACIONES),
    ],
    faq: [
      {
        question: "Можно ли начать radicación после туристического въезда?",
        answer:
          "Для заявлений внутри Аргентины DNM использует RADEX. Возможность смены категории и решение зависят от применимого основания; туристический въезд не гарантирует residencia.",
      },
      {
        question: "Уже обязательно показывать страховку на границе?",
        answer:
          "Decreto 366/2025 предусмотрел страховку и декларацию цели, но статья 123 bis связывает обязательность с введением регламента. Перед поездкой проверьте, не опубликован ли он; полис всё равно разумно оформить.",
      },
      {
        question: "Что даёт precaria?",
        answer:
          "Действующая precaria разрешает пребывание, выезд и въезд, работу и учёбу. Она не гарантирует одобрение и не считается стажем для permanente или гражданства.",
      },
      {
        question: "Можно ли работать как турист?",
        answer:
          "Туристическая категория сама по себе не разрешает оплачиваемую или приносящую доход деятельность. Нужен статус, который допускает конкретную работу.",
      },
    ],
    partnerServices: [],
    blogLinks: [
      { title: "Документы для поездки", href: "/immigration/dokumenty-dlya-vyezda" },
      { title: "Туристический въезд", href: "/immigration/vizy-dlya-turistov" },
      { title: "Категории residencia", href: topicHref("vnzh-i-pmzh") },
    ],
  },

  "rody-v-argentine": {
    heroTitle: "Роды в Аргентине",
    heroSubtitle: IMMIGRATION_BIRTH.intro,
    heroCtas: [
      hubCta("ВНЖ и ПМЖ", topicHref("vnzh-i-pmzh")),
      hubCta("Гражданство", topicHref("grazhdanstvo")),
      { label: "Процесс иммиграции", href: topicHref("protsess-immigratsii"), variant: "tertiary" },
    ],
    quickFacts: [
      { emoji: "👶", label: "Ребёнок", headline: "Гражданство по рождению", detail: "Статья 1 Ley 346; есть дипломатическое исключение" },
      { emoji: "👨‍👩‍👧", label: "Родители", headline: "Отдельное заявление", detail: "Автоматического ПМЖ из факта рождения нет" },
      { emoji: "📄", label: "Документы", headline: "Registro Civil и RENAPER", detail: "Сначала регистрация рождения, затем документы ребёнка" },
      { emoji: "🏥", label: "Медицина", headline: "Планируйте заранее", detail: "Врач, учреждение, стоимость и страховка" },
    ],
    sections: [
      { id: "overview", title: "Гражданство ребёнка и статус родителей", content: IMMIGRATION_BIRTH.intro },
      sourceSection(LEY_CIUDADANIA, DNU_366, RESIDENCIAS),
    ],
    faq: [
      {
        question: "Получает ли ребёнок гражданство Аргентины?",
        answer:
          "Рождённый в Аргентине ребёнок является гражданином по рождению, кроме предусмотренного Ley 346 исключения для детей иностранных дипломатов.",
      },
      {
        question: "Получают ли родители ПМЖ автоматически?",
        answer:
          "Нет. Для родителей действует отдельная миграционная процедура. Статья 23 ñ предусматривает temporaria reunificación familiar, а permanente требует отдельного применимого критерия и решения DNM.",
      },
    ],
    partnerServices: [],
    blogLinks: [
      { title: "Гражданство", href: topicHref("grazhdanstvo") },
      { title: "ВНЖ и ПМЖ", href: topicHref("vnzh-i-pmzh") },
    ],
  },

  grazhdanstvo: {
    heroTitle: "Гражданство Аргентины",
    heroSubtitle: IMMIGRATION_CITIZENSHIP.intro,
    heroCtas: [
      hubCta("ВНЖ и ПМЖ", topicHref("vnzh-i-pmzh")),
      { label: "Официальные источники", href: topicHref("poleznye-ssylki"), variant: "secondary" },
      { label: "Иммиграционный справочник", href: "/immigration", variant: "tertiary" },
    ],
    quickFacts: [
      { emoji: "⏱", label: "Натурализация", headline: "2 года законного проживания", detail: "Непосредственно перед заявлением" },
      { emoji: "🧳", label: "Непрерывность", headline: "Без выездов", detail: "Выезд прерывает двухлетний период" },
      { emoji: "🏛", label: "Подача", headline: "Цифровая процедура DNM", detail: "Для новых заявлений с октября 2025" },
      { emoji: "⏳", label: "Precaria", headline: "Не считается", detail: "Не входит в двухлетний период" },
    ],
    sections: [
      { id: "overview", title: "Условия натурализации", content: IMMIGRATION_CITIZENSHIP.intro },
      sourceSection(LEY_CIUDADANIA, DNU_366, CIUDADANIA_DNM),
    ],
    faq: [
      {
        question: "Через сколько можно подать на натурализацию?",
        answer:
          "После двух лет непрерывного законного проживания непосредственно перед заявлением. Действующая Ley 346 определяет непрерывность как отсутствие выездов в этот период.",
      },
      {
        question: "Считается ли precaria?",
        answer:
          "Нет. Decreto 366/2025 прямо исключает precaria из срока натурализации.",
      },
      {
        question: "Куда подают новые заявления?",
        answer:
          "DNM сообщила 06.10.2025 о цифровой подаче новых заявлений. Используйте актуальную инструкцию DNM, а не старый судебный чек-лист.",
      },
      {
        question: "Есть ли гарантированный срок решения?",
        answer:
          "Нет универсального срока для каждого дела. Ориентируйтесь только на официальные уведомления по своему trámite.",
      },
    ],
    partnerServices: [],
    blogLinks: [
      { title: "ВНЖ и ПМЖ", href: topicHref("vnzh-i-pmzh") },
      { title: "Роды в Аргентине", href: topicHref("rody-v-argentine") },
    ],
  },

  "vnzh-i-pmzh": {
    heroTitle: "ВНЖ и ПМЖ Аргентины",
    heroSubtitle: IMMIGRATION_RESIDENCY.intro,
    heroCtas: [
      { label: "Открыть RADEX", href: "https://www.migraciones.gob.ar/radex/", variant: "primary", external: true },
      hubCta("Процесс иммиграции", topicHref("protsess-immigratsii")),
      hubCta("Гражданство", topicHref("grazhdanstvo")),
    ],
    quickFacts: [
      { emoji: "🌎", label: "Статья 23", headline: "15 подкатегорий a–ñ", detail: "Соответствие и документы проверяет DNM" },
      { emoji: "📄", label: "Temporaria", headline: "До 3 лет", detail: "Срок зависит от подкатегории" },
      { emoji: "🏡", label: "Permanente", headline: "Без даты окончания", detail: "Но статус может быть отменён по статье 62" },
      { emoji: "⏳", label: "Precaria", headline: "До 90 дней", detail: "Работа разрешена, стаж не идёт" },
    ],
    sections: [
      { id: "overview", title: "Категории проживания", content: IMMIGRATION_RESIDENCY.intro },
      { id: "dnu-note", title: "Изменения 2025 года", content: IMMIGRATION_RESIDENCY.dnuWarning },
      sourceSection(RESIDENCIAS, RESIDENCIAS_FAQ, LEY_MIGRACIONES, DNU_366),
    ],
    faq: IMMIGRATION_RESIDENCY.extendedFaq,
    partnerServices: [],
    blogLinks: [
      { title: "Краткий обзор ВНЖ", href: "/immigration/obzor-vnzh" },
      { title: "Процесс иммиграции", href: topicHref("protsess-immigratsii") },
      { title: "Гражданство", href: topicHref("grazhdanstvo") },
      { title: "Роды в Аргентине", href: topicHref("rody-v-argentine") },
    ],
  },

  vozmozhnosti: {
    heroTitle: "Как выбрать миграционную категорию",
    heroSubtitle: IMMIGRATION_OPPORTUNITIES.intro,
    heroCtas: [
      hubCta("ВНЖ и ПМЖ", topicHref("vnzh-i-pmzh")),
      { label: "Официальный список DNM", href: "https://www.argentina.gob.ar/migraciones/residencias", variant: "primary", external: true },
      { label: "Процесс подачи", href: topicHref("protsess-immigratsii"), variant: "tertiary" },
    ],
    quickFacts: [
      { emoji: "💰", label: "Rentista", headline: "Нужен подтверждённый доход", detail: "Критерии берите из действующей карточки DNM" },
      { emoji: "💻", label: "Цифровой кочевник", headline: "Transitoria, не ВНЖ", detail: "До 180 дней и одна возможная prórroga" },
      { emoji: "👨‍👩‍👧", label: "Семья", headline: "Категория статьи 23 ñ", detail: "Только для перечисленных законом связей" },
      { emoji: "🌎", label: "MERCOSUR", headline: "Категория по гражданству", detail: "Применимость проверяется по закону и соглашениям" },
    ],
    sections: [
      { id: "overview", title: "Выбор по реальной цели", content: IMMIGRATION_OPPORTUNITIES.intro },
      sourceSection(RESIDENCIAS, LEY_MIGRACIONES, DNU_366, NOMADA),
    ],
    faq: [
      {
        question: "Цифровой кочевник — это temporaria?",
        answer:
          "Нет. Disposición 758/2022 устанавливает transitoria до 180 дней с одной возможной prórroga на срок первоначального разрешения.",
      },
      {
        question: "Можно ли заранее назвать минимальный доход rentista?",
        answer:
          "Надёжно — только после открытия текущей карточки trámite DNM. Порог и способ подтверждения могут меняться, поэтому старые суммы публиковать опасно.",
      },
    ],
    partnerServices: [],
    blogLinks: [
      { title: "Категории ВНЖ и ПМЖ", href: topicHref("vnzh-i-pmzh") },
      { title: "Краткий обзор ВНЖ", href: "/immigration/obzor-vnzh" },
    ],
  },

  "poleznye-ssylki": {
    heroTitle: "Официальные источники по иммиграции",
    heroSubtitle: IMMIGRATION_USEFUL_LINKS.intro,
    heroCtas: [
      { label: "Категории DNM", href: "https://www.argentina.gob.ar/migraciones/residencias", variant: "primary", external: true },
      { label: "RADEX", href: "https://www.migraciones.gob.ar/radex/", variant: "secondary", external: true },
      { label: "Иммиграционный справочник", href: "/immigration", variant: "tertiary" },
    ],
    quickFacts: [
      { emoji: "🏛", label: "DNM", headline: "Категории и процедуры", detail: "Главный источник перед подачей" },
      { emoji: "📋", label: "RADEX", headline: "Заявления о radicación", detail: "Официальный портал запуска процедуры" },
      { emoji: "⚖️", label: "Normativa", headline: "Актуальные тексты законов", detail: "Ley 25.871, Ley 346 и Decreto 366/2025" },
      { emoji: "📅", label: "Дата сверки", headline: "17.07.2026", detail: "Перед действием откройте источники заново" },
    ],
    sections: [
      { id: "overview", title: "Где проверять правила", content: IMMIGRATION_USEFUL_LINKS.intro },
      sourceSection(RESIDENCIAS, RESIDENCIAS_FAQ, LEY_MIGRACIONES, LEY_CIUDADANIA, DNU_366),
    ],
    faq: [
      {
        question: "Как понять, что информация актуальна?",
        answer:
          "Проверьте дату обновления, откройте актуальный текст нормы и карточку trámite DNM. Не полагайтесь только на статью, форум или опыт другого заявителя.",
      },
    ],
    partnerServices: [],
    blogLinks: IMMIGRATION_USEFUL_LINKS.articles.map((link) => ({
      title: link.title,
      href: link.href,
      description: link.description,
    })),
  },
};

export function getImmigrationPillarBySlug(slug: string): GuidePillarContent | undefined {
  return IMMIGRATION_PILLARS[slug];
}
