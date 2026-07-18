# Контентный SEO-аудит — 15 июля 2026

## Область проверки

Проверена вся база знаний, из которой строятся публичные страницы `/baza-znaniy/[slug]`: **689 записей**, из них **459 опубликованы** и **244 помечены `site_ready: true`** после закрытия двух дублей.

| Тип | Проверено |
|---|---:|
| Достопримечательности | 383 |
| Практические путеводители | 98 |
| Частые вопросы | 60 |
| Города | 49 |
| Национальные и провинциальные парки | 44 |
| Авторские советы | 29 |
| Транспорт | 11 |
| Регионы | 8 |
| Маршруты | 7 |

Проверялись пользовательские заголовки и описания, соответствие русскоязычным поисковым намерениям, внутренняя связность, дубли, готовность к публикации и редакционные ограничения. Техническая SEO-инфраструктура, canonical, sitemap, robots, schema и статусы публикации не менялись.

## Безопасные улучшения

- Русифицированы заголовки **44 страниц** мест и парков. Оригинальные названия сохранены в `title_es`.
- Улучшены заголовки и описания восьми навигационных хабов: поездка, переезд, деньги, документы, культура, медицина, транспорт и жильё.
- Уточнены описания маршрутов по Аргентине на 10 дней, 2 недели и 3 недели. Удалены внутренний жаргон и англицизмы, добавлено ясное описание программы.
- Синхронизированы подписи внутренних ссылок на обновлённые хабы и трёхнедельный маршрут.
- Пересобраны `manifest.json`, `manifest.csv`, `content.json`, `navigation.json` и отчёт валидации.

После правок среди 244 готовых страниц нет заголовков целиком на английском или испанском. Смешанные заголовки остались только там, где используются понятные официальные сокращения или устоявшиеся термины: CABA, DNI/CUIL/CUIT, eSIM, MEP, NOA и `micros` с русским пояснением.

## Изменённые страницы мест и парков

### Достопримечательности

- `almacenes-de-ramos-generales-en-la-pampa`
- `avistaje-de-aves-en-santa-cruz`
- `buceo-en-las-costas-de-ushuaia`
- `cabalgatas-en-cerro-belvedere-y-cascada-inacayal`
- `cabalgatas-en-la-estepa-de-bariloche`
- `cabalgatas-en-las-sierras-bonaerenses`
- `canon-del-atuel`
- `cascada-nivinco-y-pichi-traful`
- `catamaran-en-la-triple-frontera`
- `caviahue-copahue`
- `cerros-catedral-y-perito-moreno`
- `ciudad-de-corrientes`
- `ciudad-de-salta`
- `colonia-menonita-en-la-pampa`
- `costa-atlantica-bonaerense`
- `el-hoyo`
- `empedrado`
- `kayak-en-bariloche`
- `laberinto-patagonia`
- `lagos-de-tierra-del-fuego`
- `navegacion-en-los-rios-limay-y-neuquen`
- `navegacion-por-el-lago-argentino`
- `newells-old-boys`
- `pueblos-galeses-y-comunidades-originarias`
- `puente-rosario-victoria`
- `rafting-en-el-rio-hua-hum`
- `rafting-en-el-rio-mendoza`
- `reconquista`
- `ruta-40-en-chubut`
- `ruta-de-los-siete-lagos`
- `tradicion-cervecera-en-santa-fe`
- `trekking-en-bosques-y-lagos`
- `trekking-en-tolhuin`
- `valle-de-uco-mendoza`
- `volcan-lanin`

### Парки

- `parque-nacional-bosques-petrificados`
- `parque-nacional-el-leoncito`
- `parque-nacional-islas-de-santa-fe`
- `parque-nacional-laguna-blanca`
- `parque-nacional-los-alerces-patrimonio-de-la-humanidad`
- `parque-nacional-los-cardones`
- `parque-nacional-monte-leon`
- `parque-nacional-san-guillermo`
- `parque-provincial-ischigualasto`

## Навигационные страницы и маршруты

- `gid-puteshestvennika`
- `gid-relokanta`
- `gid-po-dengam`
- `gid-po-dokumentam`
- `gid-po-kulture`
- `gid-po-medicine`
- `gid-po-transportu`
- `gid-po-zhilyu`
- `argentina-10-dney`
- `argentina-2-nedeli`
- `argentina-3-nedeli`

## Редакционные блокеры

Эти проблемы нельзя безопасно закрыть простым добавлением ключевых слов:

- **145 осиротевших записей** не имеют входящих внутренних ссылок. Нужна редакторская привязка к городам, регионам, маршрутам или тематическим хабам.
- **134 коротких опубликованных материала** содержат менее 120 слов. Их следует расширять только по проверенным источникам либо не индексировать до доработки.
- **202 географических заголовка без русской адаптации** остаются в общей базе, преимущественно среди материалов, ещё не готовых к публикации. Их нужно переводить перед переводом в `site_ready`.
- **20 готовых географических страниц без главного изображения** нарушают собственный критерий `site_ready`.
- **27 чувствительных материалов без источников** затрагивают визы, деньги, безопасность, медицину или документы. Их нельзя усиливать новыми утверждениями до фактологической проверки.
- **3 материала с низкой уверенностью** требуют редакторского решения до продвижения.

## Каннибализация — закрыта

Обнаружены и закрыты две пары страниц с одинаковыми пользовательскими заголовками и пересекающимся намерением:

1. `los-cardones` оставлен канонической страницей «Национальный парк Лос-Кардонес»; `parque-nacional-los-cardones` исключён из публичного индекса и постоянно перенаправляется на него.
2. `salta` оставлен канонической страницей города; короткий импорт `ciudad-de-salta` исключён из публичного индекса и постоянно перенаправляется на него.

Основные страницы выбраны по полноте, качеству источников и уже существующей внутренней перелинковке. Постоянные редиректы сохраняют накопленные поисковые сигналы старых адресов.

## Проверки

- Сборка базы знаний: **689 валидных записей**, 0 проблемных файлов, 0 дублей `id`, 0 битых `related`, 0 битых вики-ссылок.
- `npm run audit:quick`: TypeScript — успешно; ESLint — успешно с существующими предупреждениями вне этого набора правок; **199 файлов тестов и 1053 теста — успешно**.
