import type { ContentPage } from "@/types/content-page";

const VERIFIED_AT = "2026-07-17";

export const IMMIGRATION_PAGES: Record<string, ContentPage> = {
  "vizy-dlya-turistov": {
    slug: "vizy-dlya-turistov",
    section: "immigration",
    title: "Туристический въезд в Аргентину",
    description:
      "Как проверить визовый режим, срок пребывания и документы перед поездкой в Аргентину.",
    category: "Въезд",
    updatedAt: VERIFIED_AT,
    sections: [
      {
        paragraphs: [
          "Визовый режим зависит от гражданства по паспорту и цели поездки. Перед покупкой билета проверьте данные у Dirección Nacional de Migraciones (DNM), консульства Аргентины и перевозчика.",
          "Статус turista предназначен для отдыха. Официальная страница DNM указывает срок до трёх месяцев с возможностью одной prórroga на сопоставимый период; фактический разрешённый срок определяется при въезде.",
        ],
      },
      {
        heading: "Перед поездкой",
        list: [
          "Проверьте, нужна ли виза именно вашему гражданству.",
          "Сверьте требования к документу для поездки и сроку его действия.",
          "Подготовьте маршрут, адрес проживания и подтверждение туристической цели, если их запросит контроль.",
          "Оформите медицинскую страховку как практическую защиту и проверьте её исключения.",
        ],
      },
      {
        heading: "Страховка после Decreto 366/2025",
        paragraphs: [
          "Decreto 366/2025 предусмотрел декларацию цели въезда и медицинскую страховку. Одновременно статья 123 bis связывает обязательность этих требований с введением регламента. Поэтому нельзя писать, что полис уже всегда проверяют на границе: перед вылетом нужно убедиться, не опубликован ли новый порядок.",
        ],
      },
      {
        heading: "Работа и смена категории",
        paragraphs: [
          "Туристический статус сам по себе не разрешает оплачиваемую или приносящую доход деятельность. Если цель изменилась, сначала найдите подходящую категорию DNM. Заявления о radicación внутри страны начинаются через RADEX, но возможность смены категории и результат не гарантированы.",
        ],
      },
      {
        heading: "Официальные источники",
        list: [
          "Проверено 17.07.2026: https://www.argentina.gob.ar/migraciones/documentacion-para-ingresar-al-pais-como-turista",
          "Decreto 366/2025: https://www.argentina.gob.ar/normativa/nacional/decreto-366-2025-413297/texto",
          "Категории residencia: https://www.argentina.gob.ar/migraciones/residencias",
        ],
      },
    ],
    relatedLinks: [
      { label: "Документы для поездки", href: "/immigration/dokumenty-dlya-vyezda" },
      { label: "Продление туристического пребывания", href: "/immigration/prodlenie-turisticheskogo-vizita" },
      { label: "Процесс иммиграции", href: "/immigration/protsess-immigratsii" },
    ],
  },

  "obzor-vnzh": {
    slug: "obzor-vnzh",
    section: "immigration",
    title: "Обзор residencia temporaria и permanente",
    description:
      "15 оснований temporaria, precaria, переход на permanente и ключевые изменения Decreto 366/2025.",
    category: "Residencia",
    updatedAt: VERIFIED_AT,
    sections: [
      {
        paragraphs: [
          "DNM различает transitoria, temporaria и permanente. В статье 23 Ley 25.871 сейчас 15 оснований temporaria — подкатегории a–ñ. Это не 15 гарантированных способов получить ВНЖ: заявитель должен соответствовать конкретному критерию и подтвердить его документами.",
        ],
      },
      {
        heading: "Основные категории",
        list: [
          "Transitoria — ограниченная цель и срок; по общему правилу без DNI.",
          "Temporaria — до трёх лет в зависимости от подкатегории, с DNI temporario.",
          "Permanente — без даты окончания, но с основаниями отмены по статье 62.",
          "Precaria — временный документ на период процедуры, а не уже одобренная residencia.",
        ],
      },
      {
        heading: "Что даёт precaria",
        paragraphs: [
          "По Decreto 366/2025 precaria может выдаваться на срок до 90 календарных дней и продлеваться мотивированным решением DNM. Действующий документ разрешает пребывание, выезд и въезд, работу и учёбу. Он не гарантирует положительное решение и не считается стажем для permanente или натурализации.",
        ],
      },
      {
        heading: "Переход на permanente по сроку",
        paragraphs: [
          "Официальный FAQ DNM указывает два года действующей temporaria для граждан MERCOSUR и три года для остальных. Для этого критерия нужно находиться в Аргентине более половины разрешённого срока. Другие критерии permanente проверяются отдельно.",
        ],
      },
      {
        heading: "Отсутствие за границей",
        paragraphs: [
          "Статья 62 после Decreto 366/2025 предусматривает отмену temporaria при отсутствии шесть месяцев или более и permanente — один год или более. Закон содержит исключения, включая предварительное разрешение DNM; их применимость нужно подтвердить до длительной поездки.",
        ],
      },
      {
        heading: "Цифровой кочевник — отдельная transitoria",
        paragraphs: [
          "Disposición 758/2022 устанавливает пребывание до 180 дней для удалённых услуг получателям за пределами Аргентины и допускает одну prórroga на срок первоначального разрешения. Это не temporaria статьи 23 и не автоматический путь к permanente.",
        ],
      },
      {
        heading: "Официальные источники",
        list: [
          "Проверено 17.07.2026: https://www.argentina.gob.ar/migraciones/residencias",
          "FAQ DNM: https://www.argentina.gob.ar/migraciones/preguntas-frecuentes-residencias",
          "Ley 25.871: https://www.argentina.gob.ar/normativa/nacional/92016/actualizacion",
          "Decreto 366/2025: https://www.argentina.gob.ar/normativa/nacional/decreto-366-2025-413297/texto",
          "Disposición 758/2022: https://www.argentina.gob.ar/normativa/nacional/disposici%C3%B3n-758-2022-364601/texto",
        ],
      },
    ],
    relatedLinks: [
      { label: "ВНЖ и ПМЖ — полный справочник", href: "/immigration/vnzh-i-pmzh" },
      { label: "Процесс иммиграции", href: "/immigration/protsess-immigratsii" },
      { label: "Гражданство", href: "/immigration/grazhdanstvo" },
      { label: "Официальные источники", href: "/immigration/poleznye-ssylki" },
    ],
  },

  "dokumenty-dlya-vyezda": {
    slug: "dokumenty-dlya-vyezda",
    section: "immigration",
    title: "Документы для поездки в Аргентину",
    description:
      "Контрольный список перед вылетом: паспорт, визовый режим, маршрут, страховка, дети и транзит.",
    category: "Въезд",
    updatedAt: VERIFIED_AT,
    sections: [
      {
        paragraphs: [
          "Универсального списка для всех путешественников нет. Он зависит от гражданства, цели, маршрута, транзита и состава семьи. Этот список помогает ничего не забыть, но окончательные требования задают DNM, консульство и перевозчик.",
        ],
      },
      {
        heading: "Основная проверка",
        list: [
          "Документ для поездки и срок его действия по требованиям DNM и авиакомпании.",
          "Виза или иное разрешение, если оно требуется вашему гражданству.",
          "Билет или маршрут выезда, адрес проживания и подтверждение цели поездки — если запросят.",
          "Медицинская страховка с понятными лимитами, исключениями и контактами ассистанса.",
        ],
      },
      {
        heading: "Дети",
        paragraphs: [
          "Для поездки ребёнка проверьте документы у пограничных органов страны выезда, транзитных стран, Аргентины и перевозчика. Требование согласия второго родителя зависит от маршрута, гражданства и того, кто сопровождает ребёнка; не используйте общий шаблон без проверки.",
        ],
      },
      {
        heading: "Транзит и соседние страны",
        paragraphs: [
          "Даже если Аргентина не требует визу, она может понадобиться в транзитной стране или для выхода из аэропорта. Отдельно проверяйте правила Бразилии, Чили, Уругвая и других стран маршрута по своему паспорту.",
        ],
      },
      {
        heading: "Официальные источники",
        list: [
          "Проверено 17.07.2026: https://www.argentina.gob.ar/migraciones/documentacion-para-ingresar-al-pais-como-turista",
          "Decreto 366/2025: https://www.argentina.gob.ar/normativa/nacional/decreto-366-2025-413297/texto",
        ],
      },
    ],
    relatedLinks: [
      { label: "Туристический въезд", href: "/immigration/vizy-dlya-turistov" },
      { label: "Процесс иммиграции", href: "/immigration/protsess-immigratsii" },
    ],
  },

  "prodlenie-turisticheskogo-vizita": {
    slug: "prodlenie-turisticheskogo-vizita",
    section: "immigration",
    title: "Продление туристического пребывания",
    description:
      "Когда и как просить prórroga turista, почему выезд не заменяет продление и где проверить сбор.",
    category: "Въезд",
    updatedAt: VERIFIED_AT,
    sections: [
      {
        paragraphs: [
          "DNM указывает для turista срок до трёх месяцев с возможностью продления ещё на сопоставимый период. Prórroga не возникает автоматически: её нужно запросить до окончания разрешённого пребывания.",
        ],
      },
      {
        heading: "Когда подавать",
        paragraphs: [
          "Официальная страница DNM указывает окно в последние десять дней до окончания transitoria. Если разрешённый срок уже истёк, обычная prórroga невозможна. Сверьте актуальный порядок и часы работы перед визитом.",
        ],
      },
      {
        heading: "Что подготовить",
        list: [
          "Действующий документ для поездки и подтверждение законного въезда.",
          "Данные о текущем разрешённом сроке пребывания.",
          "Сбор по актуальной таблице DNM — не по старой сумме из статьи или форума.",
          "Дополнительные документы, если их перечисляет текущая инструкция DNM.",
        ],
      },
      {
        heading: "Выезд и повторный въезд",
        paragraphs: [
          "Поездка в соседнюю страну не является prórroga и не гарантирует новый срок. Решение о допуске и сроке принимает пограничный контроль. Если цель — жить, учиться или работать, проверьте подходящую категорию residencia.",
        ],
      },
      {
        heading: "Официальные источники",
        list: [
          "Проверено 17.07.2026: https://www.argentina.gob.ar/migraciones/turistas",
          "FAQ DNM: https://www.argentina.gob.ar/migraciones/preguntas-frecuentes-residencias",
          "Таблица сборов: https://www.argentina.gob.ar/migraciones/cuadro-tasas-migratorias",
        ],
      },
    ],
    relatedLinks: [
      { label: "Туристический въезд", href: "/immigration/vizy-dlya-turistov" },
      { label: "Обзор residencia", href: "/immigration/obzor-vnzh" },
      { label: "Процесс иммиграции", href: "/immigration/protsess-immigratsii" },
    ],
  },
};
