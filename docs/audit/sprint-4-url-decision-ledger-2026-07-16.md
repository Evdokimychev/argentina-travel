# Sprint 4 — реестр решений по индексированию URL

Дата: 16 июля 2026 года  
Статус: технический инкремент готов локально; полный crawl и production-проверка не выполнялись в параллельном рабочем дереве.

## Влияние изменений на проект

- Поисковые роботы получают только опубликованные, индексируемые и самоканонические русские адреса.
- Каталоги туров, экскурсий, мест, блог, путеводители и база знаний сохраняют собственные источники статуса публикации.
- Fallback-страницы `/es` и `/en` остаются `noindex` и не попадают в sitemap до появления полной переведённой версии с взаимным hreflang.
- Кабинеты, бронирование, CRM, оплата, партнёрские API и аналитика не менялись.
- Административная таблица перенаправлений не менялась; два подтверждённых постоянных перенаправления проверяются контрактным тестом в `next.config.ts`.

## Единый контракт публикации

`src/lib/seo/publication-registry.ts` — последний фильтр перед публикацией URL в sitemap. Адрес допускается, только если:

1. источник пометил сущность как опубликованную;
2. страница индексируема;
3. canonical совпадает с самим адресом;
4. адрес не является fallback-локалью, техническим алиасом, приватным или транзакционным маршрутом;
5. для адреса нет отдельного решения `redirect`, `noindex` или `withheld`.

Состояния CMS, туров и базы знаний не дублируются в статическом списке: их по-прежнему определяют соответствующие репозитории. Реестр хранит только межсистемные исключения и решения по адресам.

## Явные решения

| URL или семейство | Решение | Причина / целевой URL |
|---|---|---|
| `/baza-znaniy/ciudad-de-salta` | постоянное перенаправление | `/baza-znaniy/salta`; дубль краткого импорта |
| `/baza-znaniy/parque-nacional-los-cardones` | постоянное перенаправление | `/baza-znaniy/los-cardones`; дубль краткого импорта |
| `/baza-znaniy/poisk` | `noindex`, исключить | результаты внутреннего поиска |
| `/booking/find`, `/booking/pay/**`, `/booking/travelers/**` | `noindex`, исключить | транзакционные страницы |
| `/organizer/**`, `/profile/**`, `/trip/**`, `/auth/**`, `/embed/**`, `/dev/**` | `noindex`, исключить | приватный или служебный контур |
| `/podbor`, `/join`, `/organizers/**` | временно не публиковать | в последнем полном crawl отсутствовал self-canonical |
| `/excursions/guide/**` | временно не публиковать | полученные партнёрские ID стабильно отвечали 404 |
| `/excursions/city/Puerto_Iguazu`, вариант `Puerto_Iguasu` | постоянное перенаправление | `/destinations/iguazu`; партнёрская детализация ранее отвечала 404/noindex |
| `/excursions/city/city-151` | постоянное перенаправление | `/excursions/city/Buenos_Aires`; подтверждённый технический дубль |
| остальные `/excursions/city/city-{id}` | временно не публиковать | технический алиас без подтверждённого читаемого URL |
| `/es/**`, `/en/**` | `noindex`, исключить | сейчас это русская fallback-копия, а не опубликованный перевод |

## Кластеры `/places` и `/baza-znaniy`

В сохранённом production-отчёте обнаружено 56 кластеров с одинаковым описанием — больше исходной оценки roadmap в 38. Для всех кластеров принято решение **different intent**, а не массовое перенаправление:

- `/places/{slug}` — карточка места для выбора: факты, карта, связанные туры и действия;
- `/baza-znaniy/{slug}` — редакционная статья: объяснение, источники, контекст и перелинковка.

Оба URL могут индексироваться после разведения title/description/H1 и подтверждения, что содержимое действительно соответствует разным намерениям. До редакционной доработки не следует автоматически назначать один URL canonical другого: это скроет самостоятельную полезность одного из форматов.

| № | Карточка места | Статья базы знаний | Решение |
|---:|---|---|---|
| 1 | `/places/cafayate` | `/baza-znaniy/cafayate` | different intent; развести метаданные |
| 2 | `/places/tilcara` | `/baza-znaniy/tilkara` | different intent; развести метаданные |
| 3 | `/places/quebrada-de-humahuaca` | `/baza-znaniy/quebrada-de-humahuaca` | different intent; развести метаданные |
| 4 | `/places/salinas-grandes` | `/baza-znaniy/salinas-grandes` | different intent; развести метаданные |
| 5 | `/places/san-martin-de-los-andes` | `/baza-znaniy/san-martin-de-los-andes` | different intent; развести метаданные |
| 6 | `/places/villa-la-angostura` | `/baza-znaniy/villa-la-angostura` | different intent; развести метаданные |
| 7 | `/places/rosario` | `/baza-znaniy/rosario` | different intent; развести метаданные |
| 8 | `/places/la-plata` | `/baza-znaniy/la-plata` | different intent; развести метаданные |
| 9 | `/places/tucuman` | `/baza-znaniy/san-miguel-de-tucuman` | different intent; развести метаданные |
| 10 | `/places/san-salvador-de-jujuy` | `/baza-znaniy/san-salvador-de-jujuy` | different intent; развести метаданные |
| 11 | `/places/neuquen` | `/baza-znaniy/neuken` | different intent; развести метаданные |
| 12 | `/places/san-juan` | `/baza-znaniy/san-huan` | different intent; развести метаданные |
| 13 | `/places/corrientes` | `/baza-znaniy/korrientes` | different intent; развести метаданные |
| 14 | `/places/bahia-blanca` | `/baza-znaniy/bahia-blanca` | different intent; развести метаданные |
| 15 | `/places/esquel` | `/baza-znaniy/esquel` | different intent; развести метаданные |
| 16 | `/places/aconcagua` | `/baza-znaniy/aconcagua-provincial-park` | different intent; развести метаданные |
| 17 | `/places/ischigualasto` | `/baza-znaniy/ischigualasto` | different intent; развести метаданные |
| 18 | `/places/los-alerces-national-park` | `/baza-znaniy/los-alerces` | different intent; развести метаданные |
| 19 | `/places/lujan` | `/baza-znaniy/lujan` | different intent; развести метаданные |
| 20 | `/places/mar-de-las-pampas` | `/baza-znaniy/mar-de-las-pampas` | different intent; развести метаданные |
| 21 | `/places/necochea` | `/baza-znaniy/necochea` | different intent; развести метаданные |
| 22 | `/places/pinamar` | `/baza-znaniy/pinamar` | different intent; развести метаданные |
| 23 | `/places/sierra-de-la-ventana` | `/baza-znaniy/sierra-de-la-ventana` | different intent; развести метаданные |
| 24 | `/places/tandil` | `/baza-znaniy/tandil` | different intent; развести метаданные |
| 25 | `/places/villa-gesell` | `/baza-znaniy/villa-gesell` | different intent; развести метаданные |
| 26 | `/places/barreal` | `/baza-znaniy/barreal` | different intent; развести метаданные |
| 27 | `/places/la-rioja` | `/baza-znaniy/la-rioja` | different intent; развести метаданные |
| 28 | `/places/las-lenas` | `/baza-znaniy/las-lenas` | different intent; развести метаданные |
| 29 | `/places/merlo` | `/baza-znaniy/merlo` | different intent; развести метаданные |
| 30 | `/places/san-luis` | `/baza-znaniy/san-luis` | different intent; развести метаданные |
| 31 | `/places/sierra-de-las-quijadas` | `/baza-znaniy/sierra-de-las-quijadas` | different intent; развести метаданные |
| 32 | `/places/villavicencio` | `/baza-znaniy/villavicencio` | different intent; развести метаданные |
| 33 | `/places/banado-la-estrella` | `/baza-znaniy/banado-la-estrella` | different intent; развести метаданные |
| 34 | `/places/colon-entre-rios` | `/baza-znaniy/colon-entre-rios` | different intent; развести метаданные |
| 35 | `/places/formosa` | `/baza-znaniy/formosa` | different intent; развести метаданные |
| 36 | `/places/parana` | `/baza-znaniy/parana` | different intent; развести метаданные |
| 37 | `/places/parque-nacional-chaco` | `/baza-znaniy/parque-nacional-chaco` | different intent; развести метаданные |
| 38 | `/places/parque-nacional-el-palmar` | `/baza-znaniy/parque-nacional-el-palmar` | different intent; развести метаданные |
| 39 | `/places/parque-nacional-rio-pilcomayo` | `/baza-znaniy/parque-nacional-rio-pilcomayo` | different intent; развести метаданные |
| 40 | `/places/san-ignacio-mini` | `/baza-znaniy/san-ignacio-mini` | different intent; развести метаданные |
| 41 | `/places/catamarca` | `/baza-znaniy/catamarca` | different intent; развести метаданные |
| 42 | `/places/kachi` | `/baza-znaniy/kachi` | different intent; развести метаданные |
| 43 | `/places/los-cardones` | `/baza-znaniy/los-cardones` | different intent; развести метаданные |
| 44 | `/places/ruinas-de-quilmes` | `/baza-znaniy/ruinas-de-quilmes` | different intent; развести метаданные |
| 45 | `/places/santiago-del-estero` | `/baza-znaniy/santiago-del-estero` | different intent; развести метаданные |
| 46 | `/places/susques` | `/baza-znaniy/susques` | different intent; развести метаданные |
| 47 | `/places/tafi-del-valle` | `/baza-znaniy/tafi-del-valle` | different intent; развести метаданные |
| 48 | `/places/termas-de-rio-hondo` | `/baza-znaniy/termas-de-rio-hondo` | different intent; развести метаданные |
| 49 | `/places/la-cumbrecita` | `/baza-znaniy/la-cumbrecita` | different intent; развести метаданные |
| 50 | `/places/lihue-calel` | `/baza-znaniy/lihue-calel` | different intent; развести метаданные |
| 51 | `/places/santa-fe` | `/baza-znaniy/santa-fe` | different intent; развести метаданные |
| 52 | `/places/santa-rosa` | `/baza-znaniy/santa-rosa` | different intent; развести метаданные |
| 53 | `/places/el-bolson` | `/baza-znaniy/el-bolson` | different intent; развести метаданные |
| 54 | `/places/lanin` | `/baza-znaniy/lanin` | different intent; развести метаданные |
| 55 | `/places/patagonia-park` | `/baza-znaniy/patagonia-park` | different intent; развести метаданные |
| 56 | `/places/punta-tombo` | `/baza-znaniy/punta-tombo` | different intent; развести метаданные |

## Проверки текущего инкремента

- Контрактные тесты: publication registry, locale sitemap, Sprint 4 — 13/13 успешно.
- TypeScript (`tsc --noEmit`) — успешно.
- Общий build, `audit:quick` и SEO crawl намеренно не запускались параллельно с другими спринтами.

## Остаток до закрытия Sprint 4

1. После freeze выполнить полный локальный sitemap crawl и добиться 0 critical.
2. Добавить self-canonical для `/podbor`, `/join` и публичных организаторов либо оставить их исключёнными по утверждённому продуктовому решению.
3. Проверить после deploy постоянные перенаправления Игуасу и `city-151`, включая отсутствие цепочек и циклов.
4. Развести метаданные 56 кластеров пакетами с редакторской проверкой; чувствительные утверждения без источников не расширять.
5. После deploy повторить production crawl. Владелец: release lead; срок: до продвижения текущего кандидата в production.
6. После успешного production crawl отправить sitemap в Google Search Console и Bing Webmaster Tools. Владелец: SEO/release lead; срок: в день production-релиза.

## Синхронизация проекта

- Sitemap читает единый RU publication registry и больше не публикует нестабильные страницы партнёрских гидов.
- Реестр будущих локализованных URL явно пуст: fallback не может случайно попасть в индекс.
- Решения по дублям, noindex и временно удержанным адресам закреплены тестами и этим журналом.
- Изменений моделей данных, кабинетов, бронирования, CRM, оплаты и внешних интеграций нет.
